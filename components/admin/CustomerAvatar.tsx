import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

/** Fondos circulares para el estilo Notionists. */
const CIRCLE_BACKGROUNDS = [
  "ffd5dc",
  "b8e0ff",
  "c8f7c5",
  "fff3bf",
  "e9d5ff",
  "ffe4c9",
  "d4f1f4",
  "f5d0c5",
];

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
    backgroundColor: CIRCLE_BACKGROUNDS,
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
