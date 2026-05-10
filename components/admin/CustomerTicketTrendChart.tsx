import { formatCop, formatCopCompact } from "@/lib/money";
import type { TicketTrendPoint } from "@/lib/customer-ticket-trend";

const chartLineColor = "#18181b";

function monthLabelEs(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-CO", {
    month: "short",
    year: "numeric",
  });
}

type ChartPoint = TicketTrendPoint & { value: number; key: string };

export function CustomerTicketTrendChart({ points }: { points: TicketTrendPoint[] }) {
  if (points.length === 0) return null;

  const trend: ChartPoint[] = points.map((p) => ({
    ...p,
    value: p.avgCents,
    key: p.monthKey,
  }));

  const maxRaw = Math.max(...trend.map((t) => t.value), 0);
  const maxTrend = maxRaw > 0 ? maxRaw : 1;
  const yMax = maxTrend * 1.08;

  const xLabelStep =
    trend.length <= 16 ? 1 : Math.max(1, Math.ceil(trend.length / 14));

  const chartW = 880;
  const chartH = 300;
  const padL = 72;
  const padR = 20;
  const padT = 20;
  const padB = 48;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const xAt = (i: number) => {
    if (trend.length === 1) return padL + plotW / 2;
    return padL + (i / Math.max(1, trend.length - 1)) * plotW;
  };
  const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;

  const linePoints = trend.map((t, i) => `${xAt(i)},${yAt(t.value)}`).join(" ");

  let areaPath: string;
  if (trend.length === 1) {
    const x = xAt(0);
    const y = yAt(trend[0].value);
    const w = Math.min(48, plotW / 4);
    areaPath = `M ${x - w} ${padT + plotH} L ${x} ${y} L ${x + w} ${padT + plotH} Z`;
  } else {
    areaPath = `M ${xAt(0)} ${padT + plotH} ${trend
      .map((t, i) => `L ${xAt(i)} ${yAt(t.value)}`)
      .join(" ")} L ${xAt(trend.length - 1)} ${padT + plotH} Z`;
  }

  const gridSteps = 5;
  const yTicks: number[] = [];
  for (let s = 0; s <= gridSteps; s += 1) {
    yTicks.push((yMax * s) / gridSteps);
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="h-[240px] w-full min-h-[220px] min-w-[520px] sm:h-[280px]"
        role="img"
        aria-label="Evolución del ticket promedio por mes"
      >
        <title>Ticket promedio por mes</title>
        <defs>
          <linearGradient
            id="customerTicketChartFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={chartLineColor} stopOpacity="0.12" />
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

        <path d={areaPath} fill="url(#customerTicketChartFill)" />
        {trend.length > 1 ? (
          <polyline
            fill="none"
            stroke={chartLineColor}
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePoints}
          />
        ) : null}

        {trend.map((t, i) => (
          <g key={t.key}>
            <title>{`${monthLabelEs(t.monthKey)}: ${formatCop(t.value)} · ${t.orderCount} venta${t.orderCount === 1 ? "" : "s"}`}</title>
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

        {trend.map((t, i) =>
          i % xLabelStep === 0 || i === trend.length - 1 ? (
            <text
              key={`xl-${t.key}`}
              x={xAt(i)}
              y={chartH - 10}
              textAnchor="middle"
              className="fill-zinc-600"
              style={{ fontSize: trend.length > 24 ? "10px" : "12px" }}
            >
              {monthLabelEs(t.monthKey)}
            </text>
          ) : null,
        )}
      </svg>
      {maxRaw > 0 ? (
        <p className="mt-2 text-center text-xs text-zinc-400">
          Pico del periodo: {formatCop(maxRaw)} ticket promedio
        </p>
      ) : null}
    </div>
  );
}
