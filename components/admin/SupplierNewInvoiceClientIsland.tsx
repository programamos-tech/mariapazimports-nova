"use client";

import {
  SupplierNewInvoiceForm,
  SupplierNewInvoiceHeader,
} from "@/components/admin/SupplierNewInvoiceForm";
import type { SupplierOption } from "@/components/admin/SupplierNewInvoiceForm";

export type SupplierNewInvoiceIslandProps = {
  issueDateDefault: string;
  suppliers: SupplierOption[];
  fixedSupplierId?: string | null;
  fixedSupplierName?: string | null;
};

/** Header + formulario; cargar con `next/dynamic` y `{ ssr: false }` desde la página para evitar cuelgues de hidratación. */
export function SupplierNewInvoiceIsland({
  issueDateDefault,
  suppliers,
  fixedSupplierId = null,
  fixedSupplierName = null,
}: SupplierNewInvoiceIslandProps) {
  return (
    <>
      <SupplierNewInvoiceHeader fixedSupplierId={fixedSupplierId} supplierName={fixedSupplierName} />
      <SupplierNewInvoiceForm
        issueDateDefault={issueDateDefault}
        suppliers={suppliers}
        fixedSupplierId={fixedSupplierId}
        fixedSupplierName={fixedSupplierName}
      />
    </>
  );
}
