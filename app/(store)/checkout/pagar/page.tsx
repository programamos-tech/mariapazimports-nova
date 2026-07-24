import { CheckoutWompiPayClient } from "@/components/store/CheckoutWompiPayClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutWompiPayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = typeof sp.order_id === "string" ? sp.order_id : "";
  const reference = typeof sp.reference === "string" ? sp.reference : "";

  if (!orderId || !reference) {
    redirect("/checkout?error=empty");
  }

  return <CheckoutWompiPayClient orderId={orderId} reference={reference} />;
}
