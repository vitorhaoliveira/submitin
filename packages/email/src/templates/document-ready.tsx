import {
  Body,
  Button,
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

interface DocumentReadyEmailProps {
  documentName: string;
  /** Identificador da submissão (ex.: nome do aluno). */
  identifier?: string;
  submittedAt: string;
  submissionsUrl: string;
}

export function DocumentReadyEmail({
  documentName,
  identifier,
  submittedAt,
  submissionsUrl,
}: DocumentReadyEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>
        {documentName}
        {identifier ? ` — ${identifier}` : ""} (PDF em anexo)
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Documento pronto 📄</Heading>
          <Section style={section}>
            <Text style={text}>
              Um novo <strong>{documentName}</strong> foi preenchido
              {identifier ? (
                <>
                  {" "}
                  por <strong>{identifier}</strong>
                </>
              ) : null}
              . O PDF está em anexo neste e-mail.
            </Text>
            <Text style={meta}>Enviado em {submittedAt}</Text>
            <Section style={buttonSection}>
              <Button style={button} href={submissionsUrl}>
                Ver todos os envios
              </Button>
            </Section>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Você recebe este e-mail porque está na lista de entrega deste documento no Submitin.
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
};

const text = {
  color: "#1e293b",
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

const buttonSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  padding: "12px 28px",
  textDecoration: "none",
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
