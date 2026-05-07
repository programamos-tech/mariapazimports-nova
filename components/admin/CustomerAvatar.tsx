import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";
import { ADMIN_SIDEBAR_BG } from "@/lib/admin-theme";

type Props = {
  /** Email o id (vía `customerAvatarSeed`) → mismo personaje siempre. */
  seed: string;
  size?: number;
  className?: string;
  label: string;
};

/**
 * Personajes ilustrados estilo [Notionists](https://www.dicebear.com/styles/notionists/) (DiceBear).
 */
export function CustomerAvatar({ seed, size = 40, className = "", label }: Props) {
  const safe = seed.trim() || "default";
  const svg = createAvatar(notionists, {
    seed: safe,
    size,
    backgroundColor: [ADMIN_SIDEBAR_BG.replace(/^#/, "")],
    radius: 50,
  }).toString();

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200/70 [&_svg]:block [&_svg]:size-full ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label={label}
    />
  );
}
