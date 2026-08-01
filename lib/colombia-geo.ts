import divipola from "@/lib/data/colombia-divipola.json";

export type DivipolaRow = {
  cod_dpto: string;
  dpto: string;
  cod_mpio: string;
  nom_mpio: string;
  longitud?: string;
  latitud?: string;
};

function parseCoord(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export type GeoPoint = {
  lat: number;
  lng: number;
  label: string;
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

/** Centro del municipio (DIVIPOLA). */
export function getMunicipalityPoint(
  municipalityCode: string | null | undefined,
): GeoPoint | null {
  const code = normalizeMunicipalityCode(municipalityCode);
  if (!code) return null;
  const row = (divipola as DivipolaRow[]).find(
    (r) => normalizeMunicipalityCode(r.cod_mpio) === code,
  );
  if (!row) return null;
  const lat = parseCoord(row.latitud);
  const lng = parseCoord(row.longitud);
  if (lat == null || lng == null) return null;
  const label = formatMunicipalityLabel(
    titleCaseMunicipalityName(String(row.nom_mpio ?? "")),
    titleCaseMunicipalityName(String(row.dpto ?? "")),
  );
  return { lat, lng, label };
}

/**
 * Si solo hay departamento, usa el municipio capital típico (…001)
 * o el promedio de coordenadas del departamento.
 */
export function getDepartmentFocusPoint(
  departmentCode: string | null | undefined,
): GeoPoint | null {
  const code = normalizeDepartmentCode(departmentCode);
  if (!code) return null;

  const rows = (divipola as DivipolaRow[]).filter(
    (r) => normalizeDepartmentCode(r.cod_dpto) === code,
  );
  if (rows.length === 0) return null;

  const capitalCode = `${code}001`;
  const capital =
    rows.find((r) => normalizeMunicipalityCode(r.cod_mpio) === capitalCode) ??
    rows[0];
  const fromCapital = getMunicipalityPoint(capital.cod_mpio);
  if (fromCapital) return fromCapital;

  let latSum = 0;
  let lngSum = 0;
  let n = 0;
  for (const r of rows) {
    const lat = parseCoord(r.latitud);
    const lng = parseCoord(r.longitud);
    if (lat == null || lng == null) continue;
    latSum += lat;
    lngSum += lng;
    n += 1;
  }
  if (n === 0) return null;
  return {
    lat: latSum / n,
    lng: lngSum / n,
    label: titleCaseMunicipalityName(String(rows[0]?.dpto ?? "Colombia")),
  };
}
