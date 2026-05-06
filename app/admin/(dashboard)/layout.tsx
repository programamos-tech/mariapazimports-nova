import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-stretch bg-zinc-100 text-zinc-900 antialiased">
      <AdminSidebar userEmail={user?.email ?? ""} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-zinc-100">
        <AdminTopBar userEmail={user?.email ?? ""} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
