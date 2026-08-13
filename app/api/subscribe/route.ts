import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { logEmailSend } from "@/lib/email-quota";
import { siteConfig } from "@/config/site";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.string().optional(),
  city: z.string().optional(),
  remote: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { email, ...filters } = parsed;
  const supabase = createAdminClient();
  const confirmToken = randomBytes(24).toString("hex");

  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { email, filters, confirm_token: confirmToken, confirmed_at: null, unsubscribed_at: null },
      { onConflict: "email" }
    );

  if (error) {
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }

  const confirmUrl = `${siteConfig.domain}/api/subscribe/confirm?token=${confirmToken}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Confirm your ${siteConfig.name} alert`,
      html: `
        <p>One click to confirm your job alert on ${siteConfig.name}:</p>
        <p><a href="${confirmUrl}">Confirm subscription</a></p>
        <p style="color:#888;font-size:12px;">If you didn't request this, ignore this email — nothing happens until you click confirm.</p>
      `,
    });
    await logEmailSend(supabase, "confirm", email);
  } catch {
    // Row is saved either way — confirmation email failing shouldn't surface as a form error.
  }

  return NextResponse.json({ ok: true });
}
