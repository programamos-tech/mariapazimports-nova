export const weekdayShort = ["d", "l", "m", "m", "j", "v", "s"] as const;

const monthShort = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthYearLabel(d: Date): string {
  return d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export function monthShortLabel(monthIndex: number): string {
  return monthShort[monthIndex] ?? "";
}

export function yearBounds(minDate?: string, maxDate?: string) {
  const minYear = minDate ? Number(minDate.slice(0, 4)) : 1900;
  const maxYear = maxDate
    ? Number(maxDate.slice(0, 4))
    : new Date().getFullYear();
  return {
    minYear: Number.isFinite(minYear) ? minYear : 1900,
    maxYear: Number.isFinite(maxYear) ? maxYear : new Date().getFullYear(),
  };
}

export function isDateWithinBounds(
  d: Date,
  minDate?: string,
  maxDate?: string,
): boolean {
  const iso = toIsoDate(d);
  if (minDate && iso < minDate) return false;
  if (maxDate && iso > maxDate) return false;
  return true;
}

export function yearPageStartFor(year: number, minYear: number, maxYear: number) {
  const clamped = Math.min(maxYear, Math.max(minYear, year));
  const pageSize = 12;
  let start = clamped - (clamped % pageSize);
  if (start < minYear) start = minYear;
  if (start + pageSize - 1 > maxYear) {
    start = Math.max(minYear, maxYear - pageSize + 1);
  }
  return start;
}
