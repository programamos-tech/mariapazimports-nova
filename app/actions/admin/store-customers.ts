"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normEmail(v: string): string | null {
  const t = v.trim().toLowerCase();
  return t ? t : null;
}

type AddressPayload = {
  label: string;
  address_line: string;
  reference: string;
};

export async function createStoreCustomer(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const documentId = String(formData.get("document_id") ?? "").trim();

  let addresses: AddressPayload[] = [];
  try {
    const raw = String(formData.get("addresses_payload") ?? "").trim();
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) redirect("/admin/customers/new?error=addresses_invalid");
      addresses = parsed.map((row) => ({
        label: String((row as AddressPayload).label ?? "Casa").trim() || "Casa",
        address_line: String((row as AddressPayload).address_line ?? "").trim(),
        reference: String((row as AddressPayload).reference ?? "").trim(),
      }));
    }
  } catch {
    redirect("/admin/customers/new?error=addresses_invalid");
  }

  const meaningful = addresses.filter(
    (a) => a.address_line.length > 0 || a.reference.length > 0,
  );

  const email = normEmail(emailRaw);

  if (!name) redirect("/admin/customers/new?error=name");

  if (email) {
    const { data: dup } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (dup) redirect("/admin/customers/new?error=duplicate_email");
  }

  const primary = meaningful[0];
  const shippingAddress = primary
    ? [primary.address_line, primary.reference].filter(Boolean).join("\n\n") || null
    : null;

  const { data: cust, error: insertErr } = await supabase
    .from("customers")
    .insert({
      name,
      email,
      phone: phone || null,
      document_id: documentId || null,
      shipping_address: shippingAddress,
      shipping_city: null,
      shipping_postal_code: null,
      source: "manual",
    })
    .select("id")
    .single();

  if (insertErr || !cust) redirect("/admin/customers/new?error=db");

  const customerId = cust.id as string;

  if (meaningful.length > 0) {
    const rows = meaningful.map((a, i) => ({
      customer_id: customerId,
      label: a.label,
      address_line: a.address_line,
      reference: a.reference,
      sort_order: i,
    }));

    const { error: addrErr } = await supabase.from("customer_addresses").insert(rows);

    if (addrErr) {
      await supabase.from("customers").delete().eq("id", customerId);
      redirect("/admin/customers/new?error=db");
    }
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateStoreCustomer(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const customerId = String(formData.get("customer_id") ?? "").trim();
  if (!customerId) redirect("/admin/customers");

  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const documentId = String(formData.get("document_id") ?? "").trim();

  let addresses: AddressPayload[] = [];
  try {
    const raw = String(formData.get("addresses_payload") ?? "").trim();
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        redirect(`/admin/customers/${customerId}/edit?error=addresses_invalid`);
      }
      addresses = parsed.map((row) => ({
        label: String((row as AddressPayload).label ?? "Casa").trim() || "Casa",
        address_line: String((row as AddressPayload).address_line ?? "").trim(),
        reference: String((row as AddressPayload).reference ?? "").trim(),
      }));
    }
  } catch {
    redirect(`/admin/customers/${customerId}/edit?error=addresses_invalid`);
  }

  const meaningful = addresses.filter(
    (a) => a.address_line.length > 0 || a.reference.length > 0,
  );

  const email = normEmail(emailRaw);

  if (!name) {
    redirect(`/admin/customers/${customerId}/edit?error=name`);
  }

  if (email) {
    const { data: dup } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .neq("id", customerId)
      .maybeSingle();
    if (dup) {
      redirect(`/admin/customers/${customerId}/edit?error=duplicate_email`);
    }
  }

  const primary = meaningful[0];
  const shippingAddress = primary
    ? [primary.address_line, primary.reference].filter(Boolean).join("\n\n") || null
    : null;

  const { error: upErr } = await supabase
    .from("customers")
    .update({
      name,
      email,
      phone: phone || null,
      document_id: documentId || null,
      shipping_address: shippingAddress,
    })
    .eq("id", customerId);

  if (upErr) {
    redirect(`/admin/customers/${customerId}/edit?error=db`);
  }

  const { error: delErr } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("customer_id", customerId);

  if (delErr) {
    redirect(`/admin/customers/${customerId}/edit?error=db`);
  }

  if (meaningful.length > 0) {
    const rows = meaningful.map((a, i) => ({
      customer_id: customerId,
      label: a.label,
      address_line: a.address_line,
      reference: a.reference,
      sort_order: i,
    }));

    const { error: addrErr } = await supabase.from("customer_addresses").insert(rows);

    if (addrErr) {
      redirect(`/admin/customers/${customerId}/edit?error=db`);
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}

export async function deleteCustomerById(customerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = customerId.trim();
  if (!id) redirect("/admin/customers");

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    redirect(`/admin/customers/${id}?error=delete`);
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function deleteCustomerAction(formData: FormData) {
  await deleteCustomerById(String(formData.get("customer_id") ?? ""));
}
