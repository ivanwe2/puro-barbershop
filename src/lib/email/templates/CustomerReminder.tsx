import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStrings, type EmailLocale } from "../i18n";

interface CustomerReminderProps {
  name: string;
  date: string;
  time: string;
  serviceName: string;
  barberName: string;
  cancellationLink: string;
  address: string;
  locale?: EmailLocale;
}

export function CustomerReminder({
  name,
  time,
  serviceName,
  barberName,
  cancellationLink,
  address,
  locale = "bg",
}: CustomerReminderProps) {
  const s = emailStrings(locale);
  return (
    <Html>
      <Head />
      <Preview>{s.subjects.reminder}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{s.reminder.title}</Heading>
          <Text style={text}>{s.greeting(name)}</Text>
          <Text style={text}>{s.reminder.intro}</Text>
          <Section style={detailsSection}>
            <Text style={detailRow}>
              <strong>{s.labels.service}:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>{s.labels.barber}:</strong> {barberName}
            </Text>
            <Text style={detailRow}>
              <strong>{s.labels.time}:</strong> {time}
            </Text>
          </Section>
          <Text style={text}>{address}</Text>
          <Button style={button} href={cancellationLink}>
            {s.reminder.cancelButton}
          </Button>
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

const button = {
  backgroundColor: "#c9a961",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "100%",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "block",
  margin: "16px 0",
};

const footer = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "24px 0 0 0",
};
