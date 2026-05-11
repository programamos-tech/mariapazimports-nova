/** Folio legible tipo FV-YYYYMMDD-XXXXXXXX (8 hex del id). */
export function supplierInvoiceFolioFromId(createdAtIso: string, id: string): string {
  const d = new Date(createdAtIso);
  const ymd = Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10).replace(/-/g, "")
    : d.toISOString().slice(0, 10).replace(/-/g, "");
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FV-${ymd}-${short}`;
}

/** Usa fecha de emisión `YYYY-MM-DD` + id del pedido (UUID). */
export function supplierInvoiceFolioFromIssueDate(issueDateYmd: string, id: string): string {
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(issueDateYmd)
    ? issueDateYmd.replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FV-${ymd}-${short}`;
}

export type SupplierInvoiceUiStatus = "paid" | "pending" | "cancelled";

export function supplierInvoiceUiStatus(
  totalCents: number,
  paidCents: number,
  isCancelled: boolean,
): SupplierInvoiceUiStatus {
  if (isCancelled) return "cancelled";
  const pending = Math.max(0, totalCents - paidCents);
  if (pending <= 0 && totalCents >= 0) return "paid";
  return "pending";
}

export function supplierInvoiceStatusBadge(
  status: SupplierInvoiceUiStatus,
): { label: string; className: string } {
  if (status === "paid") {
    return {
      label: "Pagada",
      className: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Anulada",
      className: "bg-red-50 text-red-900 ring-1 ring-red-200/90",
    };
  }
  return {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/90",
  };
}
