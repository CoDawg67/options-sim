import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

// One-click unsubscribe — GET so it works as a plain email link with no
// confirmation page/JS required, per the brief ("one-click unsubscribe link
// in every email").
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(`${siteConfig.domain}/?unsubscribed=error`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .select("id")
    .maybeSingle();

  if (error || !data) return NextResponse.redirect(`${siteConfig.domain}/?unsubscribed=error`);

  return NextResponse.redirect(`${siteConfig.domain}/?unsubscribed=done`);
}
