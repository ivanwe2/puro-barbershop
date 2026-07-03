import { createEmailClient } from "./client";
import {
  CustomerConfirmation,
  BarberNotification,
  CustomerCancellation,
  CustomerReminder,
  BarberInvite,
} from "./templates";
import { emailStrings, type EmailLocale } from "./i18n";

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
  locale?: EmailLocale;
}

interface SendBarberNotificationParams {
  to: string;
  barberName: string;
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  customerPhone: string;
  locale?: EmailLocale;
}

interface SendCancellationEmailParams {
  to: string;
  name: string;
  date: string;
  time: string;
  serviceName: string;
  address: string;
  phone: string;
  locale?: EmailLocale;
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
  locale?: EmailLocale;
}

export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams,
): Promise<void> {
  const locale = params.locale ?? "bg";
  try {
    await emailClient.send({
      to: params.to,
      subject: emailStrings(locale).subjects.confirmation,
      react: <CustomerConfirmation {...params} locale={locale} />,
    });
  } catch (error) {
    console.error("[email] Failed to send booking confirmation:", error);
  }
}

export async function sendBarberNotification(params: SendBarberNotificationParams): Promise<void> {
  const locale = params.locale ?? "bg";
  try {
    await emailClient.send({
      to: params.to,
      subject: emailStrings(locale).subjects.notification,
      react: <BarberNotification {...params} locale={locale} />,
    });
  } catch (error) {
    console.error("[email] Failed to send barber notification:", error);
  }
}

export async function sendCancellationEmail(params: SendCancellationEmailParams): Promise<void> {
  const locale = params.locale ?? "bg";
  try {
    await emailClient.send({
      to: params.to,
      subject: emailStrings(locale).subjects.cancellation,
      react: <CustomerCancellation {...params} locale={locale} />,
    });
  } catch (error) {
    console.error("[email] Failed to send cancellation email:", error);
  }
}

export async function sendReminder(params: SendReminderParams): Promise<void> {
  const locale = params.locale ?? "bg";
  try {
    await emailClient.send({
      to: params.to,
      subject: emailStrings(locale).subjects.reminder,
      react: <CustomerReminder {...params} locale={locale} />,
    });
  } catch (error) {
    console.error("[email] Failed to send reminder:", error);
  }
}

interface SendBarberInviteParams {
  to: string;
  barberName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  locale?: EmailLocale;
}

export async function sendBarberInvite(params: SendBarberInviteParams): Promise<void> {
  const locale = params.locale ?? "bg";
  try {
    await emailClient.send({
      to: params.to,
      subject: emailStrings(locale).subjects.invite,
      react: <BarberInvite {...params} locale={locale} />,
    });
  } catch (error) {
    console.error("[email] Failed to send barber invite:", error);
  }
}
