import { NewInvoiceForm, NewInvoiceHeader } from "@/components/admin/NewInvoiceForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminNuevaFacturaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const initialError = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <NewInvoiceHeader />
      <NewInvoiceForm initialError={initialError} />
    </div>
  );
}
