import Link from "next/link";

function IconSearch(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className={props.className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.2-1.7c.6.6.8 1.5.5 2.3-.4 1-1.2 1.4-1.7 2.1-.2.3-.3.6-.3 1.1V14" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <path d="M4 12h3l2-6 4 12 2-6h5" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" className="size-5" aria-hidden>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M9 17h6M7 13H5m14-4h-4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "?";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Admin";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type Props = {
  userEmail: string;
};

export function AdminTopBar({ userEmail }: Props) {
  const initials = userEmail ? initialsFromEmail(userEmail) : "?";
  const name = userEmail ? displayNameFromEmail(userEmail) : "Admin";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-white">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <div className="hidden w-40 shrink-0 md:block" aria-hidden />

        <div className="flex min-w-0 flex-1 justify-center">
          <form
            action="/admin/products"
            method="get"
            className="w-full max-w-xl"
            role="search"
          >
            <label htmlFor="admin-global-search" className="sr-only">
              Buscar en productos
            </label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400" />
              <input
                id="admin-global-search"
                name="q"
                type="search"
                placeholder="Buscar producto por código o nombre…"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/admin"
            className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 sm:inline-flex"
          >
            BackOffice
          </Link>
          <Link
            href="/admin/ventas/nueva"
            className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-lg font-light leading-none text-white shadow-sm transition hover:bg-zinc-800 sm:size-10"
            title="Nueva factura"
          >
            +
          </Link>
          <div className="ml-0.5 hidden items-center gap-0.5 border-l border-zinc-200 pl-2 sm:flex">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Ayuda"
            >
              <IconHelp />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Actividad"
            >
              <IconPulse />
            </button>
            <Link
              href="/admin/settings"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Ajustes"
            >
              <IconSliders />
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Notificaciones"
            >
              <IconBell />
            </button>
          </div>

          <div className="ml-1 flex items-center gap-2.5 rounded-xl py-1 pl-2 pr-1 sm:border sm:border-zinc-200 sm:bg-zinc-50/50">
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
              <p className="text-[11px] font-medium text-zinc-500">Propietario</p>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 sm:size-10 sm:text-sm">
              {initials}
            </span>
            <span className="hidden text-zinc-400 lg:inline" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
