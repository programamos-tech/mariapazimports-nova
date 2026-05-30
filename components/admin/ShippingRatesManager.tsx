"use client";

import { useMemo, useState } from "react";
import {
  bulkUpdateShippingRatesAction,
  updateShippingMunicipalityRateAction,
} from "@/app/actions/admin/shipping-rates";
import { formatCop, formatCopInputGrouping, parseCopInputDigitsToInt } from "@/lib/money";
import type { ShippingDepartmentRow } from "@/lib/shipping-rates";

export type ShippingRateAdminRow = {
  code: string;
  department_code: string;
  name: string;
  cost_cents: number;
  is_delivery_enabled: boolean;
  department_name: string;
};

type Props = {
  departments: ShippingDepartmentRow[];
  initialDepartmentCode: string;
  municipalities: ShippingRateAdminRow[];
  canManage: boolean;
};

export function ShippingRatesManager({
  departments,
  initialDepartmentCode,
  municipalities,
  canManage,
}: Props) {
  const [search, setSearch] = useState("");
  const [bulkCost, setBulkCost] = useState("");
  const [bulkApplyEnabled, setBulkApplyEnabled] = useState(false);
  const [bulkEnabled, setBulkEnabled] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return municipalities;
    return municipalities.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.includes(q) ||
        m.department_name.toLowerCase().includes(q),
    );
  }, [municipalities, search]);

  const deptLabel =
    departments.find((d) => d.code === initialDepartmentCode)?.name ??
    initialDepartmentCode;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="dept-filter" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Departamento
            </label>
            <select
              id="dept-filter"
              name="dept"
              defaultValue={initialDepartmentCode}
              className="min-w-[14rem] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Ver municipios
          </button>
        </form>

        <div className="min-w-[12rem] flex-1 lg:max-w-sm">
          <label htmlFor="mun-search" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Buscar municipio
          </label>
          <input
            id="mun-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o código DANE…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
      </div>

      {canManage ? (
        <form
          action={bulkUpdateShippingRatesAction}
          className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/50"
        >
          <input type="hidden" name="department_code" value={initialDepartmentCode} />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Aplicar a todos los municipios de {deptLabel}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Costo de envío (COP)
              </label>
              <input
                name="cost_cents"
                inputMode="numeric"
                value={bulkCost}
                onChange={(e) => setBulkCost(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                className="w-40 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={bulkApplyEnabled}
                onChange={(e) => setBulkApplyEnabled(e.target.checked)}
              />
              También cambiar disponibilidad
            </label>
            {bulkApplyEnabled ? (
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  name="is_delivery_enabled"
                  checked={bulkEnabled}
                  onChange={(e) => setBulkEnabled(e.target.checked)}
                />
                Envío habilitado
              </label>
            ) : null}
            <input type="hidden" name="apply_enabled" value={bulkApplyEnabled ? "on" : "off"} />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
            >
              Aplicar en lote
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/60">
              <th className="px-4 py-3 font-medium">Municipio</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium text-right">Costo envío</th>
              <th className="px-4 py-3 font-medium text-center">Activo</th>
              {canManage ? <th className="px-4 py-3 font-medium text-right">Acción</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="px-4 py-10 text-center text-zinc-500">
                  {municipalities.length === 0
                    ? "Aún no hay municipios cargados. Ejecuta el seed de DIVIPOLA."
                    : "Sin resultados para la búsqueda."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <ShippingRateRow key={m.code} row={m} canManage={canManage} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Mostrando {filtered.length} de {municipalities.length} municipios en {deptLabel}.
        Los costos se usan en checkout web y en el facturador POS al seleccionar envío.
      </p>
    </div>
  );
}

function ShippingRateRow({
  row,
  canManage,
}: {
  row: ShippingRateAdminRow;
  canManage: boolean;
}) {
  const [costRaw, setCostRaw] = useState(String(Math.max(0, row.cost_cents)));
  const [enabled, setEnabled] = useState(row.is_delivery_enabled);

  return (
    <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.code}</td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
        {canManage ? (
          <input
            form={`ship-rate-${row.code}`}
            name="cost_cents"
            inputMode="numeric"
            value={formatCopInputGrouping(parseCopInputDigitsToInt(costRaw))}
            onChange={(e) => setCostRaw(e.target.value.replace(/[^\d]/g, ""))}
            className="w-28 rounded border border-zinc-200 bg-white px-2 py-1 text-right text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        ) : (
          formatCop(row.cost_cents)
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {canManage ? (
          <input
            form={`ship-rate-${row.code}`}
            type="checkbox"
            name="is_delivery_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        ) : row.is_delivery_enabled ? (
          "Sí"
        ) : (
          "No"
        )}
      </td>
      {canManage ? (
        <td className="px-4 py-3 text-right">
          <form id={`ship-rate-${row.code}`} action={updateShippingMunicipalityRateAction}>
            <input type="hidden" name="municipality_code" value={row.code} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Guardar
            </button>
          </form>
        </td>
      ) : null}
    </tr>
  );
}
