import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { getStorefrontCartQuantityByProductId } from "@/lib/storefront-cart";

/** Carrito + cupones por request (deduplicado entre secciones con Suspense). */
export const getStoreListingCardContext = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const [cartQtyByProductId, couponPctByProductId] = await Promise.all([
    getStorefrontCartQuantityByProductId(),
    fetchStorefrontCouponDiscountPercentByProductId(supabase),
  ]);
  return { cartQtyByProductId, couponPctByProductId };
});
