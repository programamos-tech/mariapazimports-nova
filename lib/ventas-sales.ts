/** Ventas POS marcan método en `wompi_reference` con prefijo `POS:`. */
export function isVentaFisica(wompiReference: string | null | undefined): boolean {
  const r = wompiReference?.trim() ?? "";
  return r.startsWith("POS:");
}

export function ventaFormaPagoLabel(wompiReference: string | null | undefined): string {
  const r = wompiReference?.trim() ?? "";
  if (r === "POS:cash") return "Efectivo";
  if (r === "POS:transfer") return "Transferencia";
  if (r === "POS:mixed") return "Mixto";
  if (r.startsWith("POS:")) return "Mostrador";
  return "En línea";
}

export type VentaPagoFilter = "all" | "cash" | "transfer" | "mixed" | "online";

export function matchesVentaPagoFilter(
  wompiReference: string | null | undefined,
  filter: VentaPagoFilter,
): boolean {
  if (filter === "all") return true;
  const r = wompiReference?.trim() ?? "";
  const fisica = r.startsWith("POS:");
  if (filter === "online") return !fisica;
  if (filter === "cash") return r === "POS:cash";
  if (filter === "transfer") return r === "POS:transfer";
  if (filter === "mixed") return r === "POS:mixed";
  return true;
}

export type VentaEstadoFilter = "all" | "paid" | "cancelled" | "pending" | "failed";

export function ventaEstadoBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "paid":
      return {
        label: "Finalizada",
        className: "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80",
      };
    case "cancelled":
      return {
        label: "Anulada",
        className: "bg-red-50 text-red-700 ring-1 ring-red-100",
      };
    case "pending":
      return {
        label: "Pendiente",
        className: "bg-amber-50 text-amber-900 ring-1 ring-amber-100",
      };
    case "failed":
      return {
        label: "Fallida",
        className: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
      };
  }
}

/** Número corto legible para la columna factura/pedido (no correlativo real). */
export function ventaNumeroReferencia(id: string): string {
  const hex = id.replace(/-/g, "").slice(-10);
  const n = parseInt(hex.slice(0, 8), 16);
  if (!Number.isFinite(n)) return id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return String(n % 100000).padStart(5, "0");
}

export function formatVentaFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const time = d.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  return `${time} · ${date}`;
}
