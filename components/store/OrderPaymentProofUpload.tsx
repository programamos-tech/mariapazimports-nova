"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { TransferBankDetails } from "@/components/store/TransferBankDetails";
import { preparePaymentProofFile } from "@/lib/prepare-payment-proof-file";

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".png") ||
    n.endsWith(".webp") ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function OrderPaymentProofUpload({
  orderId,
  token,
  disabled = false,
  buttonLabel = "Subir comprobante",
  buttonClassName,
  orderRef,
  amountCents,
  showBankDetails = true,
}: {
  orderId: string;
  token: string;
  disabled?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
  orderRef?: string;
  amountCents?: number;
  showBankDetails?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "pdf" | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearPreview = useEffectEvent(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewKind(null);
    setFileName(null);
    setSelectedFile(null);
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      clearPreview();
      setError(null);
    }
  }, [open, clearPreview]);

  function onFileChange(file: File | null) {
    clearPreview();
    setError(null);
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    if (isImageFile(file)) {
      setPreviewKind("image");
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }
    if (isPdfFile(file)) {
      setPreviewKind("pdf");
    }
  }

  function close() {
    if (pending) return;
    setOpen(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile || pending) return;
    setError(null);

    startTransition(async () => {
      try {
        const fileToSend = await preparePaymentProofFile(selectedFile);
        if (fileToSend.size > 8 * 1024 * 1024) {
          setError(
            "El archivo supera 8 MB. Prueba con otra foto o un PDF más liviano.",
          );
          return;
        }

        const prepareRes = await fetch("/api/store/payment-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: "prepare",
            order_id: orderId,
            token,
            file_name: fileToSend.name,
            mime_type: fileToSend.type || "application/octet-stream",
            size: fileToSend.size,
          }),
        });
        const prepareData = (await prepareRes.json().catch(() => null)) as {
          ok?: boolean;
          message?: string;
          upload?: {
            storageKey: string;
            signedUrl: string;
            contentType: string;
            fileName: string;
          };
        } | null;

        if (!prepareRes.ok || !prepareData?.ok || !prepareData.upload) {
          setError(
            prepareData?.message ??
              "No se pudo preparar la subida. Intenta de nuevo.",
          );
          return;
        }

        const { storageKey, signedUrl, contentType, fileName } =
          prepareData.upload;

        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
          },
          body: fileToSend,
        });

        if (!putRes.ok) {
          console.error("[payment-proof] put", putRes.status);
          setError("No se pudo subir el archivo. Intenta de nuevo.");
          return;
        }

        const confirmRes = await fetch("/api/store/payment-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: "confirm",
            order_id: orderId,
            token,
            storage_key: storageKey,
            file_name: fileName,
            content_type: contentType,
          }),
        });
        const confirmData = (await confirmRes.json().catch(() => null)) as {
          ok?: boolean;
          message?: string;
        } | null;

        if (!confirmRes.ok || !confirmData?.ok) {
          setError(
            confirmData?.message ??
              "No se pudo registrar el comprobante. Intenta de nuevo.",
          );
          return;
        }

        setOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        url.searchParams.set("uploaded", "1");
        router.replace(url.pathname + url.search);
        router.refresh();
      } catch {
        setError("No se pudo subir el comprobante. Revisa tu conexión.");
      }
    });
  }

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <button
              type="button"
              className="absolute inset-0 bg-stone-900/55 backdrop-blur-md"
              aria-label="Cerrar"
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="proof-upload-title"
              className="relative z-10 max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Pago por transferencia
              </p>
              <h2
                id="proof-upload-title"
                className="mt-1.5 text-base font-semibold uppercase tracking-[0.06em] text-stone-900 sm:text-lg"
              >
                {showBankDetails
                  ? "Transfiere y sube el comprobante"
                  : "Subir comprobante"}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {showBankDetails
                  ? "Copia los datos, transfiere el monto exacto y adjunta el comprobante."
                  : "Adjunta la foto o PDF del comprobante."}
              </p>

              {showBankDetails ? (
                <div className="mt-4">
                  <TransferBankDetails
                    orderRef={orderRef}
                    amountCents={amountCents}
                    compact
                  />
                </div>
              ) : null}

              <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900">
                    Comprobante
                  </span>
                  <input
                    type="file"
                    name="file"
                    required
                    disabled={pending}
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf"
                    onChange={(e) =>
                      onFileChange(e.target.files?.[0] ?? null)
                    }
                    className="mt-2 block w-full border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700 file:mr-3 file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-white disabled:opacity-50"
                  />
                </label>

                {previewKind === "image" && previewUrl ? (
                  <div className="overflow-hidden border border-stone-200 bg-stone-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob preview local */}
                    <img
                      src={previewUrl}
                      alt="Vista previa del comprobante"
                      className="mx-auto max-h-48 w-full object-contain object-center"
                    />
                    {fileName ? (
                      <p className="border-t border-stone-200 px-3 py-2 text-xs text-stone-500">
                        {fileName}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {previewKind === "pdf" ? (
                  <div className="flex items-center gap-3 border border-stone-200 bg-stone-50 px-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center bg-stone-900 text-[10px] font-bold uppercase tracking-wide text-white">
                      PDF
                    </span>
                    <p className="min-w-0 truncate text-sm text-stone-700">
                      {fileName ?? "Documento PDF"}
                    </p>
                  </div>
                ) : null}

                <p className="text-xs text-stone-500">
                  JPG, PNG, WebP, HEIC o PDF · máximo 8 MB
                </p>

                {error ? (
                  <p
                    className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={close}
                    className="border border-stone-300 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-800 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending || !selectedFile}
                    className="bg-stone-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-stone-800 disabled:opacity-50"
                  >
                    {pending ? "Subiendo…" : "Enviar comprobante"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "w-full bg-stone-900 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {buttonLabel}
      </button>
      {modal}
    </>
  );
}
