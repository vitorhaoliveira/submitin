import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { ReactElement } from "react";

interface DocumentCopyEmailProps {
  documentName: string;
  /** Marca da empresa (nome/logo da conta), se configurada. */
  brandName?: string;
  brandLogoUrl?: string;
  fileName: string;
}

/** Cópia do documento gerado para quem preencheu o formulário. */
export function DocumentCopyEmail({
  documentName,
  brandName,
  brandLogoUrl,
  fileName,
}: DocumentCopyEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Sua cópia de {documentName} está em anexo</Preview>
      <Body style={main}>
        <Container style={container}>
          {(brandLogoUrl || brandName) && (
            <Section style={brand}>
              {brandLogoUrl && <Img src={brandLogoUrl} alt={brandName ?? ""} height="40" style={logo} />}
              {brandName && <Text style={brandText}>{brandName}</Text>}
            </Section>
          )}
          <Heading style={heading}>Seu documento está pronto</Heading>
          <Section style={section}>
            <Text style={text}>
              Obrigado por preencher. Segue em anexo a sua cópia de <strong>{documentName}</strong>
              {brandName ? (
                <>
                  , enviada para <strong>{brandName}</strong>
                </>
              ) : null}
              .
            </Text>
            <Text style={meta}>📎 {fileName}</Text>
          </Section>
          <Text style={note}>
            Encontrou algum erro? Responda este e-mail{brandName ? ` para falar com ${brandName}` : ""}.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Você recebe este e-mail porque preencheu um formulário{brandName ? ` de ${brandName}` : ""}.
            Enviado com Submitin.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 24px",
  borderRadius: "12px",
  maxWidth: "480px",
};

const brand = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo = {
  display: "inline-block",
  maxWidth: "160px",
  height: "40px",
  objectFit: "contain" as const,
};

const brandText = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "600" as const,
  margin: "8px 0 0",
};

const heading = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section = {
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
};

const text = {
  color: "#1e293b",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const meta = {
  color: "#4f46e5",
  fontSize: "13px",
  margin: "0",
  textAlign: "center" as const,
};

const note = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
  margin: "24px 0 0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
};
