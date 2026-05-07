import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop, formatCopCompact } from "@/lib/money";

export const dynamic = "force-dynamic";

const cardLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400";

/** Acento del gráfico: negro suave, alineado al logo María Paz (sin verde). */
const chartLineColor = "#1c1917";

function dayKey(dateIso: string) {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function prettyDayLabel(key: string) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
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
  let ventasVirtuales = 0;

  for (const o of orders) {
    const createdAt = typeof o.created_at === "string" ? o.created_at : null;
    if (!createdAt || dayKey(createdAt) !== todayKey) continue;
    const total = Number(o.total_cents ?? 0);
    if (o.status === "paid") {
      totalIngresos += total;
      gananciaBruta += total;
      const ref = String(o.wompi_reference ?? "");
      if (!ref.startsWith("POS:")) {
        ventasVirtuales += total;
      }
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
  const maxRaw = Math.max(...trend.map((t) => t.value), 0);
  const maxTrend = maxRaw > 0 ? maxRaw : 1;
  /** Margen superior para que el pico no toque el borde */
  const yMax = maxTrend * 1.08;

  const chartW = 920;
  const chartH = 340;
  const padL = 72;
  const padR = 20;
  const padT = 20;
  const padB = 52;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const xAt = (i: number) =>
    padL + (i / Math.max(1, trend.length - 1)) * plotW;
  const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;

  const linePoints = trend.map((t, i) => `${xAt(i)},${yAt(t.value)}`).join(" ");

  const areaPath = `M ${xAt(0)} ${padT + plotH} ${trend
    .map((t, i) => `L ${xAt(i)} ${yAt(t.value)}`)
    .join(" ")} L ${xAt(trend.length - 1)} ${padT + plotH} Z`;

  const gridSteps = 5;
  const yTicks: number[] = [];
  for (let s = 0; s <= gridSteps; s += 1) {
    yTicks.push((yMax * s) / gridSteps);
  }

  return (
    <div className="space-y-0">
      <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:pb-10">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
            Reportes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Resumen ejecutivo y métricas de rendimiento de la tienda principal.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          <select className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-[0_1px_0_0_rgb(24_24_27/0.04)]">
            <option>Hoy</option>
          </select>
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-[0_1px_0_0_rgb(24_24_27/0.04)]"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-10 pb-12">
        <p className={cardLabelClass}>Resumen del periodo</p>
        <p className="mt-1 text-sm text-zinc-500">Hoy</p>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total ingresos", formatCop(totalIngresos), "0 ventas"],
            ["Efectivo", formatCop(efectivo), totalIngresos > 0 ? `${Math.round((efectivo / totalIngresos) * 100)}% del total` : "0% del total"],
            ["Transferencia", formatCop(transferencia), totalIngresos > 0 ? `${Math.round((transferencia / totalIngresos) * 100)}% del total` : "0% del total"],
            ["Facturas anuladas", String(anuladas), "Facturas anuladas"],
            ["Garantías", "0", "Completadas"],
            ["Ganancia bruta", formatCop(gananciaBruta), "Por ventas del periodo"],
            ["Stock (inversión)", formatCop(stockInversion), "Inversión en stock"],
            [
              "Ventas virtuales",
              formatCop(ventasVirtuales),
              "Checkout web (sin mostrador)",
            ],
          ].map(([label, value, hint]) => (
            <div key={label} className="min-w-0">
              <dt className={cardLabelClass}>{label}</dt>
              <dd className="mt-1 text-2xl font-normal tabular-nums text-zinc-900">{value}</dd>
              <p className="mt-1 text-xs text-zinc-500">{hint}</p>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-zinc-100 pt-10">
        <h2 className="text-xl font-semibold text-zinc-900">Tendencia de Ingresos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ingresos por ventas pagadas · últimos 15 días
        </p>
        <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] sm:p-6">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-[280px] w-full min-h-[260px] min-w-[640px] sm:h-[320px]"
              role="img"
              aria-label="Gráfico de ingresos diarios en pesos colombianos"
            >
              <title>Ingresos por día</title>
              <defs>
                <linearGradient
                  id="adminIncomeChartFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={chartLineColor} stopOpacity="0.14" />
                  <stop offset="55%" stopColor={chartLineColor} stopOpacity="0.04" />
                  <stop offset="100%" stopColor={chartLineColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {yTicks.map((tick, idx) => {
                const y = yAt(tick);
                const isBottom = idx === 0;
                return (
                  <g key={`grid-${idx}`}>
                    {!isBottom ? (
                      <line
                        x1={padL}
                        y1={y}
                        x2={padL + plotW}
                        y2={y}
                        stroke="#e4e4e7"
                        strokeWidth={1}
                        strokeDasharray="4 6"
                      />
                    ) : null}
                    <text
                      x={padL - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-zinc-500"
                      style={{ fontSize: "11px" }}
                    >
                      {formatCopCompact(Math.round(tick))}
                    </text>
                  </g>
                );
              })}

              <line
                x1={padL}
                y1={padT + plotH}
                x2={padL + plotW}
                y2={padT + plotH}
                stroke="#d4d4d8"
                strokeWidth={1.25}
              />
              <line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={padT + plotH}
                stroke="#d4d4d8"
                strokeWidth={1.25}
              />

              <path d={areaPath} fill="url(#adminIncomeChartFill)" />
              <polyline
                fill="none"
                stroke={chartLineColor}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={linePoints}
              />

              {trend.map((t, i) => (
                <g key={t.key}>
                  <title>{`${prettyDayLabel(t.key)}: ${formatCop(t.value)}`}</title>
                  <circle
                    cx={xAt(i)}
                    cy={yAt(t.value)}
                    r="4"
                    fill="white"
                    stroke={chartLineColor}
                    strokeWidth={2}
                  />
                </g>
              ))}

              {trend.map((t, i) => (
                <text
                  key={`xl-${t.key}`}
                  x={xAt(i)}
                  y={chartH - 12}
                  textAnchor="middle"
                  className="fill-zinc-600"
                  style={{ fontSize: "12px" }}
                >
                  {prettyDayLabel(t.key)}
                </text>
              ))}
            </svg>
          </div>
          {maxRaw > 0 ? (
            <p className="mt-3 text-center text-xs text-zinc-400">
              Máximo del periodo: {formatCop(maxRaw)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
