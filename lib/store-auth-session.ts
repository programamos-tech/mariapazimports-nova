import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sesión para UI del header (cuenta vs entrar).
 * El middleware ya refrescó cookies con getUser(); getSession evita un segundo round-trip al auth server.
 */
export const getStoreAuthSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});
