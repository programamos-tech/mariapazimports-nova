"use client";

type Props = {
  labels: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function ProductFragrancePicker({
  labels,
  selectedIndex,
  onSelect,
}: Props) {
  if (labels.length < 2) return null;

  return (
    <fieldset className="mt-8 min-w-0 border-0 p-0">
      <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Fragancia / tono
      </legend>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Elegir fragancia o tono"
      >
        {labels.map((label, i) => {
          const selected = selectedIndex === i;
          return (
            <button
              key={`${i}-${label}`}
              type="button"
              role="radio"
              aria-checked={selected}
              title={label}
              onClick={() => onSelect(i)}
              className={
                selected
                  ? "max-w-full rounded-sm border border-stone-900 bg-stone-900 px-3.5 py-2 text-left text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-white transition"
                  : "max-w-full rounded-sm border border-stone-200 bg-white px-3.5 py-2 text-left text-[11px] font-medium uppercase leading-snug tracking-[0.06em] text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
              }
            >
              <span className="line-clamp-2">{label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
