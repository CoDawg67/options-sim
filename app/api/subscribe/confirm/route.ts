import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(`${siteConfig.domain}/?subscribed=error`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .is("unsubscribed_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) return NextResponse.redirect(`${siteConfig.domain}/?subscribed=error`);

  return NextResponse.redirect(`${siteConfig.domain}/?subscribed=confirmed`);
}
