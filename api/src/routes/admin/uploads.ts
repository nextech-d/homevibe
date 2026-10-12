import { Hono } from "hono";
import {
  saveBrandLogo,
  saveProductImage,
  validateProductImageFile,
} from "../../lib/uploads.js";
import { clientErrorMessage } from "../../../../shared/client-errors.js";

export const adminUploadsRoute = new Hono();

async function handleUpload(file: unknown, save: (file: File) => Promise<string>) {
  if (!(file instanceof File)) {
    return { status: 400 as const, body: { success: false, message: "No image file provided." } };
  }

  const validation = validateProductImageFile(file);
  if (!validation.ok) {
    return { status: 400 as const, body: { success: false, message: validation.message } };
  }

  const url = await save(file);
  return { status: 200 as const, body: { success: true, url } };
}

adminUploadsRoute.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const result = await handleUpload(body.file, saveProductImage);
    return c.json(result.body, result.status);
  } catch (error) {
    const message = clientErrorMessage(error, "Upload failed.");
    return c.json({ success: false, message }, 500);
  }
});

adminUploadsRoute.post("/brand", async (c) => {
  try {
    const body = await c.req.parseBody();
    const result = await handleUpload(body.file, saveBrandLogo);
    return c.json(result.body, result.status);
  } catch (error) {
    const message = clientErrorMessage(error, "Upload failed.");
    return c.json({ success: false, message }, 500);
  }
});
