"use client";

import { useEffect, useState } from "react";
import { formatCop, formatCopInputGrouping, parseCopInputDigitsToInt } from "@/lib/money";

type Department = { code: string; name: string };
type Municipality = { code: string; name: string; cost_cents: number };

type Props = {
  enabled: boolean;
  labelClass: string;
  inputClass: string;
  shippingCents: number;
  onShippingCentsChange: (cents: number) => void;
  departmentCode: string;
  municipalityCode: string;
  onDepartmentCodeChange: (code: string) => void;
  onMunicipalityCodeChange: (code: string) => void;
};

export function PosShippingMunicipalityPicker({
  enabled,
  labelClass,
  inputClass,
  shippingCents,
  onShippingCentsChange,
  departmentCode,
  municipalityCode,
  onDepartmentCodeChange,
  onMunicipalityCodeChange,
}: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [costRaw, setCostRaw] = useState("0");

  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/shipping/locations")
      .then((r) => r.json())
      .then((json: { departments?: Department[] }) => setDepartments(json.departments ?? []));
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !departmentCode) {
      setMunicipalities([]);
      onMunicipalityCodeChange("");
      return;
    }
    void fetch(`/api/shipping/locations?department=${encodeURIComponent(departmentCode)}`)
      .then((r) => r.json())
      .then((json: { municipalities?: Municipality[] }) => {
        const list = json.municipalities ?? [];
        setMunicipalities(list);
        if (!list.some((m) => m.code === municipalityCode)) {
          onMunicipalityCodeChange(list[0]?.code ?? "");
        }
      });
  }, [enabled, departmentCode, municipalityCode, onMunicipalityCodeChange]);

  useEffect(() => {
    if (!enabled || !municipalityCode) {
      onShippingCentsChange(0);
      setCostRaw("0");
      return;
    }
    void fetch(`/api/shipping/locations?municipality=${encodeURIComponent(municipalityCode)}`)
      .then((r) => r.json())
      .then((json: { quote?: { costCents: number } }) => {
        const cents = json.quote?.costCents ?? 0;
        onShippingCentsChange(cents);
        setCostRaw(String(cents));
      });
  }, [enabled, municipalityCode, onShippingCentsChange]);

  useEffect(() => {
    setCostRaw(String(Math.max(0, shippingCents)));
  }, [shippingCents]);

  if (!enabled) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-zinc-200/80 pt-4 dark:border-zinc-700">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Departamento destino</label>
          <select
            value={departmentCode}
            onChange={(e) => onDepartmentCodeChange(e.target.value)}
            className={inputClass}
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
          <label className={labelClass}>Municipio destino</label>
          <select
            value={municipalityCode}
            disabled={!departmentCode}
            onChange={(e) => onMunicipalityCodeChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar…</option>
            {municipalities.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Costo de envío (COP)</label>
        <input
          inputMode="numeric"
          value={formatCopInputGrouping(parseCopInputDigitsToInt(costRaw))}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setCostRaw(digits);
            onShippingCentsChange(parseCopInputDigitsToInt(digits));
          }}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Tarifa sugerida según el módulo de envíos. Puedes ajustarla en mostrador.
        </p>
      </div>
      <p className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
        Envío: {formatCop(shippingCents)}
      </p>
    </div>
  );
}
