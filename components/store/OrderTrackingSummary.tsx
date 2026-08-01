import { formatCop } from "@/lib/money";

type Line = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  product_name_snapshot: string;
  variant_label_snapshot?: string | null;
};

export function OrderTrackingSummary({
  items,
  totalCents,
  subtotalCents,
  shippingCents,
  showTitle = true,
  dense = false,
}: {
  items: Line[];
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  showTitle?: boolean;
  dense?: boolean;
}) {
  const subtotal =
    subtotalCents ??
    items.reduce(
      (acc, line) =>
        acc + Number(line.unit_price_cents) * Number(line.quantity),
      0,
    );
  const shipping = shippingCents ?? Math.max(0, totalCents - subtotal);
  const rowPad = dense ? "py-3" : "py-5";

  return (
    <section>
      {showTitle ? (
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          Detalle de la factura
        </h2>
      ) : null}
      {items.length === 0 ? (
        <p className={`text-sm text-stone-500 ${showTitle ? "mt-3" : ""}`}>
          No hay ítems en este pedido.
        </p>
      ) : (
        <ul
          className={`divide-y divide-stone-200 ${showTitle ? (dense ? "mt-3" : "mt-6") : ""}`}
        >
          {items.map((line) => {
            const unit = Number(line.unit_price_cents);
            const qty = Number(line.quantity);
            const lineTotal = unit * qty;
            const variant = line.variant_label_snapshot?.trim();
            return (
              <li
                key={line.id}
                className={`flex justify-between gap-4 ${rowPad} first:pt-0 last:pb-0`}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-snug text-stone-900">
                    {line.product_name_snapshot}
                  </p>
                  {variant ? (
                    <p className="mt-0.5 text-[13px] text-stone-500">{variant}</p>
                  ) : null}
                  <p className="mt-1 text-[13px] tabular-nums text-stone-500">
                    {qty} × {formatCop(unit)}
                  </p>
                </div>
                <p className="shrink-0 text-[15px] font-medium tabular-nums text-stone-900">
                  {formatCop(lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <dl
        className={`space-y-2 border-t border-stone-200 text-sm ${dense ? "mt-1 pt-3" : "mt-2 space-y-2.5 pt-5"}`}
      >
        <div className="flex justify-between gap-4 text-stone-600">
          <dt>Subtotal</dt>
          <dd className="tabular-nums text-stone-900">{formatCop(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-stone-600">
          <dt>Envío</dt>
          <dd className="tabular-nums text-stone-900">
            {shipping > 0 ? formatCop(shipping) : "Incluido"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-stone-200 pt-2.5 text-[15px] font-semibold text-stone-900">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatCop(totalCents)}</dd>
        </div>
      </dl>
    </section>
  );
}
