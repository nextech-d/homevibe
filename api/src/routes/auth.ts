import { Hono, type Context } from "hono";
import { verifyAdminToken } from "../lib/admin-jwt.js";
import { attemptAdminLogin } from "../lib/admin-login.js";
import { createHash } from "node:crypto";
import {
  checkRateLimits,
  clientIp,
  customerLoginRules,
  customerRegisterRules,
  type RateLimitRule,
} from "../../../shared/rate-limit.js";
import {
  AUTH_RATE_LIMITED_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  REGISTER_FAILED_MESSAGE,
} from "../../../shared/customer-auth.js";
import { getPrisma } from "../lib/db.js";
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

/** The email as a rate-limit key: hashed, so addresses never sit in rate_limits. */
function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/** Counts the request; null to carry on, or the response that refuses it. */
async function customerAuthLimit(c: Context, rules: RateLimitRule[]): Promise<Response | null> {
  const prisma = getPrisma();
  const limit = prisma
    ? await checkRateLimits(prisma, rules, "closed")
    : ({ allowed: false, reason: "error" } as const);
  if (limit.allowed) return null;
  if (limit.reason === "limited") {
    c.header("Retry-After", String(limit.retryAfterSeconds));
    return c.json({ success: false, message: AUTH_RATE_LIMITED_MESSAGE }, 429);
  }
  return c.json({ success: false, message: "Temporarily unavailable. Please try again shortly." }, 503);
}

/** Messages the code itself writes for the customer to read; anything else is hidden. */
const REGISTER_MESSAGES = new Set([REGISTER_FAILED_MESSAGE, "Password must be at least 8 characters."]);

authRoute.post("/register", async (c) => {
  let body: { email?: string; password?: string; name?: string; phone?: string };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ success: false, message: "Invalid request." }, 400);
  }
  if (!body.email || !body.password || !body.name) {
    return c.json({ success: false, message: "Name, email, and password are required." }, 400);
  }

  const refused = await customerAuthLimit(
    c,
    customerRegisterRules(clientIp((name) => c.req.header(name)), emailKey(body.email))
  );
  if (refused) return refused;

  try {
    const { user, sessionToken } = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
    });
    return c.json({ success: true, user, sessionToken });
  } catch (error) {
    // A taken email is a 400 like any other refusal, never a 409.
    const message = error instanceof Error && REGISTER_MESSAGES.has(error.message) ? error.message : null;
    if (!message) console.error("Registration failed unexpectedly:", error);
    return c.json(
      { success: false, message: message ?? "We couldn't create your account. Please try again." },
      400
    );
  }
});

authRoute.post("/login", async (c) => {
  let body: { email?: string; password?: string };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ success: false, message: "Invalid request." }, 400);
  }
  if (!body.email || !body.password) {
    return c.json({ success: false, message: "Email and password are required." }, 400);
  }

  const refused = await customerAuthLimit(
    c,
    customerLoginRules(clientIp((name) => c.req.header(name)))
  );
  if (refused) return refused;

  try {
    const { user, sessionToken } = await loginUser(body.email, body.password);
    return c.json({ success: true, user, sessionToken });
  } catch (error) {
    if (!(error instanceof Error && error.message === LOGIN_FAILED_MESSAGE)) {
      console.error("Login failed unexpectedly:", error);
    }
    return c.json({ success: false, message: LOGIN_FAILED_MESSAGE }, 401);
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
