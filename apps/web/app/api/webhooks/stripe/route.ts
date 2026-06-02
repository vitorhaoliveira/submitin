import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@submitin/database";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ No signature in headers");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:");
      console.error("  → Error:", err instanceof Error ? err.message : err);
      console.error("  → Webhook secret being used:", webhookSecret?.substring(0, 20) + "...");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.userId || session.client_reference_id;

          if (!userId) {
            console.error("❌ No userId found in session metadata");
            console.error("  → session.metadata:", JSON.stringify(session.metadata));
            console.error("  → session.client_reference_id:", session.client_reference_id);
            break;
          }

          // Get subscription details
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

          // Plano derivado do price ID da assinatura (plus/premium)
          const priceId = subscription.items.data[0]?.price.id || "";
          const plan = planFromPriceId(priceId);

          // Update user with subscription info
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: false,
            },
          });

          // Create subscription record
          const subscriptionCreateData: any = {
            user: { connect: { id: userId } },
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            status: subscription.status,
            plan,
          };

          if (typeof subscription.current_period_start === "number") {
            subscriptionCreateData.stripeCurrentPeriodStart = new Date(
              subscription.current_period_start * 1000
            );
          }
          if (typeof subscription.current_period_end === "number") {
            subscriptionCreateData.stripeCurrentPeriodEnd = new Date(
              subscription.current_period_end * 1000
            );
          }

          await prisma.subscription.create({
            data: subscriptionCreateData,
          });

        } else {
          console.log("  → Skipping: not a subscription checkout");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription: any = event.data.object;

        // Find user by subscription ID
        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Plano derivado do price ID atual; ativo/trial mantém o plano, senão free.
        const updatedPriceId = subscription.items?.data?.[0]?.price?.id || "";
        const updatedPlan = planFromPriceId(updatedPriceId);
        const isActive =
          subscription.status === "active" || subscription.status === "trialing";

        // Update user subscription status
        const userUpdateData: any = {
          plan: isActive ? updatedPlan : "free",
          stripePriceId: updatedPriceId,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        };
        if (typeof subscription.current_period_end === "number") {
          userUpdateData.stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        await prisma.user.update({
          where: { id: user.id },
          data: userUpdateData,
        });

        // Update subscription record
        const subscriptionUpdateData: any = {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt:
            typeof subscription.canceled_at === "number"
              ? new Date(subscription.canceled_at * 1000)
              : null,
        };
        if (typeof subscription.current_period_start === "number") {
          subscriptionUpdateData.stripeCurrentPeriodStart = new Date(
            subscription.current_period_start * 1000
          );
        }
        if (typeof subscription.current_period_end === "number") {
          subscriptionUpdateData.stripeCurrentPeriodEnd = new Date(
            subscription.current_period_end * 1000
          );
        }
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: subscriptionUpdateData,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;

        // Find user by subscription ID
        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Downgrade user to free plan
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            stripeCurrentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });

        // Update subscription record
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        });

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice: any = event.data.object;

        if (invoice.subscription) {
          const subscription: any = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const user = await prisma.user.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            // Record payment
            await prisma.paymentHistory.create({
              data: {
                userId: user.id,
                stripePaymentIntentId: invoice.payment_intent as string,
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: "succeeded",
                description: invoice.lines.data[0]?.description || "Pro Subscription",
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice: any = event.data.object;

        if (invoice.subscription) {
          const subscription: any = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const user = await prisma.user.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            // Record failed payment
            await prisma.paymentHistory.create({
              data: {
                userId: user.id,
                stripePaymentIntentId: (invoice.payment_intent as string) || "",
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: "failed",
                description: "Payment failed",
              },
            });
          }
        }
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
