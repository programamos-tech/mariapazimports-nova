import { normalizeDocumentIdForMatch } from "@/lib/normalize-document-id";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export { normalizeDocumentIdForMatch } from "@/lib/normalize-document-id";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type CustomerLinkRow = {
  name?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
  document_id?: string | null;
};

function isDuplicateDbError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "23505" ||
    error.message?.toLowerCase().includes("duplicate") ||
    error.message?.toLowerCase().includes("unique")
  );
}

async function linkCustomerRow(
  sb: ServiceClient,
  rowId: string,
  userId: string,
  emailLc: string,
  displayName: string | null | undefined,
  docNorm: string | null,
  row: CustomerLinkRow,
): Promise<string | null> {
  if (row.auth_user_id && row.auth_user_id !== userId) {
    return null;
  }

  const nameTrim = displayName?.trim();
  const patch: Record<string, unknown> = { auth_user_id: userId };

  if (nameTrim && !row.name?.trim()) {
    patch.name = nameTrim;
  }
  if (emailLc && (row.email ?? "").toLowerCase().trim() !== emailLc) {
    patch.email = emailLc;
  }
  if (docNorm) {
    const existingNorm = normalizeDocumentIdForMatch(row.document_id);
    if (!existingNorm || existingNorm === docNorm) {
      patch.document_id = docNorm;
    }
  }

  const { error } = await sb.from("customers").update(patch).eq("id", rowId);

  if (isDuplicateDbError(error)) {
    const { error: e2 } = await sb
      .from("customers")
      .update({ auth_user_id: userId })
      .eq("id", rowId);
    if (e2) {
      if (process.env.NODE_ENV === "development") {
        console.error("[linkCustomerRow] fallback", e2.message);
      }
      return null;
    }
    return rowId;
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[linkCustomerRow]", error.message);
    }
    return null;
  }

  return rowId;
}

async function customerIdForAuthUser(
  sb: ServiceClient,
  userId: string,
): Promise<string | null> {
  const { data } = await sb
    .from("customers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

async function tryLinkByDocument(
  sb: ServiceClient,
  userId: string,
  emailLc: string,
  displayName: string | null | undefined,
  docNorm: string,
): Promise<string | null> {
  const { data: docCustomerId, error: rpcErr } = await sb.rpc(
    "find_customer_id_by_document_normalized",
    { p_normalized: docNorm },
  );

  if (rpcErr && process.env.NODE_ENV === "development") {
    console.error("[ensureStoreCustomerLinked] rpc doc", rpcErr.message);
  }

  const cid =
    typeof docCustomerId === "string"
      ? docCustomerId
      : docCustomerId != null
        ? String(docCustomerId)
        : null;

  if (!cid) return null;

  const { data: docRow } = await sb
    .from("customers")
    .select("id, name, email, auth_user_id, document_id")
    .eq("id", cid)
    .maybeSingle();

  if (!docRow?.id) return null;

  return linkCustomerRow(
    sb,
    String(docRow.id),
    userId,
    emailLc,
    displayName,
    docNorm,
    docRow,
  );
}

async function tryLinkByEmail(
  sb: ServiceClient,
  userId: string,
  emailLc: string,
  displayName: string | null | undefined,
  docNorm: string | null,
): Promise<string | null> {
  const { data: byEmail } = await sb
    .from("customers")
    .select("id, name, email, auth_user_id, document_id")
    .eq("email", emailLc)
    .maybeSingle();

  if (!byEmail?.id) return null;

  return linkCustomerRow(
    sb,
    String(byEmail.id),
    userId,
    emailLc,
    displayName,
    docNorm,
    byEmail,
  );
}

async function insertLinkedCustomer(
  sb: ServiceClient,
  userId: string,
  emailLc: string,
  displayName: string | null | undefined,
  docNorm: string | null,
): Promise<string | null> {
  const nameTrim = displayName?.trim() || "Cliente";
  const { data: inserted, error } = await sb
    .from("customers")
    .insert({
      name: nameTrim,
      email: emailLc,
      source: "storefront",
      auth_user_id: userId,
      document_id: docNorm ?? null,
    })
    .select("id")
    .single();

  if (!error && inserted?.id) {
    return String(inserted.id);
  }

  if (isDuplicateDbError(error)) {
    const existingAuth = await customerIdForAuthUser(sb, userId);
    if (existingAuth) return existingAuth;

    const linkedByEmail = await tryLinkByEmail(
      sb,
      userId,
      emailLc,
      displayName,
      docNorm,
    );
    if (linkedByEmail) return linkedByEmail;
  }

  if (error && docNorm) {
    const { data: insertedNoDoc, error: insertNoDocErr } = await sb
      .from("customers")
      .insert({
        name: nameTrim,
        email: emailLc,
        source: "storefront",
        auth_user_id: userId,
        document_id: null,
      })
      .select("id")
      .single();

    if (!insertNoDocErr && insertedNoDoc?.id) {
      return String(insertedNoDoc.id);
    }

    if (isDuplicateDbError(insertNoDocErr)) {
      const existingAuth = await customerIdForAuthUser(sb, userId);
      if (existingAuth) return existingAuth;
      return tryLinkByEmail(sb, userId, emailLc, displayName, null);
    }
  }

  if (error && process.env.NODE_ENV === "development") {
    console.error("[ensureStoreCustomerLinked] insert", error.message);
  }

  return null;
}

/**
 * Idempotent: fila en `customers` con `auth_user_id`.
 * Prioridad: 1) ya vinculado 2) mismo documento (manual/POS) 3) mismo email 4) insert.
 * Si el documento pertenece a otra cuenta, sigue intentando por correo o alta nueva.
 */
export async function ensureStoreCustomerLinked(
  userId: string,
  email: string | undefined,
  displayName?: string | null,
  documentRaw?: string | null,
): Promise<string | null> {
  const sb = createSupabaseServiceClient();
  const emailLc = (email ?? "").toLowerCase().trim();
  if (!emailLc) {
    return null;
  }

  const docNorm = normalizeDocumentIdForMatch(documentRaw);

  const existingAuth = await customerIdForAuthUser(sb, userId);
  if (existingAuth) {
    return existingAuth;
  }

  if (docNorm) {
    const linkedByDoc = await tryLinkByDocument(
      sb,
      userId,
      emailLc,
      displayName,
      docNorm,
    );
    if (linkedByDoc) {
      return linkedByDoc;
    }
  }

  const linkedByEmail = await tryLinkByEmail(
    sb,
    userId,
    emailLc,
    displayName,
    docNorm,
  );
  if (linkedByEmail) {
    return linkedByEmail;
  }

  return insertLinkedCustomer(sb, userId, emailLc, displayName, docNorm);
}

/** Vincula auth al cliente del correo si aún no tiene dueño de cuenta. */
export async function attachAuthUserToCustomerEmail(
  userId: string,
  email: string,
): Promise<string | null> {
  const sb = createSupabaseServiceClient();
  const emailLc = email.toLowerCase().trim();
  if (!emailLc) return null;

  const existingAuth = await customerIdForAuthUser(sb, userId);
  if (existingAuth) return existingAuth;

  const { data: row } = await sb
    .from("customers")
    .select("id, auth_user_id")
    .eq("email", emailLc)
    .maybeSingle();

  if (!row?.id) return null;
  if (row.auth_user_id && row.auth_user_id !== userId) return null;

  const { error } = await sb
    .from("customers")
    .update({ auth_user_id: userId })
    .eq("id", row.id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[attachAuthUserToCustomerEmail]", error.message);
    }
    return null;
  }

  return String(row.id);
}

/** True si la cédula ya pertenece a otra cuenta de tienda registrada. */
export async function isDocumentRegisteredToAnotherAccount(
  documentNorm: string,
): Promise<boolean> {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb.rpc("document_has_registered_account", {
    p_normalized: documentNorm,
  });

  if (!error && typeof data === "boolean") {
    return data;
  }

  if (error && process.env.NODE_ENV === "development") {
    console.error(
      "[isDocumentRegisteredToAnotherAccount]",
      error.message,
    );
  }

  const { data: docCustomerId } = await sb.rpc(
    "find_customer_id_by_document_normalized",
    { p_normalized: documentNorm },
  );
  if (!docCustomerId) return false;

  const { data: row } = await sb
    .from("customers")
    .select("auth_user_id")
    .eq("id", String(docCustomerId))
    .maybeSingle();

  return Boolean(row?.auth_user_id);
}
