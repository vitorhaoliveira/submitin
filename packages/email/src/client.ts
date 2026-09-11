import { Resend } from "resend";
import type { ReactElement } from "react";

/**
 * Instância do cliente Resend.
 * Segue as práticas recomendadas da Resend para Next.js API Routes (Vercel Functions).
 * 
 * IMPORTANTE: Este projeto usa Next.js API Routes, não Supabase Edge Functions.
 * A documentação da Resend para Supabase Edge Functions usa Deno e chamadas diretas à API REST,
 * mas aqui usamos o SDK do Resend com Node.js, que é o padrão para Next.js.
 * 
 * @see https://resend.com/docs/send-with-vercel-functions
 */
export const resend = new Resend(process.env.AUTH_RESEND_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: { filename: string; content: Buffer }[];
}

/**
 * Valida o formato do email FROM conforme documentação Resend
 * Formato esperado: "Nome <email@dominio.com>" ou "email@dominio.com"
 */
function validateFromFormat(from: string): boolean {
  // Formato simples: email@dominio.com
  const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Formato com nome: "Nome <email@dominio.com>"
  const withNameRegex = /^[^<]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
  
  return simpleEmailRegex.test(from) || withNameRegex.test(from);
}

/**
 * Extrai o domínio do email FROM
 */
function extractDomain(from: string): string | null {
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
  if (emailMatch) {
    const email = emailMatch[1] || emailMatch[0];
    const domain = email.split("@")[1];
    return domain || null;
  }
  return null;
}

export async function sendEmail({ to, subject, react, attachments }: SendEmailOptions) {
  const fromEmail = process.env.AUTH_EMAIL_FROM || "Submitin <no-reply@submitin.com>";
  
  if (!fromEmail) {
    throw new Error(
      "AUTH_EMAIL_FROM não está configurado. Configure a variável de ambiente com o formato: 'Nome <email@seu-dominio.com>' ou 'email@seu-dominio.com'. " +
      "IMPORTANTE: O domínio deve estar verificado na Resend com SPF e DKIM configurados. " +
      "Se você migrou para Supabase/Vercel, certifique-se de configurar as variáveis no painel de configuração do seu provedor."
    );
  }
  
  // Valida se a API key está configurada
  if (!process.env.AUTH_RESEND_KEY) {
    throw new Error(
      "AUTH_RESEND_KEY não está configurado. Configure a variável de ambiente com sua API key da Resend. " +
      "Se você migrou para Supabase/Vercel, adicione AUTH_RESEND_KEY nas configurações de variáveis de ambiente do seu projeto."
    );
  }

  // Valida o formato do email FROM
  if (!validateFromFormat(fromEmail)) {
    throw new Error(
      `Formato inválido de AUTH_EMAIL_FROM: "${fromEmail}". ` +
      `Use o formato: "Nome <email@dominio.com>" ou "email@dominio.com"`
    );
  }

  // Extrai e valida o domínio
  const domain = extractDomain(fromEmail);
  if (!domain) {
    throw new Error(`Não foi possível extrair o domínio de: "${fromEmail}"`);
  }

  // Aviso sobre domínios não verificados (apenas em desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `⚠️  Verifique se o domínio "${domain}" está verificado na Resend Dashboard. ` +
      `O domínio precisa ter os registros SPF e DKIM configurados corretamente no DNS. ` +
      `Veja: https://resend.com/docs/dashboard/domains/introduction`
    );
  }

  const { data, error } = await resend.emails.send({  
    from: fromEmail,
    to,
    subject,
    react,
    attachments,
  });

  if (error) {
    // Melhora o tratamento de erros com informações mais específicas
    const errorMessage = error.message || "Erro desconhecido ao enviar email";
    
    // Erros comuns relacionados a domínio não verificado
    if (
      errorMessage.includes("domain") ||
      errorMessage.includes("verification") ||
      errorMessage.includes("SPF") ||
      errorMessage.includes("DKIM")
    ) {
      console.error("❌ Erro de verificação de domínio:", error);
      throw new Error(
        `Falha ao enviar email: O domínio "${domain}" pode não estar verificado na Resend. ` +
        `Verifique se os registros SPF e DKIM estão configurados corretamente no DNS. ` +
        `Acesse o dashboard da Resend para verificar o status do domínio.`
      );
    }
    
    console.error("❌ Falha ao enviar email:", error);
    throw new Error(`Falha ao enviar email: ${errorMessage}`);
  }
  console.log("✅ Email enviado com sucesso:", data);
  return data;
}

