import { updateStoreCustomerProfileAction } from "@/app/actions/store-customer-profile";
import { storeAuthFormErrorClass } from "@/components/store/store-auth-form-primitives";
import {
  storeBtnPrimaryClass,
  storeFieldInputClass,
  storeFieldLabelClass,
} from "@/components/store/store-ui-primitives";

export function StoreAccountProfileEditor({
  initialName,
  email,
  initialPhone,
  initialCity,
  flash,
}: {
  initialName: string;
  email: string;
  initialPhone: string;
  initialCity: string;
  flash?: string;
}) {
  const flashMessage =
    flash === "ok"
      ? "Datos guardados correctamente."
      : flash === "name"
        ? "Ingresá tu nombre."
        : flash === "forbidden"
          ? "Esta acción no está disponible para tu tipo de usuario."
          : flash === "db"
            ? "No pudimos guardar. Intentá de nuevo."
            : null;

  return (
    <form action={updateStoreCustomerProfileAction} className="space-y-5">
      {flashMessage ? (
        <p
          role="status"
          className={
            flash === "ok"
              ? "rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-900"
              : storeAuthFormErrorClass
          }
        >
          {flashMessage}
        </p>
      ) : null}

      <label className="block">
        <span className={storeFieldLabelClass}>Nombre</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          defaultValue={initialName}
          className={storeFieldInputClass}
        />
      </label>

      <div className="block">
        <span className={storeFieldLabelClass}>Email</span>
        <p className="mt-1 border border-stone-100 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-600">
          {email}
        </p>
        <p className="mt-1.5 text-xs text-stone-500">
          El correo de acceso no se puede cambiar desde aquí.
        </p>
      </div>

      <label className="block">
        <span className={storeFieldLabelClass}>Teléfono</span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="Ej. 300 123 4567"
          defaultValue={initialPhone}
          className={storeFieldInputClass}
        />
      </label>

      <label className="block">
        <span className={storeFieldLabelClass}>Ciudad</span>
        <input
          name="shipping_city"
          type="text"
          autoComplete="address-level2"
          placeholder="Ej. Medellín"
          defaultValue={initialCity}
          className={storeFieldInputClass}
        />
      </label>

      <button type="submit" className={`${storeBtnPrimaryClass} w-full sm:w-auto`}>
        Guardar datos
      </button>
    </form>
  );
}
