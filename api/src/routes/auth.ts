import { Hono } from "hono";
import { verifyAdminToken } from "../lib/admin-jwt.js";
import { attemptAdminLogin } from "../lib/admin-login.js";
import { clientIp } from "../lib/shared/rate-limit.js";
import {
  deleteSession,
  extractBearerToken,
  getUserBySessionId,
} from "../lib/session.js";
import {
  createSavedAddress,
  deleteSavedAddress,
  listOrdersForUser,
  listUserAddresses,
  loginUser,
  registerUser,
} from "../lib/users.js";

export const authRoute = new Hono();

authRoute.post("/admin/login", async (c) => {
  let password: unknown;
  try {
    password = ((await c.req.json()) as { password?: unknown }).password;
  } catch {
    return c.json({ success: false, message: "Invalid JSON." }, 400);
  }

  const outcome = await attemptAdminLogin(password, clientIp((name) => c.req.header(name)));
  if (outcome.retryAfterSeconds) c.header("Retry-After", String(outcome.retryAfterSeconds));
  return c.json(outcome.body, outcome.status);
});

authRoute.get("/admin/me", async (c) => {
  const token = extractBearerToken(c.req.header("Authorization"));
  const valid = await verifyAdminToken(token ?? undefined);
  if (!valid) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }
  return c.json({ success: true });
});

authRoute.post("/register", async (c) => {
  try {
    const body = (await c.req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    };

    if (!body.email || !body.password || !body.name) {
      return c.json({ success: false, message: "Name, email, and password are required." }, 400);
    }

    const { user, sessionToken } = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
    });

    return c.json({ success: true, user, sessionToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already exists") ? 409 : 400;
    return c.json({ success: false, message }, status);
  }
});

authRoute.post("/login", async (c) => {
  try {
    const body = (await c.req.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return c.json({ success: false, message: "Email and password are required." }, 400);
    }

    const { user, sessionToken } = await loginUser(body.email, body.password);
    return c.json({ success: true, user, sessionToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return c.json({ success: false, message }, 401);
  }
});

authRoute.post("/logout", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  return c.json({ success: true });
});

authRoute.get("/me", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  const user = await getUserBySessionId(sessionToken ?? undefined);
  if (!user) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }
  return c.json({ success: true, user });
});

export const accountRoute = new Hono();

accountRoute.get("/orders", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  const user = await getUserBySessionId(sessionToken ?? undefined);
  if (!user) return c.json({ success: false, message: "Unauthorized." }, 401);

  const orders = await listOrdersForUser(user.id);
  return c.json({ success: true, orders });
});

accountRoute.get("/addresses", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  const user = await getUserBySessionId(sessionToken ?? undefined);
  if (!user) return c.json({ success: false, message: "Unauthorized." }, 401);

  const addresses = await listUserAddresses(user.id);
  return c.json({ success: true, addresses });
});

accountRoute.post("/addresses", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  const user = await getUserBySessionId(sessionToken ?? undefined);
  if (!user) return c.json({ success: false, message: "Unauthorized." }, 401);

  const body = (await c.req.json()) as {
    label?: string;
    addressLine?: string;
    city?: string;
    isDefault?: boolean;
  };

  if (!body.addressLine?.trim() || !body.city?.trim()) {
    return c.json({ success: false, message: "Address and city are required." }, 400);
  }

  const address = await createSavedAddress(user.id, {
    label: body.label ?? "Home",
    addressLine: body.addressLine,
    city: body.city,
    isDefault: body.isDefault,
  });

  return c.json({ success: true, address });
});

accountRoute.delete("/addresses", async (c) => {
  const sessionToken = extractBearerToken(c.req.header("Authorization"));
  const user = await getUserBySessionId(sessionToken ?? undefined);
  if (!user) return c.json({ success: false, message: "Unauthorized." }, 401);

  const id = Number(c.req.query("id"));
  if (!id) return c.json({ success: false, message: "Address id required." }, 400);

  const deleted = await deleteSavedAddress(user.id, id);
  if (!deleted) return c.json({ success: false, message: "Address not found." }, 404);

  return c.json({ success: true });
});
