/** Comprime imágenes grandes para no chocar con el límite ~4.5 MB de Vercel. */
export async function preparePaymentProofFile(file: File): Promise<File> {
  if (file.size <= 0) return file;

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) return file;

  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!isImage) return file;

  // HEIC/HEIF: el canvas del navegador a menudo no decodifica; subir original.
  if (
    /heic|heif/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    return file;
  }

  // Ya es pequeño: no tocar.
  if (file.size <= 1.8 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1920;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });
    if (!blob || blob.size <= 0) return file;

    const base =
      file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "_") ||
      "comprobante";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
