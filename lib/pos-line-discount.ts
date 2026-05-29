export type LineDiscountMode = "money" | "percent";

export function computeLineDiscountCents(
  lineGrossCents: number,
  mode: LineDiscountMode,
  rawValue: number,
): number {
  const gross = Math.max(0, Math.floor(lineGrossCents));
  const value = Math.max(0, Math.floor(rawValue));
  if (value <= 0 || gross <= 0) return 0;

  if (mode === "percent") {
    const pct = Math.min(100, value);
    return Math.min(gross, Math.round((gross * pct) / 100));
  }

  return Math.min(gross, value);
}
