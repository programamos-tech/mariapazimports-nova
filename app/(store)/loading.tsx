import { StoreLoadingScreen } from "@/components/store/StoreLoadingScreen";

/**
 * Durante navegaciones cliente dentro de (store) mientras React Suspense espera.
 * En F5 / recarga completa el splash lo cubre {@link StoreEntranceSplash}.
 */
export default function StoreLoading() {
  return <StoreLoadingScreen />;
}
