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
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface NewResponseEmailProps {
  formName: string;
  formUrl: string;
  responseCount: number;
  submittedAt: string;
}

export function NewResponseEmail({
  formName,
  formUrl,
  responseCount,
  submittedAt,
}: NewResponseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nova resposta recebida em {formName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nova Resposta!</Heading>
          <Section style={section}>
            <Text style={text}>
              Você recebeu uma nova resposta no formulário{" "}
              <strong>{formName}</strong>.
            </Text>
            <Section style={statsSection}>
              <Row>
                <Column style={statColumn}>
                  <Text style={statNumber}>{responseCount}</Text>
                  <Text style={statLabel}>Total de respostas</Text>
                </Column>
                <Column style={statColumn}>
                  <Text style={statNumber}>{submittedAt}</Text>
                  <Text style={statLabel}>Data do envio</Text>
                </Column>
              </Row>
            </Section>
            <Section style={buttonSection}>
              <Button style={button} href={formUrl}>
                Ver Respostas
              </Button>
            </Section>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Para parar de receber estas notificações, ajuste as configurações do
            formulário.
            <br />
            <Link href={formUrl} style={link}>
              Gerenciar formulário
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
  padding: "40px 0",
};

const container = {
  backgroundColor: "#1e293b",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  maxWidth: "480px",
};

const heading = {
  color: "#10b981",
  fontSize: "24px",
  fontWeight: "bold" as const,
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
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const statsSection = {
  margin: "24px 0",
};

const statColumn = {
  textAlign: "center" as const,
  width: "50%",
};

const statNumber = {
  color: "#10b981",
  fontSize: "20px",
  fontWeight: "bold" as const,
  margin: "0 0 4px",
};

const statLabel = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const buttonSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  padding: "14px 32px",
  textDecoration: "none",
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
