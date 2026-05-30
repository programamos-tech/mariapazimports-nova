import divipola from "@/lib/data/colombia-divipola.json";

export type DivipolaRow = {
  cod_dpto: string;
  dpto: string;
  cod_mpio: string;
  nom_mpio: string;
};

export function normalizeDepartmentCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 1) return null;
  return digits.slice(-2).padStart(2, "0");
}

export function normalizeMunicipalityCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return digits.slice(-5).padStart(5, "0");
}

export function titleCaseMunicipalityName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Departamentos únicos desde DIVIPOLA (referencia estática). */
export function listStaticDepartments(): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of divipola as DivipolaRow[]) {
    const code = normalizeDepartmentCode(r.cod_dpto);
    if (!code) continue;
    if (!map.has(code)) {
      map.set(code, titleCaseMunicipalityName(String(r.dpto ?? "").trim()));
    }
  }
  return [...map.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function formatMunicipalityLabel(
  municipalityName: string,
  departmentName?: string | null,
): string {
  const m = municipalityName.trim();
  const d = departmentName?.trim();
  return d ? `${m}, ${d}` : m;
}
