import Link from "next/link";
import { ShippingRatesManager } from "@/components/admin/ShippingRatesManager";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import {
  fetchShippingDepartments,
  searchShippingMunicipalitiesAdmin,
  shippingAdminErrorMessage,
} from "@/lib/shipping-rates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminEnviosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const errMsg = shippingAdminErrorMessage(
    typeof sp.error === "string" ? sp.error : undefined,
  );
  const saved = sp.saved === "1";

  const supabase = await createSupabaseServerClient();
  const perm = await loadAdminPermissions();
  const canManage = Boolean(perm?.permissions.envios_gestionar);

  const departments = await fetchShippingDepartments(supabase);
  const defaultDept = departments[0]?.code ?? "05";
  const deptParam = typeof sp.dept === "string" ? sp.dept : defaultDept;
  const departmentCode =
    departments.some((d) => d.code === deptParam) ? deptParam : defaultDept;

  const municipalities = await searchShippingMunicipalitiesAdmin(supabase, {
    departmentCode,
    limit: 500,
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/admin" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Reportes
            </Link>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-zinc-700 dark:text-zinc-300">Envíos</span>
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl md:text-3xl">
            Tarifas de envío
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Configura el costo de envío por municipio en Colombia. La tienda en línea y el
            facturador del punto de venta cotizan automáticamente según el destino elegido.
          </p>
        </div>
      </div>

      {saved ? (
        <p
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
          role="status"
        >
          Cambios guardados.
        </p>
      ) : null}

      {errMsg ? (
        <p
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100"
          role="alert"
        >
          {errMsg}
        </p>
      ) : null}

      {departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-400">
          <p>No hay departamentos cargados.</p>
          <p className="mt-2">
            Ejecuta{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              npm run seed:shipping-geo
            </code>{" "}
            para importar la división política de Colombia (DIVIPOLA).
          </p>
        </div>
      ) : (
        <ShippingRatesManager
          departments={departments}
          initialDepartmentCode={departmentCode}
          municipalities={municipalities}
          canManage={canManage}
        />
      )}
    </div>
  );
}
