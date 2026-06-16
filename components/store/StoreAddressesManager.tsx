"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import {
  storeBtnPrimaryClass,
  storeBtnSecondaryClass,
  storeFieldInputClass,
  storeFieldLabelClass,
} from "@/components/store/store-ui-primitives";

type Row = {
  id: string;
  label: string;
  address_line: string;
  reference: string;
  sort_order: number;
};

type AddressForm = {
  label: string;
  address_line: string;
  reference: string;
};

const emptyForm = (): AddressForm => ({
  label: "Casa",
  address_line: "",
  reference: "",
});

const defaultInputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--store-accent)]/20";
const defaultLabelClass = "mb-2 block text-sm font-medium text-stone-800";
const defaultBtnPrimary =
  "rounded-full bg-[var(--store-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--store-accent-hover)] disabled:opacity-60";
const defaultBtnGhost =
  "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50";

type Props = {
  variant?: "default" | "settings";
};

function AddressFields({
  form,
  setForm,
  inputClass,
  labelClass,
}: {
  form: AddressForm;
  setForm: React.Dispatch<React.SetStateAction<AddressForm>>;
  inputClass: string;
  labelClass: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-1">
        <span className={labelClass}>Etiqueta</span>
        <input
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="Casa, trabajo…"
          className={inputClass}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Dirección</span>
        <input
          value={form.address_line}
          onChange={(e) =>
            setForm((f) => ({ ...f, address_line: e.target.value }))
          }
          required
          placeholder="Calle, número, barrio…"
          className={inputClass}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>Referencia (opcional)</span>
        <input
          value={form.reference}
          onChange={(e) =>
            setForm((f) => ({ ...f, reference: e.target.value }))
          }
          placeholder="Torre, apartamento…"
          className={inputClass}
        />
      </label>
    </div>
  );
}

export function StoreAddressesManager({ variant = "default" }: Props) {
  const isSettings = variant === "settings";
  const inputClass = isSettings ? storeFieldInputClass : defaultInputClass;
  const labelClass = isSettings ? storeFieldLabelClass : defaultLabelClass;

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editForm, setEditForm] = useState<AddressForm>(emptyForm);

  const load = useCallback(async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: me, error: meErr } = await supabase
      .from("customers")
      .select("id")
      .maybeSingle();

    if (meErr) {
      setError("No se pudo cargar tu perfil de cliente.");
      setLoading(false);
      return;
    }
    if (!me?.id) {
      setError(
        "Tu cuenta aún no está vinculada al catálogo. Volvé a iniciar sesión o contactanos.",
      );
      setLoading(false);
      return;
    }

    setCustomerId(me.id as string);

    const { data: addresses, error: aErr } = await supabase
      .from("customer_addresses")
      .select("id, label, address_line, reference, sort_order")
      .eq("customer_id", me.id)
      .order("sort_order", { ascending: true });

    if (aErr) {
      setError("No se pudieron cargar las direcciones.");
      setLoading(false);
      return;
    }

    setRows((addresses ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  function startEdit(row: Row) {
    setEditingId(row.id);
    setEditForm({
      label: row.label,
      address_line: row.address_line,
      reference: row.reference,
    });
    setShowAddForm(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !form.address_line.trim()) {
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const nextOrder =
      rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
    const { error: insErr } = await supabase.from("customer_addresses").insert({
      customer_id: customerId,
      label: form.label.trim() || "Casa",
      address_line: form.address_line.trim(),
      reference: form.reference.trim(),
      sort_order: nextOrder,
    });
    setSaving(false);
    if (insErr) {
      setError("No se pudo guardar la dirección.");
      return;
    }
    setForm(emptyForm());
    if (isSettings) {
      setShowAddForm(false);
    }
    await load();
  }

  async function handleUpdate(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!editForm.address_line.trim()) {
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: upErr } = await supabase
      .from("customer_addresses")
      .update({
        label: editForm.label.trim() || "Casa",
        address_line: editForm.address_line.trim(),
        reference: editForm.reference.trim(),
      })
      .eq("id", id);
    setSaving(false);
    if (upErr) {
      setError("No se pudo actualizar la dirección.");
      return;
    }
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta dirección?")) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: delErr } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id);
    if (delErr) {
      setError("No se pudo eliminar.");
      return;
    }
    if (editingId === id) {
      setEditingId(null);
    }
    await load();
  }

  if (loading) {
    return (
      <p className="text-sm text-stone-500" role="status">
        Cargando direcciones…
      </p>
    );
  }

  if (isSettings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
            Direcciones de envío
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowAddForm((v) => !v);
              setEditingId(null);
            }}
            className={storeBtnSecondaryClass}
          >
            {showAddForm ? "Cerrar" : "Agregar"}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200/90 bg-red-50/90 px-3 py-2.5 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <ul className="divide-y divide-stone-200">
            {rows.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                {editingId === r.id ? (
                  <form
                    onSubmit={(e) => void handleUpdate(e, r.id)}
                    className="space-y-4 border border-stone-200 bg-stone-50/50 p-4 sm:p-5"
                  >
                    <AddressFields
                      form={editForm}
                      setForm={setEditForm}
                      inputClass={inputClass}
                      labelClass={labelClass}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className={storeBtnPrimaryClass}
                      >
                        {saving ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={storeBtnSecondaryClass}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {r.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">
                        {r.address_line}
                      </p>
                      {r.reference ? (
                        <p className="mt-1 text-sm text-stone-500">
                          Ref: {r.reference}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className={storeBtnSecondaryClass}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(r.id)}
                        className={storeBtnSecondaryClass}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : !showAddForm ? (
          <p className="text-sm leading-relaxed text-stone-600">
            No tenés direcciones guardadas.
          </p>
        ) : null}

        {showAddForm ? (
          <form
            onSubmit={handleAdd}
            className="border border-stone-200 bg-white p-5 sm:p-6"
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900">
              Nueva dirección
            </p>
            <AddressFields
              form={form}
              setForm={setForm}
              inputClass={inputClass}
              labelClass={labelClass}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !customerId}
                className={storeBtnPrimaryClass}
              >
                {saving ? "Guardando…" : "Guardar dirección"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={storeBtnSecondaryClass}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-semibold text-stone-900">{r.label}</p>
                <p className="mt-1 text-sm text-stone-700">{r.address_line}</p>
                {r.reference ? (
                  <p className="mt-1 text-sm text-stone-500">
                    Ref: {r.reference}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(r.id)}
                className={defaultBtnGhost}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-600">
          Todavía no guardaste ninguna dirección.
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-stone-200/90 bg-[var(--store-chrome-bg)] p-5 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-stone-900">
          Agregar dirección
        </h2>
        <div className="mt-4">
          <AddressFields
            form={form}
            setForm={setForm}
            inputClass={defaultInputClass}
            labelClass={defaultLabelClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !customerId}
          className={`${defaultBtnPrimary} mt-6`}
        >
          {saving ? "Guardando…" : "Guardar dirección"}
        </button>
      </form>
    </div>
  );
}
