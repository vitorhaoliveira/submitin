import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { ReactElement } from "react";

interface ResponseConfirmationEmailProps {
  formName: string;
  submittedAt: string;
  customMessage?: string;
}

export function ResponseConfirmationEmail({
  formName,
  submittedAt,
  customMessage,
}: ResponseConfirmationEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Recebemos sua resposta em {formName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Recebemos sua resposta ✓</Heading>
          <Section style={section}>
            <Text style={text}>
              {customMessage ||
                `Obrigado! Sua resposta no formulário "${formName}" foi registrada com sucesso.`}
            </Text>
            <Text style={meta}>Enviada em {submittedAt}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Este é um email automático de confirmação.</Text>
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
  border: "1px solid #e2e8f0",
};

const heading = {
  color: "#4f46e5",
  fontSize: "22px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section = {
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #eef2ff",
};

const text = {
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const meta = {
  color: "#64748b",
  fontSize: "13px",
  margin: "0",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "28px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
};
