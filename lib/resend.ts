import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "jobs@mlopsjobs.example.com";
