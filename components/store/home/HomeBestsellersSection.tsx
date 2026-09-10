import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchHomeBestsellersWeek } from "@/lib/fetch-home-bestsellers";
import {
  enrichListingProductsWithVariants,
} from "@/lib/store-listing-variant-meta";
import { getStoreListingCardContext } from "@/lib/store-listing-card-context";
import { StoreBestsellersRow } from "@/components/store/StoreBestsellersRow";

export async function HomeBestsellersSection() {
  const supabase = await createSupabaseServerClient();
  const [bestsellerRows, { couponPctByProductId }] = await Promise.all([
    fetchHomeBestsellersWeek(supabase),
    getStoreListingCardContext(),
  ]);
  const enrichedBestsellers = await enrichListingProductsWithVariants(
    supabase,
    bestsellerRows,
  );

  return (
    <StoreBestsellersRow
      products={enrichedBestsellers}
      couponPctByProductId={couponPctByProductId}
    />
  );
}
