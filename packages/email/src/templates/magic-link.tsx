import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { ReactElement } from "react";

interface MagicLinkEmailProps {
  url: string;
  host: string;
}

export function MagicLinkEmail({ url, host }: MagicLinkEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Seu link mágico para acessar o submitin</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>🔐 submitin</Heading>
          <Section style={section}>
            <Text style={text}>
              Olá! Clique no botão abaixo para acessar sua conta no submitin.
            </Text>
            <Button style={button} href={url}>
              Entrar no submitin
            </Button>
            <Text style={textSecondary}>
              Este link expira em 24 horas e só pode ser usado uma vez.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Se você não solicitou este email, pode ignorá-lo com segurança.
            <br />
            <Link href={host} style={link}>
              {host}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0f172a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#1e293b",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  maxWidth: "480px",
};

const heading = {
  color: "#f8fafc",
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section = {
  padding: "24px",
  backgroundColor: "#334155",
  borderRadius: "8px",
};

const text = {
  color: "#e2e8f0",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 24px",
};

const textSecondary = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "24px 0 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 24px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
};

const hr = {
  borderColor: "#334155",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
};

const link = {
  color: "#10b981",
  textDecoration: "underline",
};

