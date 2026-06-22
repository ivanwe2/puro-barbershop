import { env } from "@/lib/env";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactNode } from "react";

export interface EmailClient {
  send(options: { to: string; subject: string; react: ReactNode }): Promise<void>;
}

export class ResendEmailClient implements EmailClient {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async send({
    to,
    subject,
    react,
  }: {
    to: string;
    subject: string;
    react: ReactNode;
  }): Promise<void> {
    const html = await render(react, { pretty: true });
    const { error } = await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });

    if (error) {
      throw error;
    }
  }
}

export class SmtpEmailClient implements EmailClient {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST ?? "localhost",
      port: env.SMTP_PORT ?? 1025,
      secure: false,
    });
  }

  async send({
    to,
    subject,
    react,
  }: {
    to: string;
    subject: string;
    react: ReactNode;
  }): Promise<void> {
    const html = await render(react, { pretty: true });
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });
  }
}

export function createEmailClient(): EmailClient {
  if (env.EMAIL_TRANSPORT === "resend") {
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required in production with EMAIL_TRANSPORT=resend");
    }
    return new ResendEmailClient();
  }

  return new SmtpEmailClient();
}
