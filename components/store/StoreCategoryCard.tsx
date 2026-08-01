import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryCard } from "@/lib/fetch-home-categories";
import { STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS } from "@/lib/store-product-card-image";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export function StoreCategoryCard({
  category,
  priority,
}: {
  category: HomeCategoryCard;
  priority?: boolean;
}) {
  const href = `/products?category=${encodeURIComponent(category.id)}`;

  return (
    <li className="min-w-0">
      <article className="group/cat flex h-full flex-col">
        <div className="relative shrink-0">
          <div
            className={`relative w-full overflow-hidden bg-stone-100 ${STORE_PRODUCT_CARD_IMAGE_ASPECT_CLASS}`}
          >
            {category.imageSrc ? (
              <Image
                src={category.imageSrc}
                alt=""
                fill
                priority={priority}
                quality={90}
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover object-center transition duration-500 ease-out group-hover/cat:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cat:scale-100"
                unoptimized={shouldUnoptimizeStorageImageUrl(category.imageSrc)}
              />
            ) : (
              <div className={`absolute inset-0 ${category.tint}`} />
            )}
          </div>
          <Link
            href={href}
            className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70"
            aria-label={category.name}
          />
        </div>

        <div className="pt-4">
          <Link
            href={href}
            className="block border border-stone-300 bg-white py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-stone-800 transition hover:border-stone-900 hover:text-stone-900"
          >
            <span className="line-clamp-1">{category.name}</span>
          </Link>
        </div>
      </article>
    </li>
  );
}
