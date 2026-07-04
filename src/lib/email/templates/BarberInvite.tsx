import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStrings, type EmailLocale } from "../i18n";

interface BarberInviteProps {
  barberName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  locale?: EmailLocale;
}

export function BarberInvite({
  barberName,
  email,
  tempPassword,
  loginUrl,
  locale = "bg",
}: BarberInviteProps) {
  const s = emailStrings(locale);
  return (
    <Html>
      <Head />
      <Preview>{s.subjects.invite}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{s.invite.title}</Heading>
          <Text style={text}>{s.invite.greeting(barberName)}</Text>
          <Text style={text}>{s.invite.body}</Text>
          <Section style={detailsSection}>
            <Text style={detailRow}>
              <strong>{s.labels.email}:</strong> {email}
            </Text>
            <Text style={detailRow}>
              <strong>{s.labels.tempPassword}:</strong> {tempPassword}
            </Text>
            <Text style={detailRow}>
              <strong>{s.labels.login}:</strong> {loginUrl}
            </Text>
          </Section>
          <Text style={importantNote}>{s.invite.changePassword}</Text>
          <Text style={footer}>{s.brand}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #eaeaea",
  borderRadius: "4px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  maxWidth: "480px",
  margin: "40px auto",
  padding: "32px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
  letterSpacing: "-0.02em",
};

const text = {
  color: "#1a1a1a",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const detailsSection = {
  backgroundColor: "#f7f3ec",
  borderRadius: "4px",
  padding: "16px 20px",
  margin: "0 0 16px 0",
};

const detailRow = {
  color: "#1a1a1a",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px 0",
};

const importantNote = {
  color: "#c9a961",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
};

const footer = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "24px 0 0 0",
};
