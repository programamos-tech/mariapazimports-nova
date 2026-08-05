"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminNotificationRow } from "@/lib/admin-notifications";
import { formatCop } from "@/lib/money";

const SHOWN_KEY = "admin:new-order-modal:shown";

function readShownIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function writeShownIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...ids].slice(-40)));
  } catch {
    /* private mode */
  }
}

function metaString(meta: Record<string, unknown> | null, key: string) {
  const v = meta?.[key];
  return typeof v === "string" ? v : null;
}

function metaNumber(meta: Record<string, unknown> | null, key: string) {
  const v = meta?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function metaStringArray(meta: Record<string, unknown> | null, key: string) {
  const v = meta?.[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/**
 * Modal a pantalla cuando entra un pedido nuevo de la tienda.
 * Usa notificaciones `store_order_created` no leídas.
 */
export function AdminNewOrderModal() {
  const [queue, setQueue] = useState<AdminNotificationRow[]>([]);
  const [current, setCurrent] = useState<AdminNotificationRow | null>(null);
  const shownRef = useRef<Set<string>>(new Set());
  const baselineDone = useRef(false);
  const booted = useRef(false);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        notifications?: AdminNotificationRow[];
      };
      const orderNotifs = (json.notifications ?? []).filter(
        (n) => n.kind === "store_order_created" && !n.read,
      );

      // Primera carga: no abrir modales históricos; solo baseline.
      if (!baselineDone.current) {
        baselineDone.current = true;
        for (const n of orderNotifs) {
          shownRef.current.add(n.id);
        }
        writeShownIds(shownRef.current);
        return;
      }

      const fresh = orderNotifs.filter((n) => !shownRef.current.has(n.id));
      if (fresh.length === 0) return;

      for (const n of fresh) {
        shownRef.current.add(n.id);
      }
      writeShownIds(shownRef.current);

      setQueue((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const extra = fresh.filter((n) => !ids.has(n.id));
        return extra.length ? [...prev, ...extra] : prev;
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      shownRef.current = readShownIds();
    }
    void poll();
    const id = window.setInterval(() => {
      void poll();
    }, 8_000);
    const onFocus = () => {
      void poll();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [poll]);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0] ?? null);
    setQueue((q) => q.slice(1));
  }, [current, queue]);

  useEffect(() => {
    if (!current) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [current]);

  if (!current) return null;

  const meta = current.metadata;
  const orderRef =
    metaString(meta, "orderRef") ??
    (current.entity_id ? String(current.entity_id).slice(0, 8) : "—");
  const customerName = metaString(meta, "customerName") ?? "Cliente";
  const totalCents = metaNumber(meta, "totalCents");
  const paymentLabel = metaString(meta, "paymentLabel") ?? "Pago";
  const items = metaStringArray(meta, "itemsPreview");
  const itemCount = metaNumber(meta, "itemCount") ?? items.length;
  const href = current.href ?? `/admin/orders/${current.entity_id ?? ""}`;

  function dismiss() {
    const id = current.id;
    void markRead(id);
    setCurrent(null);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-new-order-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="bg-stone-900 px-6 py-5 text-center text-white dark:bg-zinc-950">
          <p
            id="admin-new-order-title"
            className="text-lg font-bold uppercase tracking-[0.18em]"
          >
            ¡Nuevo pedido!
          </p>
          <p className="mt-1.5 font-mono text-sm text-white/70">#{orderRef}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Cliente</dt>
              <dd className="text-right font-medium text-stone-900 dark:text-zinc-100">
                {customerName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Total</dt>
              <dd className="text-right font-semibold tabular-nums text-stone-900 dark:text-zinc-100">
                {totalCents != null ? formatCop(totalCents) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Pago</dt>
              <dd className="text-right font-medium text-stone-900 dark:text-zinc-100">
                {paymentLabel}
              </dd>
            </div>
          </dl>

          {items.length > 0 ? (
            <div className="border-t border-stone-100 pt-4 dark:border-zinc-800">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Productos
                {itemCount > items.length ? ` (${itemCount})` : ""}
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-stone-700 dark:text-zinc-300">
                {items.map((label) => (
                  <li key={label} className="line-clamp-2">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href={href}
              onClick={() => {
                void markRead(current.id);
                setCurrent(null);
              }}
              className="inline-flex w-full items-center justify-center bg-stone-900 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Ver el pedido
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900 dark:hover:text-zinc-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
