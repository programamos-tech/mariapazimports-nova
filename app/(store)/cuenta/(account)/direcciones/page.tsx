import { StoreAccountProfileEditor } from "@/components/store/StoreAccountProfileEditor";
import { StoreAddressesManager } from "@/components/store/StoreAddressesManager";
import { StoreBirthDateForm } from "@/components/store/StoreBirthDateForm";
import { storeBtnSecondaryClass } from "@/components/store/store-ui-primitives";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storeBrand, storeSupportEmail } from "@/lib/brand";

export const metadata = {
  title: "Ajustes",
};

export const dynamic = "force-dynamic";

const cardClass =
  "border border-stone-200 bg-white px-6 py-8 sm:px-8 sm:py-9";
const cardTitle =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900";
const labelMuted = "text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500";
const valueText = "mt-1 text-sm text-stone-900";
const dateInputClass =
  "mt-2 w-full max-w-[12rem] rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400/25";

function formatBirthDisplay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CuentaDireccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ cumple?: string; perfil?: string }>;
}) {
  const sp = await searchParams;
  const cumple = typeof sp.cumple === "string" ? sp.cumple : undefined;
  const perfil = typeof sp.perfil === "string" ? sp.perfil : undefined;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata as { full_name?: string } | undefined;

  const { data: customer } = await supabase
    .from("customers")
    .select("name, email, phone, shipping_city, birth_date")
    .maybeSingle();

  const displayName =
    customer?.name?.trim() ||
    meta?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "";
  const email = user?.email ?? customer?.email ?? "—";
  const phone =
    customer?.phone != null ? String(customer.phone).trim() : "";
  const city =
    customer?.shipping_city != null
      ? String(customer.shipping_city).trim()
      : "";

  const birthIso =
    customer?.birth_date != null && String(customer.birth_date).trim() !== ""
      ? String(customer.birth_date).slice(0, 10)
      : "";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-stone-900 sm:text-[15px] sm:tracking-[0.26em]">
        Ajustes
      </h1>

      <article className={cardClass}>
        <h2 className={cardTitle}>Perfil</h2>
        <div className="mt-8">
          <StoreAccountProfileEditor
            initialName={displayName}
            email={email}
            initialPhone={phone}
            initialCity={city}
            flash={perfil}
          />
        </div>

        <div className="mt-10 border-t border-stone-100 pt-8">
          <p className={labelMuted}>Cumpleaños</p>
          {birthIso ? (
            <p className={valueText}>
              Registrado:{" "}
              <span className="font-medium">{formatBirthDisplay(birthIso)}</span>
            </p>
          ) : (
            <p className={`${valueText} text-stone-600`}>
              Todavía no registramos tu fecha. Guardala abajo para recibir un
              saludo especial.
            </p>
          )}
          {cumple === "invalid" || cumple === "db" || cumple === "forbidden" ? (
            <p className="mt-3 rounded-lg border border-red-200/90 bg-red-50/90 px-3 py-2 text-xs font-medium text-red-900">
              {cumple === "invalid"
                ? "Revisá la fecha (debe ser válida y no futura)."
                : cumple === "forbidden"
                  ? "Esta acción no está disponible para tu tipo de usuario."
                  : "No pudimos guardar. Intentá de nuevo."}
            </p>
          ) : null}
          {cumple === "ok" ? (
            <p className="mt-3 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-900">
              Fecha de cumpleaños guardada.
            </p>
          ) : null}
          <StoreBirthDateForm
            defaultValue={birthIso}
            next="/cuenta/direcciones"
            inputClassName={dateInputClass}
          />
        </div>
      </article>

      <article className={cardClass}>
        <StoreAddressesManager variant="settings" />
      </article>

      <article className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className={cardTitle}>Preferencias de correo</h2>
          <a
            href={`mailto:${storeSupportEmail}?subject=${encodeURIComponent("Preferencias de correo")}`}
            className={storeBtnSecondaryClass}
          >
            Contactar
          </a>
        </div>
        <p className="mt-8 text-sm leading-relaxed text-stone-600">
          Recibís novedades y comunicaciones de{" "}
          <span className="font-medium text-stone-800">{storeBrand}</span>{" "}
          asociadas a tu cuenta. Para cambiar la frecuencia o darte de baja,
          escribinos por correo.
        </p>
      </article>
    </div>
  );
}
