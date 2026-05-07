import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perm = await loadAdminPermissions();
  const canViewActivities = Boolean(perm?.permissions.actividades_ver);

  return (
    <AdminDashboardShell canViewActivities={canViewActivities}>
      {children}
    </AdminDashboardShell>
  );
}
