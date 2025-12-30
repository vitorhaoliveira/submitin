import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import { FileText, Mail, ArrowLeft } from "lucide-react";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-xl">{tCommon("appName")}</span>
          </Link>
        </div>

        <Card className="animate-fade-in-up animation-delay-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("verify.title")}</CardTitle>
            <CardDescription>
              {t("verify.subtitle")}{" "}
              {email ? (
                <span className="font-medium text-foreground">{email}</span>
              ) : (
                ""
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="mb-2">{t("verify.instruction")}</p>
              <p>{t("verify.checkSpam")}</p>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login">
                <Button variant="link" className="p-0 h-auto">
                  {t("verify.resend")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("verify.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
