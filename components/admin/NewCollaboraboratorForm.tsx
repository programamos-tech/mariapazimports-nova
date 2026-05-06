"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  inviteCollaboratorAction,
  updateCollaboratorAction,
} from "@/app/actions/admin/collaborators";
import { CustomerAvatar } from "@/components/admin/CustomerAvatar";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import {
  mergePermissionsWithDefaults,
  permissionsFromRoleTemplate,
  PERMISSION_MODULES,
  type PermissionKey,
  type PermissionMap,
} from "@/lib/admin-permissions";
import { slugUsername } from "@/lib/collaborator-utils";

const AVATAR_VARIANTS = ["A", "B", "C", "D"] as const;

export type CollaboratorInitial = {
  profileId: string;
  display_name: string | null;
  login_username: string | null;
  public_email: string | null;
  job_role: "owner" | "cashier";
  branch_label: string | null;
  avatar_variant: string | null;
  permissions: PermissionMap | null;
  is_active: boolean;
};

export function NewCollaboratorHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/usuarios" className="hover:text-zinc-800">
            Usuarios y roles
          </Link>
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Nuevo colaborador</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Nuevo colaborador
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Registra un colaborador: foto, nombre y usuario corto para acceso al sistema.
        </p>
      </div>
      <Link
        href="/admin/usuarios"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function EditCollaboratorHeader({ name }: { name: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          <Link href="/admin/usuarios" className="hover:text-zinc-800">
            Usuarios y roles
          </Link>
          <span className="mx-1.5 text-zinc-300">/</span>
          <span className="text-zinc-700">Editar</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Editar colaborador
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">{name}</p>
      </div>
      <Link
        href="/admin/usuarios"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

function roleLabel(role: "owner" | "cashier") {
  return role === "owner" ? "Dueño" : "Cajero";
}

type Props = {
  mode: "create" | "edit";
  branchDefault: string;
  storeLabel: string;
  initial?: CollaboratorInitial;
};

export function NewCollaboraboratorForm({ mode, branchDefault, storeLabel, initial }: Props) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [loginUsername, setLoginUsername] = useState(initial?.login_username ?? "");
  const [usernameTouched, setUsernameTouched] = useState(mode === "edit");
  const [email, setEmail] = useState(initial?.public_email ?? "");
  const [password, setPassword] = useState("");
  const [jobRole, setJobRole] = useState<"owner" | "cashier">(initial?.job_role ?? "cashier");
  const [branchLabel, setBranchLabel] = useState(initial?.branch_label ?? branchDefault);
  const [avatarVariant, setAvatarVariant] = useState(
    (initial?.avatar_variant ?? "A").slice(0, 1).toUpperCase() || "A",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [permissions, setPermissions] = useState<PermissionMap>(() =>
    mergePermissionsWithDefaults(
      initial?.permissions ?? undefined,
      initial?.job_role ?? "cashier",
    ),
  );

  useEffect(() => {
    if (mode === "edit" || usernameTouched) return;
    setLoginUsername(slugUsername(displayName));
  }, [displayName, mode, usernameTouched]);

  const avatarSeed = useMemo(() => {
    const base = (email || displayName || "nuevo").trim().toLowerCase();
    return `${base}:av:${avatarVariant}`;
  }, [email, displayName, avatarVariant]);

  const payloadJson = useMemo(() => JSON.stringify(permissions), [permissions]);

  const summaryName = displayName.trim() || "—";
  const summaryUser = loginUsername.trim() || "—";
  const summaryRole = roleLabel(jobRole);

  function togglePermission(key: PermissionKey, readOnly?: boolean) {
    if (readOnly) return;
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  function restoreByRole() {
    setPermissions(permissionsFromRoleTemplate(jobRole));
  }

  const canSubmitCreate =
    displayName.trim().length > 0 &&
    loginUsername.trim().length > 0 &&
    email.includes("@") &&
    password.length >= 6 &&
    branchLabel.trim().length > 0;

  const canSubmitEdit =
    displayName.trim().length > 0 &&
    loginUsername.trim().length > 0 &&
    branchLabel.trim().length > 0 &&
    (password.length === 0 || password.length >= 6);

  const canSubmit = mode === "create" ? canSubmitCreate : canSubmitEdit;

  return (
    <form
      action={mode === "create" ? inviteCollaboratorAction : updateCollaboratorAction}
      className="space-y-6"
    >
      {mode === "edit" && initial ? (
        <input type="hidden" name="profile_id" value={initial.profileId} readOnly />
      ) : null}
      <input type="hidden" name="permissions_json" value={payloadJson} readOnly />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Datos del colaborador</h2>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <p className={labelClass}>Avatar</p>
                <div className="mt-2 flex items-center gap-4">
                  <CustomerAvatar
                    seed={avatarSeed}
                    size={72}
                    className="shadow-md ring-2 ring-zinc-200/90"
                    label="Avatar del colaborador"
                  />
                  <div className="min-w-0">
                    <label className="sr-only" htmlFor="avatar-variant">
                      Variante de personaje
                    </label>
                    <select
                      id="avatar-variant"
                      name="avatar_variant"
                      value={avatarVariant}
                      onChange={(e) => setAvatarVariant(e.target.value.slice(0, 1).toUpperCase())}
                      className={inputClass}
                    >
                      {AVATAR_VARIANTS.map((v) => (
                        <option key={v} value={v}>
                          Personaje {v}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      Personaje generado (DiceBear). Elegí una variante; se guarda con la cuenta.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="display_name" className={labelClass}>
                  Nombre completo <span className="text-red-600">*</span>
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. María López"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="login_username" className={labelClass}>
                  Usuario (acceso) <span className="text-red-600">*</span>
                </label>
                <input
                  id="login_username"
                  name="login_username"
                  required
                  value={loginUsername}
                  onChange={(e) => {
                    setUsernameTouched(true);
                    setLoginUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                  }}
                  placeholder="Ej. mlopez"
                  autoComplete="username"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Generado automáticamente desde el nombre. Corto y sin espacios.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelClass}>
                  Correo <span className="text-red-600">*</span>
                </label>
                {mode === "create" ? (
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. maria@tienda.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                ) : (
                  <>
                    <input
                      id="email"
                      type="email"
                      readOnly
                      value={email}
                      className={`${inputClass} bg-zinc-50 text-zinc-600`}
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      El correo de acceso no se puede cambiar desde aquí.
                    </p>
                  </>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="password" className={labelClass}>
                  {mode === "create" ? (
                    <>
                      Contraseña inicial <span className="text-red-600">*</span>
                    </>
                  ) : (
                    "Nueva contraseña (opcional)"
                  )}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={mode === "create"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Dejar vacío para no cambiar"}
                  autoComplete="new-password"
                  className={inputClass}
                  minLength={mode === "create" ? 6 : undefined}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  {mode === "create"
                    ? "El colaborador podrá cambiarla al iniciar sesión."
                    : "Solo se actualiza si escribís al menos 6 caracteres."}
                </p>
              </div>
              <div>
                <label htmlFor="job_role" className={labelClass}>
                  Rol
                </label>
                <select
                  id="job_role"
                  name="job_role"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value as "owner" | "cashier")}
                  className={inputClass}
                >
                  <option value="cashier">Cajero</option>
                  <option value="owner">Dueño</option>
                </select>
              </div>
              <div>
                <label htmlFor="branch_label" className={labelClass}>
                  Sucursal <span className="text-red-600">*</span>
                </label>
                <select
                  id="branch_label"
                  name="branch_label"
                  value={branchLabel}
                  onChange={(e) => setBranchLabel(e.target.value)}
                  className={inputClass}
                >
                  <option value={branchDefault}>{branchDefault}</option>
                </select>
                <p className="mt-2 text-xs text-zinc-500">
                  El colaborador trabajará con datos de inventario, ventas y clientes de esta
                  sucursal.
                </p>
              </div>
              {mode === "edit" ? (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input
                    type="hidden"
                    name="is_active"
                    value={isActive ? "true" : "false"}
                    readOnly
                  />
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-zinc-800">
                    Colaborador activo
                  </label>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className={sectionTitle}>Permisos</h2>
              <button
                type="button"
                onClick={restoreByRole}
                className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
              >
                Restaurar por rol
              </button>
            </div>
            <div className="mt-4 max-h-[min(28rem,55vh)] space-y-6 overflow-y-auto pr-1">
              {PERMISSION_MODULES.map((mod) => (
                <div key={mod.id}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                    {mod.label}
                  </p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {mod.items.map((item) => (
                      <label
                        key={item.key}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border border-transparent px-1 py-1 hover:bg-zinc-50 ${item.readOnly ? "opacity-80" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(permissions[item.key])}
                          onChange={() => togglePermission(item.key, item.readOnly)}
                          disabled={item.readOnly}
                          className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm leading-snug text-zinc-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className={sectionTitle}>Resumen</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Colaborador</dt>
                <dd className="max-w-[58%] truncate text-right font-medium text-zinc-900">
                  {summaryName}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Usuario</dt>
                <dd className="max-w-[58%] truncate text-right font-medium text-zinc-900">
                  {summaryUser}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Rol</dt>
                <dd className="text-right font-medium text-zinc-900">{summaryRole}</dd>
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <dt className="text-zinc-500">Sucursal</dt>
                <dd className="max-w-[58%] truncate text-right text-zinc-800">{branchLabel || "—"}</dd>
              </div>
            </dl>
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full rounded-lg bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {mode === "create" ? "Crear colaborador" : "Guardar cambios"}
            </button>
          </section>

          <p className="text-center text-xs text-zinc-400">{storeLabel}</p>
        </div>
      </div>
    </form>
  );
}
