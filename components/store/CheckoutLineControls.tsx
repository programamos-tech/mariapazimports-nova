"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLineQuantity } from "@/app/actions/cart";

type Props = {
  productId: string;
  quantity: number;
  maxStock: number;
};

export function CheckoutLineControls({ productId, quantity, maxStock }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 shadow-sm"
        role="group"
        aria-label="Cantidad"
      >
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void setLineQuantity(productId, quantity - 1).then(() =>
                router.refresh(),
              );
            })
          }
          className="flex size-9 items-center justify-center rounded-md text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
          aria-label={quantity <= 1 ? "Quitar del pedido" : "Restar una unidad"}
        >
          <Minus className="size-4" strokeWidth={2} aria-hidden />
        </button>
        <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-stone-900">
          {String(quantity).padStart(2, "0")}
        </span>
        <button
          type="button"
          disabled={pending || quantity >= maxStock}
          onClick={() =>
            startTransition(() => {
              void setLineQuantity(productId, quantity + 1).then(() =>
                router.refresh(),
              );
            })
          }
          className="flex size-9 items-center justify-center rounded-md text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
          aria-label="Sumar una unidad"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void setLineQuantity(productId, 0).then(() => router.refresh());
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
      >
        <Trash2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        Quitar
      </button>
    </div>
  );
}
