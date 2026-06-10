import type { NextRequest } from "next/server";

/** Query `?reason=session_expired` en pantallas de login. */
export const AUTH_SESSION_EXPIRED_REASON = "session_expired";

export const AUTH_SESSION_EXPIRED_MESSAGE =
  "Tu sesión ha finalizado. Inicia sesión de nuevo para continuar.";

export function isAuthSessionExpiredReason(
  value: string | null | undefined,
): boolean {
  return value === AUTH_SESSION_EXPIRED_REASON;
}

/** Cookies de Supabase Auth aún presentes (sesión caducada o inválida). */
export function requestLikelyHadSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name;
    return name.startsWith("sb-") && name.includes("auth");
  });
}

type LoginHrefOpts = {
  sessionExpired?: boolean;
  next?: string;
};

export function adminLoginHref(opts: LoginHrefOpts = {}): string {
  const params = new URLSearchParams();
  if (opts.sessionExpired) {
    params.set("reason", AUTH_SESSION_EXPIRED_REASON);
  }
  const qs = params.toString();
  return qs ? `/admin/login?${qs}` : "/admin/login";
}

export function storeLoginHref(opts: LoginHrefOpts = {}): string {
  const params = new URLSearchParams();
  if (opts.sessionExpired) {
    params.set("reason", AUTH_SESSION_EXPIRED_REASON);
  }
  if (opts.next) {
    params.set("next", opts.next);
  }
  const qs = params.toString();
  return qs ? `/cuenta/entrar?${qs}` : "/cuenta/entrar";
}

export function isAdminProtectedPath(path: string): boolean {
  return path.startsWith("/admin") && !path.startsWith("/admin/login");
}

export function isStoreAccountProtectedPath(path: string): boolean {
  return (
    (path === "/cuenta" || path.startsWith("/cuenta/")) &&
    path !== "/cuenta/entrar" &&
    path !== "/cuenta/registro"
  );
}
