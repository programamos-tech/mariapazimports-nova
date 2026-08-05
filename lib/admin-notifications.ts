import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatCop } from "@/lib/money";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";

export type AdminNotificationKind =
  | "store_customer_registered"
  | "store_order_created";

export type AdminNotificationRow = {
  id: string;
  created_at: string;
  kind: AdminNotificationKind;
  title: string;
  body: string;
  href: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
};

/** Inserta una notificación de panel (service role; no lanza). */
export async function createAdminNotification(params: {
  kind: AdminNotificationKind;
  title: string;
  body?: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sb = createSupabaseServiceClient();
    const { error } = await sb.from("admin_notifications").insert({
      kind: params.kind,
      title: params.title.slice(0, 200),
      body: (params.body ?? "").slice(0, 1000),
      href: params.href ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
    if (error) {
      console.error("[createAdminNotification]", error.message);
    }
  } catch (e) {
    console.error("[createAdminNotification]", e);
  }
}

export async function notifyStoreCustomerRegistered(params: {
  customerId: string;
  name: string;
  email: string;
}): Promise<void> {
  const name = params.name.trim() || "Cliente";
  const email = params.email.trim().toLowerCase();
  await createAdminNotification({
    kind: "store_customer_registered",
    title: "Nuevo registro en la tienda",
    body: email ? `${name} · ${email}` : name,
    href: `/admin/customers/${params.customerId}`,
    entityType: "customer",
    entityId: params.customerId,
    metadata: { name, email, source: "storefront_register" },
  });
}

export async function notifyStoreOrderCreated(params: {
  orderId: string;
  customerName: string;
  totalCents: number;
  paymentMethod: "bank_transfer" | "wompi" | string;
  itemLabels: string[];
}): Promise<void> {
  const orderRef = ventaNumeroReferencia(params.orderId);
  const name = params.customerName.trim() || "Cliente";
  const pay =
    params.paymentMethod === "bank_transfer"
      ? "Transferencia"
      : params.paymentMethod === "wompi"
        ? "Wompi"
        : params.paymentMethod;
  const itemsPreview = params.itemLabels
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);
  const more =
    params.itemLabels.length > itemsPreview.length
      ? ` (+${params.itemLabels.length - itemsPreview.length})`
      : "";
  const itemsLine =
    itemsPreview.length > 0
      ? `${itemsPreview.join(" · ")}${more}`
      : "Sin ítems";

  await createAdminNotification({
    kind: "store_order_created",
    title: "Nuevo pedido",
    body: `#${orderRef} · ${name} · ${formatCop(params.totalCents)} · ${pay}`,
    href: `/admin/orders/${params.orderId}`,
    entityType: "order",
    entityId: params.orderId,
    metadata: {
      orderRef,
      customerName: name,
      totalCents: params.totalCents,
      paymentMethod: params.paymentMethod,
      paymentLabel: pay,
      itemsPreview,
      itemCount: params.itemLabels.length,
      source: "storefront_checkout",
    },
  });
}
