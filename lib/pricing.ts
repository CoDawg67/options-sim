import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { siteConfig } from "@/config/site";

// First N paid listings get a discount in exchange for a logo + testimonial
// (Phase 2.75). Once that batch fills, checkout automatically reverts to
// full price — no manual flag flip needed.
export const FOUNDING_MEMBER_LIMIT = 15;
export const FOUNDING_MEMBER_PRICE_CENTS = 9900; // $99

export async function getListingPrice(
  supabase: SupabaseClient<Database>
): Promise<{ amountCents: number; isFoundingMember: boolean }> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product", "listing")
    .eq("status", "paid");

  if (error) throw error;

  const paidListings = count ?? 0;
  if (paidListings < FOUNDING_MEMBER_LIMIT) {
    return { amountCents: FOUNDING_MEMBER_PRICE_CENTS, isFoundingMember: true };
  }
  return { amountCents: siteConfig.listingPriceCents, isFoundingMember: false };
}
