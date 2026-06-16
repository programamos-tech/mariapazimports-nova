"use client";

import { useState } from "react";
import { updateStoreCustomerBirthDateAction } from "@/app/actions/store-customer-birthday";
import {
  StoreDateInput,
  storeDateInputClass,
} from "@/components/store/StoreDateInput";

export function StoreBirthDateForm({
  defaultValue = "",
  next,
  submitLabel = "Guardar fecha",
  inputClassName = storeDateInputClass,
  submitClassName = "inline-flex shrink-0 items-center justify-center border border-stone-900 bg-stone-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-stone-800",
}: {
  defaultValue?: string;
  next: string;
  submitLabel?: string;
  inputClassName?: string;
  submitClassName?: string;
}) {
  const [birthDate, setBirthDate] = useState(defaultValue);
  const maxDate = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={updateStoreCustomerBirthDateAction}
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="next" value={next} readOnly />
      <div className="min-w-0">
        <label htmlFor="cuenta-birth-date" className="sr-only">
          Fecha de cumpleaños
        </label>
        <StoreDateInput
          id="cuenta-birth-date"
          name="birth_date"
          value={birthDate}
          onChange={setBirthDate}
          required
          minDate="1900-01-01"
          maxDate={maxDate}
          className={`${inputClassName} max-w-[12rem]`}
        />
      </div>
      <button type="submit" className={submitClassName}>
        {submitLabel}
      </button>
    </form>
  );
}
