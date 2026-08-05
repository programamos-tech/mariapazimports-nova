import { storeBrand } from "@/lib/brand";

type Props = {
  label?: string;
  /** Pantalla completa fija (navegación / pedidos). */
  overlay?: boolean;
  className?: string;
};

/**
 * Loading de la vitrina: tipografía uppercase, piedra y spinner fino.
 * Usar en `loading.tsx`, overlays de checkout y armado de pedido.
 */
export function StoreLoadingScreen({
  label = "Cargando…",
  overlay = false,
  className = "",
}: Props) {
  const body = (
    <div
      className={`flex flex-col items-center justify-center gap-5 px-6 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-900">
        {storeBrand}
      </p>
      <span
        className="size-9 animate-spin rounded-full border border-stone-200 border-t-stone-900"
        aria-hidden
      />
      <p className="max-w-[16rem] text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
    </div>
  );

  if (!overlay) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white py-16">
        {body}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/92 backdrop-blur-[2px]">
      {body}
    </div>
  );
}
