import { MAX_PRODUCT_IMAGES_PER_GROUP } from "@/lib/product-images";

export { MAX_PRODUCT_IMAGES_PER_GROUP };

/** Límite alineado con el mensaje de UI y con `serverActions.bodySizeLimit` en next.config. */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export function assertProductImageSize(file: File | null | undefined): string | null {
  if (!file || file.size <= 0) return null;
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return `La imagen supera ${MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)} MB. Elige un archivo más liviano (JPG, PNG o WebP).`;
  }
  return null;
}

function checkFileInputs(inputs: HTMLInputElement[]): boolean {
  for (const el of inputs) {
    const files = el.files;
    if (!files?.length) continue;
    for (let i = 0; i < files.length; i++) {
      const msg = assertProductImageSize(files[i]);
      if (msg) {
        alert(msg);
        return true;
      }
    }
  }
  return false;
}

/** Evita enviar el Server Action si algún archivo supera el límite. */
export function blockSubmitIfImageTooLarge(form: HTMLFormElement): boolean {
  const candidates: HTMLInputElement[] = [];
  const main = form.elements.namedItem("image");
  if (main instanceof HTMLInputElement && main.type === "file") {
    candidates.push(main);
  }
  form
    .querySelectorAll<HTMLInputElement>('input[type="file"][name^="fragrance_option_image_"]')
    .forEach((el) => candidates.push(el));
  return checkFileInputs(candidates);
}
