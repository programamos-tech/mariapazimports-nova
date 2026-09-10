import { Suspense } from "react";
import { preconnect } from "react-dom";
import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr/AirplaneTilt";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { Handshake } from "@phosphor-icons/react/dist/ssr/Handshake";
import { SealCheck } from "@phosphor-icons/react/dist/ssr/SealCheck";
import { StoreNetflixHero } from "@/components/store/StoreNetflixHero";
import { StoreMariaPazBio } from "@/components/store/StoreMariaPazBio";
import {
  StoreUsaImportBanner,
  USA_FLAG_IMAGE,
} from "@/components/store/StoreUsaImportBanner";
import { HomeCategoriesSection } from "@/components/store/home/HomeCategoriesSection";
import { HomeFeaturedSection } from "@/components/store/home/HomeFeaturedSection";
import { HomeBestsellersSection } from "@/components/store/home/HomeBestsellersSection";
import {
  HomeBestsellersSkeleton,
  HomeCategoriesSkeleton,
  HomeFeaturedSkeleton,
} from "@/components/store/home/HomeSectionSkeletons";
import { storeShellClass } from "@/lib/store-layout";
import { STORE_HEADER_ICON_WEIGHT } from "@/lib/store-header-icons";
import { MPI_HERO_IMAGES } from "@/lib/mpi-hero-images";

export const dynamic = "force-dynamic";

const HIGHLIGHT_ICON_CLASS = "size-8 shrink-0 text-stone-900 sm:size-9";

const STORE_HIGHLIGHTS = [
  {
    title: "Envíos nacionales",
    description: "Enviamos dentro de las 24h posteriores a tu compra.",
    Icon: CalendarBlank,
  },
  {
    title: "Productos 100% originales",
    description: "Importamos directamente desde USA.",
    Icon: AirplaneTilt,
  },
  {
    title: "Atención personalizada",
    description:
      "Te acompañamos antes, durante y después de tu compra.",
    Icon: Handshake,
  },
  {
    title: "Los mejores productos",
    description: "De la más alta calidad y al mejor precio.",
    Icon: SealCheck,
  },
] as const;

export default function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) preconnect(supabaseUrl);

  return (
    <div>
      {MPI_HERO_IMAGES.slice(0, 3).map((href) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          fetchPriority="high"
        />
      ))}
      <link rel="preload" as="image" href={USA_FLAG_IMAGE} />

      <StoreNetflixHero />

      <section className="bg-white pb-10 sm:pb-12" aria-label="Beneficios">
        <div className={storeShellClass}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 py-2 sm:grid-cols-4 sm:gap-x-6 sm:py-4">
            {STORE_HIGHLIGHTS.map(({ title, description, Icon }) => (
              <li key={title}>
                <div className="flex flex-col items-center text-center">
                  <Icon
                    className={HIGHLIGHT_ICON_CLASS}
                    weight={STORE_HEADER_ICON_WEIGHT}
                    aria-hidden
                  />
                  <p className="mt-3.5 max-w-[14rem] text-xs font-semibold uppercase tracking-[0.04em] text-stone-900 sm:text-[13px]">
                    {title}
                  </p>
                  <p className="mt-1.5 max-w-[14rem] text-xs leading-snug text-stone-600 sm:text-[13px]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Suspense fallback={<HomeCategoriesSkeleton />}>
        <HomeCategoriesSection />
      </Suspense>

      <StoreMariaPazBio />

      <StoreUsaImportBanner />

      <Suspense fallback={<HomeFeaturedSkeleton />}>
        <HomeFeaturedSection />
      </Suspense>

      <Suspense fallback={<HomeBestsellersSkeleton />}>
        <HomeBestsellersSection />
      </Suspense>
    </div>
  );
}
