import { createEmailClient } from "./client";
import {
  CustomerConfirmation,
  BarberNotification,
  CustomerCancellation,
  CustomerReminder,
} from "./templates";

const emailClient = createEmailClient();

interface SendBookingConfirmationParams {
  to: string;
  name: string;
  date: string;
  time: string;
  serviceName: string;
  barberName: string;
  cancellationLink: string;
  address: string;
  phone: string;
}

interface SendBarberNotificationParams {
  to: string;
  barberName: string;
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  customerPhone: string;
}

interface SendCancellationEmailParams {
  to: string;
  name: string;
  date: string;
  time: string;
  serviceName: string;
  address: string;
  phone: string;
}

interface SendReminderParams {
  to: string;
  name: string;
  date: string;
  time: string;
  serviceName: string;
  barberName: string;
  cancellationLink: string;
  address: string;
}

export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams,
): Promise<void> {
  try {
    await emailClient.send({
      to: params.to,
      subject: "Booking Confirmation — Puro Barbershop",
      react: <CustomerConfirmation {...params} />,
    });
  } catch (error) {
    console.error("[email] Failed to send booking confirmation:", error);
  }
}

export async function sendBarberNotification(params: SendBarberNotificationParams): Promise<void> {
  try {
    await emailClient.send({
      to: params.to,
      subject: "New Booking — Puro Barbershop",
      react: <BarberNotification {...params} />,
    });
  } catch (error) {
    console.error("[email] Failed to send barber notification:", error);
  }
}

export async function sendCancellationEmail(params: SendCancellationEmailParams): Promise<void> {
  try {
    await emailClient.send({
      to: params.to,
      subject: "Booking Cancelled — Puro Barbershop",
      react: <CustomerCancellation {...params} />,
    });
  } catch (error) {
    console.error("[email] Failed to send cancellation email:", error);
  }
}

export async function sendReminder(params: SendReminderParams): Promise<void> {
  try {
    await emailClient.send({
      to: params.to,
      subject: "Booking Reminder — Puro Barbershop",
      react: <CustomerReminder {...params} />,
    });
  } catch (error) {
    console.error("[email] Failed to send reminder:", error);
  }
}
