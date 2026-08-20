"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storeWhatsAppShippingInquiryUrl } from "@/lib/brand";
import { formatCop } from "@/lib/money";
import { isStorefrontShippingAvailable } from "@/lib/shipping-rates";
import { CheckoutShippingMap } from "@/components/store/CheckoutShippingMap";

type Department = { code: string; name: string };
type Municipality = { code: string; name: string; cost_cents: number };
type Quote = {
  municipalityCode: string;
  municipalityName: string;
  departmentName: string;
  costCents: number;
  label: string;
};

type ShippingCtx = {
  departmentCode: string;
  municipalityCode: string;
  shippingCents: number;
  cityLabel: string;
  quoteLoading: boolean;
  shippingAvailable: boolean;
  setDepartmentCode: (v: string) => void;
  setMunicipalityCode: (v: string) => void;
};

const CheckoutShippingContext = createContext<ShippingCtx | null>(null);

function isShippableMunicipality(m: Municipality): boolean {
  return isStorefrontShippingAvailable({
    cost_cents: m.cost_cents,
    is_delivery_enabled: true,
  });
}

function ShippingWhatsAppNotice({
  departmentName,
  municipalityName,
  className = "",
}: {
  departmentName?: string;
  municipalityName?: string;
  className?: string;
}) {
  const href = storeWhatsAppShippingInquiryUrl({
    departmentName,
    municipalityName,
  });

  return (
    <div
      className={`border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-stone-800 ${className}`.trim()}
    >
      <p>
        {municipalityName
          ? `Para envíos a ${municipalityName}${departmentName ? `, ${departmentName}` : ""} coordina tu pedido directamente por WhatsApp.`
          : departmentName
            ? `En ${departmentName} aún no hay tarifa de envío en línea. Escríbenos por WhatsApp para cotizar tu pedido.`
            : "Para tu ubicación coordina el envío directamente por WhatsApp."}
      </p>
      {href !== "#" ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 underline decoration-emerald-400 underline-offset-4 transition hover:text-emerald-950"
        >
          Escribir por WhatsApp
        </Link>
      ) : null}
    </div>
  );
}

export function CheckoutShippingProvider({ children }: { children: ReactNode }) {
  const [departmentCode, setDepartmentCode] = useState("");
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [shippingCents, setShippingCents] = useState(0);
  const [cityLabel, setCityLabel] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [shippingAvailable, setShippingAvailable] = useState(false);

  useEffect(() => {
    if (!municipalityCode) {
      setShippingCents(0);
      setCityLabel("");
      setQuoteLoading(false);
      setShippingAvailable(false);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    void (async () => {
      const res = await fetch(
        `/api/shipping/locations?municipality=${encodeURIComponent(municipalityCode)}`,
      );
      if (!res.ok) {
        if (!cancelled) {
          setShippingCents(0);
          setCityLabel("");
          setQuoteLoading(false);
          setShippingAvailable(false);
        }
        return;
      }
      const json = (await res.json()) as { quote?: Quote };
      const costCents = json.quote?.costCents ?? 0;
      if (!cancelled) {
        setShippingCents(costCents);
        setCityLabel(json.quote?.label ?? "");
        setShippingAvailable(costCents > 0);
        setQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [municipalityCode]);

  const value = useMemo(
    () => ({
      departmentCode,
      municipalityCode,
      shippingCents,
      cityLabel,
      quoteLoading,
      shippingAvailable,
      setDepartmentCode,
      setMunicipalityCode,
    }),
    [
      departmentCode,
      municipalityCode,
      shippingCents,
      cityLabel,
      quoteLoading,
      shippingAvailable,
    ],
  );

  return (
    <CheckoutShippingContext.Provider value={value}>
      {children}
    </CheckoutShippingContext.Provider>
  );
}

function useCheckoutShipping() {
  const ctx = useContext(CheckoutShippingContext);
  if (!ctx) {
    throw new Error("CheckoutShippingProvider required");
  }
  return ctx;
}

/** Para botones de checkout fuera de campos de envío (opcional). */
export function useCheckoutShippingOptional() {
  return useContext(CheckoutShippingContext);
}

export function CheckoutShippingLocationFields({
  labelClass,
  selectClass,
}: {
  labelClass: string;
  selectClass: string;
}) {
  const {
    departmentCode,
    municipalityCode,
    cityLabel,
    setDepartmentCode,
    setMunicipalityCode,
  } = useCheckoutShipping();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingDept, setLoadingDept] = useState(true);
  const [loadingMun, setLoadingMun] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingDept(true);
      try {
        const res = await fetch("/api/shipping/locations");
        const json = (await res.json()) as { departments?: Department[] };
        if (!cancelled) setDepartments(json.departments ?? []);
      } finally {
        if (!cancelled) setLoadingDept(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!departmentCode) {
      setMunicipalities([]);
      setMunicipalityCode("");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingMun(true);
      try {
        const res = await fetch(
          `/api/shipping/locations?department=${encodeURIComponent(departmentCode)}`,
        );
        const json = (await res.json()) as { municipalities?: Municipality[] };
        const list = json.municipalities ?? [];
        if (cancelled) return;
        setMunicipalities(list);
        const nextCode =
          municipalityCode &&
          list.some(
            (m) => m.code === municipalityCode && isShippableMunicipality(m),
          )
            ? municipalityCode
            : (list.find((m) => isShippableMunicipality(m))?.code ?? "");
        setMunicipalityCode(nextCode);
      } finally {
        if (!cancelled) setLoadingMun(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset municipios al cambiar depto
  }, [departmentCode]);

  const departmentName =
    departments.find((d) => d.code === departmentCode)?.name ?? "";
  const shippableMunicipalities = municipalities.filter(isShippableMunicipality);
  const unavailableMunicipalities = municipalities.filter(
    (m) => !isShippableMunicipality(m),
  );

  return (
    <>
      <input type="hidden" name="shippingDepartmentCode" value={departmentCode} />
      <input type="hidden" name="shippingMunicipalityCode" value={municipalityCode} />
      <input type="hidden" name="city" value={cityLabel} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ship-dept" className={labelClass}>
            Departamento
          </label>
          <select
            id="ship-dept"
            required
            disabled={loadingDept}
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar…</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ship-mun" className={labelClass}>
            Municipio
          </label>
          <select
            id="ship-mun"
            required={shippableMunicipalities.length > 0}
            disabled={!departmentCode || loadingMun || shippableMunicipalities.length === 0}
            value={municipalityCode}
            onChange={(e) => setMunicipalityCode(e.target.value)}
            className={selectClass}
          >
            <option value="">
              {loadingMun
                ? "Cargando…"
                : shippableMunicipalities.length === 0
                  ? "Sin envío online"
                  : "Seleccionar…"}
            </option>
            {shippableMunicipalities.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
            {unavailableMunicipalities.length > 0 ? (
              <optgroup label="Cotizar por WhatsApp">
                {unavailableMunicipalities.map((m) => (
                  <option key={m.code} value={m.code} disabled>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>
      </div>

      {departmentCode && !loadingMun && shippableMunicipalities.length === 0 ? (
        <ShippingWhatsAppNotice
          departmentName={departmentName}
          className="mt-4"
        />
      ) : null}

      {departmentCode &&
      !loadingMun &&
      shippableMunicipalities.length > 0 &&
      unavailableMunicipalities.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Los municipios en gris no tienen tarifa configurada. Para esos destinos,
          {" "}
          <Link
            href={storeWhatsAppShippingInquiryUrl({ departmentName })}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 hover:text-stone-900"
          >
            escríbenos por WhatsApp
          </Link>
          .
        </p>
      ) : null}

      <CheckoutShippingMap
        departmentCode={departmentCode}
        municipalityCode={municipalityCode}
        className="mt-4"
      />
    </>
  );
}

export function CheckoutSidebarTotals({
  subtotalCents,
  itemCount,
}: {
  subtotalCents: number;
  itemCount: number;
}) {
  const { municipalityCode, shippingCents, quoteLoading, shippingAvailable } =
    useCheckoutShipping();
  const total = subtotalCents + (shippingAvailable ? shippingCents : 0);

  return (
    <dl className="space-y-3 text-[13px] text-stone-700">
      <div className="flex justify-between gap-4">
        <dt className="text-stone-600">
          Subtotal ({itemCount} {itemCount === 1 ? "ítem" : "ítems"})
        </dt>
        <dd className="shrink-0 font-medium tabular-nums text-stone-900">
          {formatCop(subtotalCents)}
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-b border-stone-300/70 pb-3">
        <dt className="text-stone-600">Envío</dt>
        <dd className="shrink-0 tabular-nums font-medium text-stone-900">
          {!municipalityCode
            ? "Selecciona municipio"
            : quoteLoading
              ? "Calculando…"
              : !shippingAvailable
                ? "Por WhatsApp"
                : formatCop(shippingCents)}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-stone-600">Impuestos</dt>
        <dd className="shrink-0 text-xs font-medium uppercase tracking-wide text-stone-500">
          Incluidos
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-stone-400 pt-4 text-[15px] font-semibold text-stone-900">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatCop(total)}</dd>
      </div>
    </dl>
  );
}
