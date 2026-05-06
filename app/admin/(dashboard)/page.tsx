import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";

export const dynamic = "force-dynamic";

const cardLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400";

function dayKey(dateIso: string) {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function prettyDayLabel(key: string) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();
  const [productsRes, ordersRes] = await Promise.all([
    supabase
      .from("products")
      .select("stock_quantity,cost_cents"),
    supabase
      .from("orders")
      .select("status,total_cents,created_at,wompi_reference"),
  ]);

  const products = productsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);

  let totalIngresos = 0;
  let efectivo = 0;
  let transferencia = 0;
  let anuladas = 0;
  let gananciaBruta = 0;

  for (const o of orders) {
    const createdAt = typeof o.created_at === "string" ? o.created_at : null;
    if (!createdAt || dayKey(createdAt) !== todayKey) continue;
    const total = Number(o.total_cents ?? 0);
    if (o.status === "paid") {
      totalIngresos += total;
      gananciaBruta += total;
      const ref = String(o.wompi_reference ?? "");
      if (ref === "POS:cash") efectivo += total;
      else if (ref === "POS:transfer" || ref === "POS:mixed" || !ref.startsWith("POS:")) {
        transferencia += total;
      }
    } else if (o.status === "cancelled") {
      anuladas += 1;
    }
  }

  const stockInversion = products.reduce((sum, p) => {
    const cost = Number((p as { cost_cents?: number | null }).cost_cents ?? 0);
    const stock = Number((p as { stock_quantity?: number | null }).stock_quantity ?? 0);
    return sum + cost * stock;
  }, 0);
  const creditos = orders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + Number(o.total_cents ?? 0), 0);

  const trendDays: { key: string; value: number }[] = [];
  for (let i = 14; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    trendDays.push({ key, value: 0 });
  }

  const trendByDay = new Map(trendDays.map((d) => [d.key, 0]));
  for (const o of orders) {
    if (o.status !== "paid" || typeof o.created_at !== "string") continue;
    const key = dayKey(o.created_at);
    if (!trendByDay.has(key)) continue;
    trendByDay.set(key, (trendByDay.get(key) ?? 0) + Number(o.total_cents ?? 0));
  }

  const trend = trendDays.map((d) => ({
    ...d,
    value: trendByDay.get(d.key) ?? 0,
  }));
  const maxTrend = Math.max(1, ...trend.map((t) => t.value));
  const chartW = 1080;
  const chartH = 280;
  const points = trend
    .map((t, i) => {
      const x = (i / Math.max(1, trend.length - 1)) * chartW;
      const y = chartH - (t.value / maxTrend) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Reportes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Resumen ejecutivo y métricas de rendimiento de la tienda principal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              <option>Hoy</option>
            </select>
            <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600">
              Actualizar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4 md:px-6">
          <p className={cardLabelClass}>Resumen del periodo</p>
          <p className="mt-1 text-sm text-zinc-500">Hoy</p>
        </div>
        <dl className="grid grid-cols-1 gap-0 divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y lg:grid-cols-4">
          {[
            ["Total ingresos", formatCop(totalIngresos), "0 ventas"],
            ["Efectivo", formatCop(efectivo), totalIngresos > 0 ? `${Math.round((efectivo / totalIngresos) * 100)}% del total` : "0% del total"],
            ["Transferencia", formatCop(transferencia), totalIngresos > 0 ? `${Math.round((transferencia / totalIngresos) * 100)}% del total` : "0% del total"],
            ["Facturas anuladas", String(anuladas), "Facturas anuladas"],
            ["Garantías", "0", "Completadas"],
            ["Ganancia bruta", formatCop(gananciaBruta), "Por ventas del periodo"],
            ["Stock (inversión)", formatCop(stockInversion), "Inversión en stock"],
            ["Créditos", formatCop(creditos), "Total adeudado"],
          ].map(([label, value, hint]) => (
            <div key={label} className="px-5 py-4 md:px-6">
              <dt className={cardLabelClass}>{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{value}</dd>
              <p className="mt-1 text-xs text-zinc-500">{hint}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-xl font-bold text-zinc-900">Tendencia de Ingresos</h2>
        <p className="mt-1 text-sm text-zinc-500">Últimos 15 días</p>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[900px]">
            <svg viewBox={`0 0 ${chartW} ${chartH + 44}`} className="h-[290px] w-full">
              <polyline
                fill="none"
                stroke="#4fb245"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
              {trend.map((t, i) => {
                const x = (i / Math.max(1, trend.length - 1)) * chartW;
                const y = chartH - (t.value / maxTrend) * chartH;
                return (
                  <g key={t.key}>
                    <circle cx={x} cy={y} r="3.5" fill="#4fb245" />
                    <text
                      x={x}
                      y={chartH + 20}
                      textAnchor="middle"
                      className="fill-zinc-400 text-[10px]"
                    >
                      {prettyDayLabel(t.key)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
