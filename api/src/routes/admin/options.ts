import { Hono, type Context } from "hono";
import {
  createOptionType,
  createOptionValue,
  deleteOptionType,
  deleteOptionValue,
  listOptionTypes,
  renameOptionType,
  renameOptionValue,
  reorderOptionTypes,
  reorderOptionValues,
  type OptionResult,
} from "../../lib/options.js";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseIds(value: unknown): number[] | null {
  if (!Array.isArray(value) || !value.every((id) => Number.isInteger(id) && id > 0)) return null;
  return value as number[];
}

function respond<T>(c: Context, result: OptionResult<T>) {
  if (result.ok) return c.json({ success: true, ...(result.data ?? {}) });
  return c.json({ success: false, message: result.message }, result.status);
}

export const adminOptionsRoute = new Hono();

adminOptionsRoute.get("/", async (c) => {
  const types = await listOptionTypes();
  return c.json({ success: true, types });
});

adminOptionsRoute.post("/", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  if (typeof body.name !== "string") return c.json({ success: false, message: "Name is required." }, 400);
  return respond(c, await createOptionType(body.name));
});

adminOptionsRoute.put("/order", async (c) => {
  const ids = parseIds(((await c.req.json()) as Record<string, unknown>).ids);
  if (!ids) return c.json({ success: false, message: "Invalid order." }, 400);
  await reorderOptionTypes(ids);
  return c.json({ success: true });
});

adminOptionsRoute.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = (await c.req.json()) as Record<string, unknown>;
  if (!id || typeof body.name !== "string") return c.json({ success: false, message: "Invalid request." }, 400);
  return respond(c, await renameOptionType(id, body.name));
});

// ?force=1 deletes a type products use; without it the reply says how many.
adminOptionsRoute.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return c.json({ success: false, message: "Invalid option type id." }, 400);
  return respond(c, await deleteOptionType(id, c.req.query("force") === "1"));
});

adminOptionsRoute.post("/:id/values", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = (await c.req.json()) as Record<string, unknown>;
  if (!id || typeof body.value !== "string") return c.json({ success: false, message: "Invalid request." }, 400);
  return respond(c, await createOptionValue(id, body.value));
});

adminOptionsRoute.put("/:id/values/order", async (c) => {
  const id = parseId(c.req.param("id"));
  const ids = parseIds(((await c.req.json()) as Record<string, unknown>).ids);
  if (!id || !ids) return c.json({ success: false, message: "Invalid order." }, 400);
  await reorderOptionValues(id, ids);
  return c.json({ success: true });
});

adminOptionsRoute.patch("/values/:valueId", async (c) => {
  const id = parseId(c.req.param("valueId"));
  const body = (await c.req.json()) as Record<string, unknown>;
  if (!id || typeof body.value !== "string") return c.json({ success: false, message: "Invalid request." }, 400);
  return respond(c, await renameOptionValue(id, body.value));
});

adminOptionsRoute.delete("/values/:valueId", async (c) => {
  const id = parseId(c.req.param("valueId"));
  if (!id) return c.json({ success: false, message: "Invalid value id." }, 400);
  return respond(c, await deleteOptionValue(id, c.req.query("force") === "1"));
});
