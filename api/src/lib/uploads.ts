import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

export const PRODUCT_IMAGE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const PRODUCT_IMAGE_EXTENSIONS: Record<(typeof PRODUCT_IMAGE_ACCEPT)[number], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const PRODUCT_IMAGE_RECOMMENDED = {
  dimensions: "1500 × 1500 px (square)",
  minDimensions: "800 × 800 px minimum",
  maxFileSize: "5 MB per image",
  formats: "JPEG, PNG, WebP, GIF, or AVIF",
} as const;

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const productUploadsDir = join(apiRoot, "../public/uploads/products");
const brandUploadsDir = join(apiRoot, "../public/uploads/brands");

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateProductImageFile(
  file: { type: string; size: number; name?: string }
): ImageValidationResult {
  if (!PRODUCT_IMAGE_ACCEPT.includes(file.type as (typeof PRODUCT_IMAGE_ACCEPT)[number])) {
    return {
      ok: false,
      message: `Unsupported format. Use ${PRODUCT_IMAGE_RECOMMENDED.formats}.`,
    };
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: `File too large (${formatBytes(file.size)}). Max ${PRODUCT_IMAGE_RECOMMENDED.maxFileSize}.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, message: "File is empty." };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidProductImageRef(value: string): boolean {
  return isValidUploadedImageRef(value, "/uploads/products/");
}

export function isValidBrandLogoRef(value: string): boolean {
  return isValidUploadedImageRef(value, "/uploads/brands/");
}

/**
 * The Blob store hosts an uploaded image may live on, matched exactly.
 *
 * The store this API uploads to: @vercel/blob builds public URLs as
 * https://<storeId>.public.blob.vercel-storage.com, with the store id taken
 * from BLOB_READ_WRITE_TOKEN (vercel_blob_rw_<storeId>_...). Plus the host
 * every existing product image is on, so a product saved before this check
 * existed can always be saved again.
 */
function blobStoreHosts(): Set<string> {
  const hosts = new Set(["ph5lkxw4quqqiyhv.public.blob.vercel-storage.com"]);
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.trim().split("_")[3];
  if (storeId) hosts.add(`${storeId.toLowerCase()}.public.blob.vercel-storage.com`);
  return hosts;
}

/**
 * An image reference saved with a product or brand: a local upload path, or
 * an https URL on this project's Blob store. The URL is parsed and its
 * hostname compared exactly - it used to be a substring test, which let
 * https://evil.example/x.blob.vercel-storage.com.png through.
 */
function isValidUploadedImageRef(value: string, localPrefix: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith(localPrefix)) return true;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    !url.port &&
    blobStoreHosts().has(url.hostname)
  );
}

export function validateProductImageRefs(
  primaryPhotoId: string,
  galleryPhotoIds: string[],
  options?: { requirePrimary?: boolean }
): string | null {
  const requirePrimary = options?.requirePrimary ?? true;
  const primary = primaryPhotoId.trim();

  if (!primary) {
    if (requirePrimary) {
      return "Main image must be uploaded before publishing.";
    }
  } else if (!isValidProductImageRef(primary)) {
    return "Main image must be uploaded using the image field.";
  }

  for (const id of galleryPhotoIds) {
    if (!isValidProductImageRef(id)) {
      return "All secondary images must be uploaded files.";
    }
  }
  return null;
}

export async function saveProductImage(file: File): Promise<string> {
  return saveUploadedImage(file, "products", productUploadsDir, "/uploads/products/");
}

export async function saveBrandLogo(file: File): Promise<string> {
  return saveUploadedImage(file, "brands", brandUploadsDir, "/uploads/brands/");
}

async function saveUploadedImage(
  file: File,
  blobFolder: string,
  localDir: string,
  localPrefix: string
): Promise<string> {
  const validation = validateProductImageFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const ext =
    PRODUCT_IMAGE_EXTENSIONS[file.type as (typeof PRODUCT_IMAGE_ACCEPT)[number]] ?? ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (shouldUseBlobStorage()) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const blob = await put(`${blobFolder}/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      ...(token ? { token } : {}),
    });
    return blob.url;
  }

  try {
    await mkdir(localDir, { recursive: true });
    await writeFile(join(localDir, filename), buffer);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "EROFS" || process.env.VERCEL) {
      throw new Error(
        "Image storage is not connected on the live API yet. Retry in a minute, or save the product as a draft without a photo."
      );
    }
    throw error;
  }

  return `${localPrefix}${filename}`;
}

function shouldUseBlobStorage(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim() ||
      process.env.VERCEL
  );
}
