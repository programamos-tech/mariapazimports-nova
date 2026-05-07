import { StoreEntranceSplash } from "@/components/store/StoreEntranceSplash";
import { StoreFavoritesProvider } from "@/components/store/StoreFavoritesProvider";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreFavoritesProvider>
      <div className="flex min-h-full flex-col bg-white text-stone-800">
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
        <StoreEntranceSplash />
      </div>
    </StoreFavoritesProvider>
  );
}
