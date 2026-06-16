/** Solo dígitos, mínimo 6 (cédula / documento). Uso en cliente y servidor. */
export function normalizeDocumentIdForMatch(
  raw: string | null | undefined,
): string | null {
  if (raw == null || String(raw).trim() === "") {
    return null;
  }
  const d = String(raw).replace(/\D/g, "");
  if (d.length < 6 || d.length > 15) {
    return null;
  }
  return d;
}

/** El correo no puede ser la cédula ni usarla como usuario (ej. 1234567890@gmail.com). */
export function emailConflictsWithDocument(
  documentNorm: string,
  email: string,
): boolean {
  const emailLc = email.trim().toLowerCase();
  const at = emailLc.indexOf("@");
  if (at <= 0) return false;

  const local = emailLc.slice(0, at);
  const localDigits = local.replace(/\D/g, "");

  return local === documentNorm || localDigits === documentNorm;
}
