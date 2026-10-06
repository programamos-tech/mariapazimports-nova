"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatCop } from "@/lib/money";
import {
  STOREFRONT_SHIPPING_COD,
  STOREFRONT_SHIPPING_COD_LABEL,
} from "@/lib/shipping-rates";
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
        setShippingAvailable(true);
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
          municipalityCode && list.some((m) => m.code === municipalityCode)
            ? municipalityCode
            : (list[0]?.code ?? "");
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
            required={municipalities.length > 0}
            disabled={!departmentCode || loadingMun || municipalities.length === 0}
            value={municipalityCode}
            onChange={(e) => setMunicipalityCode(e.target.value)}
            className={selectClass}
          >
            <option value="">
              {loadingMun ? "Cargando…" : "Seleccionar…"}
            </option>
            {municipalities.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {STOREFRONT_SHIPPING_COD ? (
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          {STOREFRONT_SHIPPING_COD_LABEL}.
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
  const chargedShipping =
    STOREFRONT_SHIPPING_COD || !shippingAvailable ? 0 : shippingCents;
  const total = subtotalCents + chargedShipping;
  const shippingLabel = !municipalityCode
    ? "Selecciona municipio"
    : quoteLoading
      ? "Calculando…"
      : STOREFRONT_SHIPPING_COD
        ? STOREFRONT_SHIPPING_COD_LABEL
        : !shippingAvailable
          ? "Por confirmar"
          : formatCop(shippingCents);

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
        <dt className="shrink-0 text-stone-600">Envío</dt>
        <dd className="max-w-[16rem] text-right text-xs font-medium leading-snug text-stone-900 sm:text-[13px]">
          {shippingLabel}
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
