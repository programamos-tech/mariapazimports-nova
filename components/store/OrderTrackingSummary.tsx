import { formatCop } from "@/lib/money";

type Line = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  product_name_snapshot: string;
};

export function OrderTrackingSummary({
  items,
  totalCents,
}: {
  items: Line[];
  totalCents: number;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Resumen
      </h2>
      <ul className="mt-4 divide-y divide-stone-100">
        {items.map((line) => (
          <li
            key={line.id}
            className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">
                {line.product_name_snapshot}
              </p>
              <p className="text-xs text-stone-500">
                {line.quantity} × {formatCop(Number(line.unit_price_cents))}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-stone-900">
              {formatCop(
                Number(line.unit_price_cents) * Number(line.quantity),
              )}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-stone-100 pt-4 text-base font-bold text-stone-900">
        <span>Total</span>
        <span>{formatCop(totalCents)}</span>
      </div>
    </section>
  );
}
