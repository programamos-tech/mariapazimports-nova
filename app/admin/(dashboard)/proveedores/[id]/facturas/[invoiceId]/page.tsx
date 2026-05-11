import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSupplierInvoiceAttachmentAction, uploadSupplierInvoiceAttachmentAction } from "@/app/actions/admin/suppliers";
import { SupplierAbonoForm } from "@/components/admin/SupplierAbonoForm";
import { SupplierCancelInvoiceButton } from "@/components/admin/SupplierCancelInvoiceButton";
import { SupplierInvoiceStatusPill } from "@/components/admin/SupplierInvoiceStatusPill";
import { formatCop } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; invoiceId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProveedorFacturaDetailPage({ params, searchParams }: Props) {
  const { id: supplierId, invoiceId } = await params;
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: supplier } = await supabase.from("suppliers").select("id,name").eq("id", supplierId).maybeSingle();
  const { data: inv } = await supabase
    .from("supplier_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (!supplier || !inv) notFound();

  const { data: pays } = await supabase
    .from("supplier_invoice_payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });

  const { data: atts } = await supabase
    .from("supplier_invoice_attachments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const { data: lineRows } = await supabase
    .from("supplier_invoice_lines")
    .select("id,product_name_snapshot,quantity,unit_price_cents,sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const payments = pays ?? [];
  const attachments = atts ?? [];
  const lines = lineRows ?? [];
  const total = Number(inv.total_cents ?? 0);
  const paid = payments.reduce((s, p) => s + Number(p.amount_cents ?? 0), 0);
  const pending = inv.is_cancelled ? 0 : Math.max(0, total - paid);
  const issueStr =
    typeof inv.issue_date === "string"
      ? new Date(`${inv.issue_date}T12:00:00Z`).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  const err = sp.error;
  const errMsg =
    err === "monto"
      ? "El abono supera el saldo pendiente."
      : err === "abono"
        ? "No se pudo registrar el abono."
        : err === "limite"
          ? "Máximo 5 archivos adjuntos."
          : err === "subida" || err === "archivo"
            ? "Error al subir el archivo."
            : err === "db"
              ? "Error al guardar."
              : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">
            <Link href="/admin/proveedores" className="hover:text-zinc-800">
              Proveedores
            </Link>
            <span className="mx-1.5 text-zinc-300">/</span>
            <Link href={`/admin/proveedores/${supplierId}`} className="hover:text-zinc-800">
              {supplier.name}
            </Link>
          </p>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 sm:text-2xl">
            ID de factura · {invoiceId.slice(0, 6)}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-600">Folio {inv.folio}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SupplierAbonoForm
            invoiceId={invoiceId}
            supplierId={supplierId}
            pendingCents={pending}
          />
          <button
            type="button"
            disabled
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-400"
            title="Próximamente"
          >
            Editar
          </button>
          {!inv.is_cancelled ? (
            <SupplierCancelInvoiceButton supplierId={supplierId} invoiceId={invoiceId} />
          ) : null}
          <Link
            href={`/admin/proveedores/${supplierId}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Volver
          </Link>
        </div>
      </div>

      {errMsg ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {errMsg}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Estado de la factura
            </p>
            <div className="mt-3">
              <SupplierInvoiceStatusPill
                totalCents={total}
                paidCents={paid}
                isCancelled={Boolean(inv.is_cancelled)}
              />
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-zinc-500">Total</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">{formatCop(total)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Pagado</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700">{formatCop(paid)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Pendiente</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-red-700">{formatCop(pending)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Notas</dt>
                <dd className="mt-0.5 text-zinc-800">
                  {inv.notes && String(inv.notes).trim() ? String(inv.notes).trim() : "Sin notas"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Número de factura</dt>
                <dd className="mt-0.5 font-mono text-zinc-900">{inv.folio}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Emisión</dt>
                <dd className="mt-0.5 text-zinc-900">{issueStr}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Datos de la factura
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Proveedor y referencias.</p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Nombre</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{supplier.name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Número</dt>
                <dd className="mt-0.5 font-mono text-zinc-900">{inv.folio}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Productos / ítems
            </h2>
            {lines.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                Esta factura no tiene líneas de compra registradas (facturas anteriores a ítems o migración
                pendiente).
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      <th className="py-2 pr-4 font-medium">Producto</th>
                      <th className="py-2 pr-4 font-medium tabular-nums">Cant.</th>
                      <th className="py-2 pr-4 font-medium tabular-nums">Unitario</th>
                      <th className="py-2 font-medium tabular-nums">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((row) => {
                      const q = Number(row.quantity ?? 0);
                      const u = Number(row.unit_price_cents ?? 0);
                      const sub = q * u;
                      return (
                        <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-zinc-900">
                            {String(row.product_name_snapshot ?? "—")}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-zinc-700">{q}</td>
                          <td className="py-3 pr-4 tabular-nums text-zinc-700">{formatCop(u)}</td>
                          <td className="py-3 tabular-nums font-semibold text-zinc-900">{formatCop(sub)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Abonos registrados
            </h2>
            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">Todavía no hay abonos.</p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <p className="font-semibold tabular-nums text-zinc-900">
                        {formatCop(Number(p.amount_cents ?? 0))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {typeof p.paid_at === "string"
                          ? new Date(p.paid_at).toLocaleString("es-CO")
                          : ""}{" "}
                        · {String(p.payment_method ?? "")}
                      </p>
                      {p.notes ? <p className="mt-1 text-xs text-zinc-600">{String(p.notes)}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Comprobantes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Archivos adjuntos (imagen o PDF), hasta 5.</p>

            {!inv.is_cancelled && attachments.length < 5 ? (
              <form
                action={uploadSupplierInvoiceAttachmentAction}
                encType="multipart/form-data"
                className="mt-4 flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="invoice_id" value={invoiceId} />
                <input type="hidden" name="supplier_id" value={supplierId} />
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-zinc-500">Archivo</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    required
                    className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Subir
                </button>
              </form>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {attachments.map((a) => {
                const url = storagePublicObjectUrl(a.storage_path);
                const isPdf = String(a.file_name ?? "").toLowerCase().endsWith(".pdf") || String(a.storage_path ?? "").toLowerCase().endsWith(".pdf");
                return (
                  <div
                    key={a.id}
                    className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50"
                  >
                    {url && !isPdf ? (
                      <div className="relative aspect-[4/3] w-full bg-zinc-100">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 400px"
                          unoptimized={shouldUnoptimizeStorageImageUrl(url)}
                        />
                      </div>
                    ) : url && isPdf ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-12 text-sm font-medium text-sky-700 underline"
                      >
                        Ver PDF
                      </a>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2">
                      <span className="truncate text-xs text-zinc-600">{a.file_name || "Archivo"}</span>
                      <form action={deleteSupplierInvoiceAttachmentAction}>
                        <input type="hidden" name="attachment_id" value={a.id} />
                        <input type="hidden" name="invoice_id" value={invoiceId} />
                        <input type="hidden" name="supplier_id" value={supplierId} />
                        <input type="hidden" name="storage_path" value={a.storage_path} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                          title="Eliminar"
                        >
                          Quitar
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
            {attachments.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">Sin comprobantes adjuntos.</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
