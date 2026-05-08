import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StoreAddressesManager } from "@/components/store/StoreAddressesManager";
import { storeBrand, storeSupportEmail, storeWhatsAppUrl } from "@/lib/brand";

export const metadata = {
  title: "Ajustes",
};

const cardClass =
  "border border-stone-200 bg-white px-6 py-8 sm:px-8 sm:py-9";
const cardTitle =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900";
const btnOutline =
  "inline-flex shrink-0 items-center justify-center border border-stone-900 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900 transition hover:bg-stone-900 hover:text-white";
const labelMuted = "text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500";
const valueText = "mt-1 text-sm text-stone-900";

function profileLocationLine(
  city: string | null | undefined,
  address: string | null | undefined,
): string {
  const c = city?.trim();
  const a = address?.trim();
  if (c && a) return `${c} · ${a}`;
  if (c) return c;
  if (a) return a;
  return "Colombia";
}

export default async function CuentaDireccionesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata as { full_name?: string } | undefined;

  const { data: customer } = await supabase
    .from("customers")
    .select("name, email, shipping_city, shipping_address")
    .maybeSingle();

  const displayName =
    customer?.name?.trim() ||
    meta?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "—";
  const email = user?.email ?? customer?.email ?? "—";
  const location = profileLocationLine(
    customer?.shipping_city,
    customer?.shipping_address,
  );

  const waEdit =
    storeWhatsAppUrl !== "#"
      ? `${storeWhatsAppUrl}?text=${encodeURIComponent("Hola, quiero actualizar los datos de mi perfil.")}`
      : storeWhatsAppUrl;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-stone-900 sm:text-[15px] sm:tracking-[0.26em]">
        Ajustes
      </h1>

      <article className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className={cardTitle}>Perfil</h2>
          <Link href={waEdit} className={btnOutline} target="_blank" rel="noopener noreferrer">
            Editar
          </Link>
        </div>
        <div className="mt-8 space-y-5">
          <div>
            <p className={labelMuted}>Nombre</p>
            <p className={valueText}>{displayName}</p>
          </div>
          <div>
            <p className={labelMuted}>Email</p>
            <p className={valueText}>{email}</p>
          </div>
          <div>
            <p className={labelMuted}>Ubicación</p>
            <p className={valueText}>{location}</p>
          </div>
          <div className="flex items-start gap-3 border border-stone-100 bg-stone-50/80 px-4 py-3">
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white"
              aria-hidden
            >
              !
            </span>
            <p className="text-sm leading-relaxed text-stone-700">
              Actualiza la información de tu cumpleaños para recibir un saludo
              especial. Escribinos por WhatsApp o indicalo en tu próximo pedido.
            </p>
          </div>
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
            className={btnOutline}
          >
            Editar
          </a>
        </div>
        <p className="mt-8 text-sm leading-relaxed text-stone-600">
          Recibís novedades y comunicaciones de{" "}
          <span className="font-medium text-stone-800">{storeBrand}</span>{" "}
          asociadas a tu cuenta. Para cambiar la frecuencia o darte de baja,
          escríbenos por correo.
        </p>
      </article>
    </div>
  );
}
