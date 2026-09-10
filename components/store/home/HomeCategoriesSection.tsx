import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchHomeCategoryCards } from "@/lib/fetch-home-categories";
import { StoreNetflixCategories } from "@/components/store/StoreNetflixCategories";

export async function HomeCategoriesSection() {
  const supabase = await createSupabaseServerClient();
  const homeCategories = await fetchHomeCategoryCards(supabase);
  return <StoreNetflixCategories categories={homeCategories} />;
}
