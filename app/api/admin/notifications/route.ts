import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminNotificationRow } from "@/lib/admin-notifications";

export const dynamic = "force-dynamic";

/** Lista notificaciones recientes del panel + flag leído por el usuario actual. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("admin_notifications")
    .select(
      "id, created_at, kind, title, body, href, entity_type, entity_id, metadata",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => r.id as string);
  const readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await supabase
      .from("admin_notification_reads")
      .select("notification_id")
      .eq("profile_id", user.id)
      .in("notification_id", ids);
    for (const r of reads ?? []) {
      readSet.add(String(r.notification_id));
    }
  }

  const notifications: AdminNotificationRow[] = (rows ?? []).map((r) => ({
    id: String(r.id),
    created_at: String(r.created_at),
    kind: r.kind as AdminNotificationRow["kind"],
    title: String(r.title),
    body: String(r.body ?? ""),
    href: r.href != null ? String(r.href) : null,
    entity_type: r.entity_type != null ? String(r.entity_type) : null,
    entity_id: r.entity_id != null ? String(r.entity_id) : null,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    read: readSet.has(String(r.id)),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

/** Marca notificaciones como leídas para el usuario actual. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { ids?: string[]; all?: boolean } = {};
  try {
    body = (await request.json()) as { ids?: string[]; all?: boolean };
  } catch {
    body = {};
  }

  let ids = Array.isArray(body.ids)
    ? body.ids.map(String).filter(Boolean)
    : [];

  if (body.all) {
    const { data: recent } = await supabase
      .from("admin_notifications")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(50);
    ids = (recent ?? []).map((r) => String(r.id));
  }

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, marked: 0 });
  }

  const rows = ids.map((notification_id) => ({
    notification_id,
    profile_id: user.id,
  }));

  const { error } = await supabase
    .from("admin_notification_reads")
    .upsert(rows, { onConflict: "notification_id,profile_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, marked: ids.length });
}
