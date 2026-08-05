"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminNotificationRow } from "@/lib/admin-notifications";

function IconBell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 60) return "Ahora";
  if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}

/** Campana del navbar: nuevos registros y avisos del panel. */
export function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        notifications?: AdminNotificationRow[];
        unreadCount?: number;
      };
      setItems(json.notifications ?? []);
      setUnreadCount(Number(json.unreadCount ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, 45_000);
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    void fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Notificaciones"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <IconBell />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 z-[80] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2.5 dark:border-zinc-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-800 dark:text-zinc-100">
              Notificaciones
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void markAllRead()}
                className="text-[11px] font-medium text-stone-500 transition hover:text-stone-900 disabled:opacity-50 dark:hover:text-zinc-100"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>

          <ul className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-stone-500">
                Sin notificaciones todavía.
              </li>
            ) : (
              items.map((n) => {
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={
                          n.read
                            ? "text-[13px] font-medium text-stone-700 dark:text-zinc-200"
                            : "text-[13px] font-semibold text-stone-900 dark:text-zinc-50"
                        }
                      >
                        {n.title}
                      </p>
                      {!n.read ? (
                        <span
                          className="mt-1 size-1.5 shrink-0 rounded-full bg-rose-500"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    {n.body ? (
                      <p className="mt-0.5 text-[12px] leading-snug text-stone-500 dark:text-zinc-400">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
                      {relativeTime(n.created_at)}
                    </p>
                  </>
                );

                const className = n.read
                  ? "block border-b border-stone-50 px-3 py-3 transition hover:bg-stone-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                  : "block border-b border-stone-50 bg-rose-50/40 px-3 py-3 transition hover:bg-rose-50/70 dark:border-zinc-800 dark:bg-rose-950/20 dark:hover:bg-rose-950/35";

                if (n.href) {
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        className={className}
                        onClick={() => {
                          if (!n.read) void markOneRead(n.id);
                          setOpen(false);
                        }}
                      >
                        {inner}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`w-full text-left ${className}`}
                      onClick={() => {
                        if (!n.read) void markOneRead(n.id);
                      }}
                    >
                      {inner}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
