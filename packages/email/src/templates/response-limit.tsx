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

interface ResponseLimitEmailProps {
  limit: number;
  /** Ex.: "1º de outubro" — quando o limite renova. */
  resetsOn: string;
  billingUrl: string;
}

/** Aviso mensal: formulários avulsos atingiram as respostas do plano. */
export function ResponseLimitEmail({ limit, resetsOn, billingUrl }: ResponseLimitEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Seus formulários atingiram o limite de {String(limit)} respostas deste mês</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Limite de respostas atingido</Heading>
          <Section style={section}>
            <Text style={text}>
              Seus formulários receberam as <strong>{limit.toLocaleString("pt-BR")} respostas</strong>{" "}
              incluídas no plano neste mês.
            </Text>
            <Text style={text}>
              Até {resetsOn}, quem abrir seus formulários vai vê-los como encerrados. Os documentos
              não são afetados.
            </Text>
            <Text style={text}>Para voltar a receber respostas agora, faça o upgrade do plano.</Text>
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
