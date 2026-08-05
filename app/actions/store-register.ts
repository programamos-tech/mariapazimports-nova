"use server";

import { normalizeDocumentIdForMatch, emailConflictsWithDocument } from "@/lib/normalize-document-id";
import {
  ensureStoreCustomerLinked,
  isDocumentRegisteredToAnotherAccount,
} from "@/lib/store-customer-service";
import { notifyStoreCustomerRegistered } from "@/lib/admin-notifications";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type RegisterStoreCustomerResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "name"
        | "document"
        | "document_email_conflict"
        | "duplicate_document"
        | "email"
        | "password"
        | "duplicate_email"
        | "config"
        | "auth";
      message?: string;
    };

export async function registerStoreCustomer(input: {
  name: string;
  email: string;
  password: string;
  documentId: string;
}): Promise<RegisterStoreCustomerResult> {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const documentNorm = normalizeDocumentIdForMatch(input.documentId);

  if (!name) return { ok: false, error: "name" };
  if (!documentNorm) return { ok: false, error: "document" };
  if (!email || !email.includes("@")) return { ok: false, error: "email" };
  if (emailConflictsWithDocument(documentNorm, email)) {
    return { ok: false, error: "document_email_conflict" };
  }
  if (password.length < 6) return { ok: false, error: "password" };

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return { ok: false, error: "config" };
  }

  if (await isDocumentRegisteredToAnotherAccount(documentNorm)) {
    return { ok: false, error: "duplicate_document" };
  }

  const { data: created, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      document_id: documentNorm,
    },
  });

  if (error || !created.user) {
    const msg = (error?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "duplicate_email" };
    }
    return { ok: false, error: "auth", message: error?.message };
  }

  const customerId = await ensureStoreCustomerLinked(
    created.user.id,
    email,
    name,
    documentNorm,
  );

  if (customerId) {
    await notifyStoreCustomerRegistered({
      customerId,
      name,
      email,
    });
  }

  return { ok: true };
}
