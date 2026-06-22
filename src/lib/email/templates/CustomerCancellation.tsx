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

interface CustomerCancellationProps {
  name: string;
  date: string;
  time: string;
  serviceName: string;
  address: string;
  phone: string;
}

export function CustomerCancellation({
  name,
  date,
  time,
  serviceName,
  address,
  phone,
}: CustomerCancellationProps) {
  return (
    <Html>
      <Head />
      <Preview>Booking Cancelled — Puro Barbershop</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Booking Cancelled</Heading>
          <Text style={text}>Hello, {name}!</Text>
          <Text style={text}>Your booking has been cancelled:</Text>
          <Section style={detailsSection}>
            <Text style={detailRow}>
              <strong>Service:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={detailRow}>
              <strong>Time:</strong> {time}
            </Text>
          </Section>
          <Text style={text}>
            If you&apos;d like to book again, visit us at:
            <br />
            {address}
            <br />
            {phone}
          </Text>
          <Text style={footer}>Puro Barbershop</Text>
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

const footer = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "24px 0 0 0",
};
