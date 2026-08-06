import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

/** Fallback al navegar a la home u otras rutas del store sin loading propio. */
export default function StoreLoading() {
  return <StoreLoadingScreen label="Cargando la tienda…" />;
}
