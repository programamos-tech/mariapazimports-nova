"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  adminLoginHref,
  isAdminProtectedPath,
  isStoreAccountProtectedPath,
  storeLoginHref,
} from "@/lib/auth-session";

/** Si la sesión caduca en una ruta protegida, lleva al login con aviso. */
export function AuthSessionWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function redirectExpiredSession() {
      const path = window.location.pathname;
      const search = window.location.search;

      if (isAdminProtectedPath(path)) {
        window.location.assign(adminLoginHref({ sessionExpired: true }));
        return;
      }

      if (isStoreAccountProtectedPath(path)) {
        window.location.assign(
          storeLoginHref({
            sessionExpired: true,
            next: path + search,
          }),
        );
      }
    }

    async function verifySession() {
      const path = window.location.pathname;
      if (!isAdminProtectedPath(path) && !isStoreAccountProtectedPath(path)) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirectExpiredSession();
      }
    }

    window.addEventListener("focus", verifySession);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    });

    return () => {
      window.removeEventListener("focus", verifySession);
    };
  }, [pathname]);

  return null;
}
