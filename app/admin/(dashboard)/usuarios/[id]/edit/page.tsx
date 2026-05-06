import { notFound } from "next/navigation";
import {
  EditCollaboratorHeader,
  NewCollaboraboratorForm,
} from "@/components/admin/NewCollaboraboratorForm";
import { mergePermissionsWithDefaults, type PermissionMap } from "@/lib/admin-permissions";
import { storeBrand } from "@/lib/brand";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "validation":
      return "Revisá los datos del formulario.";
    case "duplicate_username":
      return "Ese usuario corto ya está en uso.";
    case "no_service":
      return "Falta SUPABASE_SERVICE_ROLE_KEY para actualizar la contraseña desde el servidor.";
    case "db":
      return "No se pudo guardar.";
    default:
      return "Error al guardar.";
  }
}

export default async function AdminEditColaboradorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) notFound();

  let publicEmail = row.public_email as string | null;
  if (!publicEmail?.trim()) {
    try {
      const service = createSupabaseServiceClient();
      const { data } = await service.auth.admin.getUserById(id);
      publicEmail = data.user?.email ?? null;
    } catch {
      /* sin service key */
    }
  }

  const jobRole = (row.job_role === "owner" ? "owner" : "cashier") as "owner" | "cashier";
  const permissions = mergePermissionsWithDefaults(
    row.permissions as PermissionMap | null,
    jobRole,
  );

  const initial = {
    profileId: row.id as string,
    display_name: (row.display_name as string | null) ?? null,
    login_username: (row.login_username as string | null) ?? null,
    public_email: publicEmail,
    job_role: jobRole,
    branch_label: (row.branch_label as string | null) ?? storeBrand,
    avatar_variant: (row.avatar_variant as string | null) ?? "A",
    permissions,
    is_active: row.is_active !== false,
  };

  const title =
    initial.display_name?.trim() || initial.login_username?.trim() || "Colaborador";

  return (
    <div className="mx-auto max-w-7xl">
      <EditCollaboratorHeader name={title} />
      {errorMessage(err) ? (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {errorMessage(err)}
        </p>
      ) : null}
      <NewCollaboraboratorForm
        mode="edit"
        branchDefault={storeBrand}
        storeLabel={storeBrand}
        initial={initial}
      />
    </div>
  );
}
