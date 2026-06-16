import {
  fulfillmentStatusDescription,
  fulfillmentStatusLabel,
  fulfillmentStepIndex,
  TRACKING_TIMELINE_STEPS,
} from "@/lib/order-fulfillment";

export function OrderTrackingTimeline({
  fulfillmentStatus,
  paymentStatus,
}: {
  fulfillmentStatus: string | null;
  paymentStatus: string;
}) {
  const cancelled =
    fulfillmentStatus === "cancelled" || paymentStatus === "cancelled";
  const currentIdx = fulfillmentStepIndex(fulfillmentStatus);

  if (cancelled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900">
        Este pedido fue cancelado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Estado actual
        </p>
        <p className="mt-2 text-lg font-semibold text-stone-900">
          {fulfillmentStatusLabel(fulfillmentStatus)}
        </p>
        <p className="mt-1 text-sm text-stone-600">
          {fulfillmentStatusDescription(fulfillmentStatus)}
        </p>
      </div>

      <ol className="space-y-0">
        {TRACKING_TIMELINE_STEPS.map((step, idx) => {
          const done = currentIdx >= idx;
          const active = currentIdx === idx;
          return (
            <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
              {idx < TRACKING_TIMELINE_STEPS.length - 1 ? (
                <span
                  className={
                    done
                      ? "absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-stone-900/20"
                      : "absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-stone-200"
                  }
                  aria-hidden
                />
              ) : null}
              <span
                className={
                  done
                    ? active
                      ? "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white ring-4 ring-stone-100"
                      : "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white"
                    : "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 bg-white"
                }
                aria-hidden
              >
                {done ? "✓" : idx + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={
                    done
                      ? "text-sm font-semibold text-stone-900"
                      : "text-sm font-medium text-stone-400"
                  }
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
