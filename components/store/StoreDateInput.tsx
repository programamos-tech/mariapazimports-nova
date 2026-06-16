"use client";

import { DatePickerField } from "@/components/date-picker/DatePickerField";

export const storeDateInputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-[0_1px_0_0_rgb(24_24_27/0.04)] focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400/25";

type Props = {
  id?: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  initialView?: "days" | "months" | "years";
  hideToday?: boolean;
};

export function StoreDateInput({
  className = storeDateInputClass,
  initialView = "years",
  hideToday = true,
  ...props
}: Props) {
  return (
    <DatePickerField
      {...props}
      variant="store"
      initialView={initialView}
      hideToday={hideToday}
      buttonClassName={className}
    />
  );
}
