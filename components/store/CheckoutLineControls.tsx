"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLineQuantity } from "@/app/actions/cart";

type Props = {
  productId: string;
  quantity: number;
  maxStock: number;
  variantId?: string | null;
};

export function CheckoutLineControls({
  productId,
  quantity,
  maxStock,
  variantId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const vid = variantId?.trim() || undefined;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="inline-flex items-center gap-1 border border-stone-900/15 bg-white">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void setLineQuantity(productId, quantity - 1, vid).then(() =>
                router.refresh(),
              );
            })
          }
          className="flex size-7 items-center justify-center text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
          aria-label={quantity <= 1 ? "Quitar producto del pedido" : "Menos uno"}
        >
          <Minus className="size-3.5" strokeWidth={1.35} aria-hidden />
        </button>
        <span className="min-w-[1.5rem] text-center text-xs font-semibold tabular-nums text-stone-900">
          {quantity}
        </span>
        <button
          type="button"
          disabled={pending || quantity >= maxStock}
          onClick={() =>
            startTransition(() => {
              void setLineQuantity(productId, quantity + 1, vid).then(() =>
                router.refresh(),
              );
            })
          }
          className="flex size-7 items-center justify-center text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
          aria-label="Más uno"
        >
          <Plus className="size-3.5" strokeWidth={1.35} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void setLineQuantity(productId, 0, vid).then(() =>
              router.refresh(),
            );
          })
        }
        className="text-[11px] text-stone-500 underline decoration-stone-300 underline-offset-2 transition hover:text-stone-900 disabled:opacity-40"
      >
        Quitar
      </button>
    </div>
  );
}
