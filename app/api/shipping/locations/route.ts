import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  fetchShippingDepartments,
  fetchShippingMunicipalitiesByDepartment,
  quoteShippingForMunicipality,
} from "@/lib/shipping-rates";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const departmentCode = url.searchParams.get("department")?.trim() ?? "";
  const municipalityCode = url.searchParams.get("municipality")?.trim() ?? "";

  try {
    const supabase = createSupabaseServiceClient();

    if (municipalityCode) {
      const quote = await quoteShippingForMunicipality(supabase, municipalityCode);
      if (!quote) {
        return NextResponse.json({ error: "Municipio no disponible" }, { status: 404 });
      }
      return NextResponse.json({ quote });
    }

    if (departmentCode) {
      const municipalities = await fetchShippingMunicipalitiesByDepartment(
        supabase,
        departmentCode,
      );
      return NextResponse.json({ municipalities });
    }

    const departments = await fetchShippingDepartments(supabase);
    return NextResponse.json({ departments });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
