import { Resend } from "resend";

export const resend = new Resend(process.env.AUTH_RESEND_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Form Builder <noreply@formbuilder.dev>",
    to,
    subject,
    react,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }

  return data;
}

