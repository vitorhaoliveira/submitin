import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { ReactElement } from "react";

interface DocumentUsageWarningEmailProps {
  used: number;
  limit: number;
  /** Ex.: "1º de outubro" — quando o contador zera. */
  resetsOn: string;
  billingUrl: string;
}

/** Aviso mensal: a conta passou de 80% dos documentos do plano. */
export function DocumentUsageWarningEmail({
  used,
  limit,
  resetsOn,
  billingUrl,
}: DocumentUsageWarningEmailProps): ReactElement {
  const left = Math.max(0, limit - used);
  return (
    <Html>
      <Head />
      <Preview>
        Você já usou {String(used)} de {String(limit)} documentos deste mês
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Seus documentos do mês estão acabando</Heading>
          <Section style={section}>
            <Text style={text}>
              Sua conta já gerou <strong>{used} de {limit} documentos</strong> incluídos no plano neste mês.
              Restam {left}.
            </Text>
            <Text style={text}>
              Se o limite for atingido, as respostas continuam chegando e ficam salvas — os PDFs saem assim que
              você fizer o upgrade. O contador zera em {resetsOn}.
            </Text>
            <Section style={buttonSection}>
              <Button style={button} href={billingUrl}>
                Ver planos
              </Button>
            </Section>
          </Section>
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
  color: "#b45309",
  fontSize: "22px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section = {
  padding: "24px",
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
};

const text = {
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  marginTop: "20px",
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
