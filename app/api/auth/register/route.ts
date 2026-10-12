import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { registerUser } from "../../../lib/users.server";
import { getPrisma } from "../../../lib/db";
import { checkRateLimits, clientIp, customerRegisterRules } from "../../../../shared/rate-limit";
import { AUTH_RATE_LIMITED_MESSAGE, REGISTER_FAILED_MESSAGE } from "../../../../shared/customer-auth";

/** The email as a rate-limit key: hashed, so addresses never sit in rate_limits. */
function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/** Messages the code itself writes for the customer to read; anything else is hidden. */
const CUSTOMER_MESSAGES = new Set([REGISTER_FAILED_MESSAGE, "Password must be at least 8 characters."]);

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json(
      { success: false, message: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  // 5 per IP and 3 per email per hour.
  const prisma = getPrisma();
  const limit = prisma
    ? await checkRateLimits(
        prisma,
        customerRegisterRules(clientIp((name) => request.headers.get(name)), emailKey(body.email)),
        "closed"
      )
    : ({ allowed: false, reason: "error" } as const);
  if (!limit.allowed) {
    return limit.reason === "limited"
      ? NextResponse.json(
          { success: false, message: AUTH_RATE_LIMITED_MESSAGE },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
        )
      : NextResponse.json(
          { success: false, message: "Registration is temporarily unavailable. Please try again shortly." },
          { status: 503 }
        );
  }

  try {
    const user = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    // A taken email is a 400 like any other refusal - never 409, which said
    // "this email has an account" by its status alone.
    const message = error instanceof Error && CUSTOMER_MESSAGES.has(error.message) ? error.message : null;
    if (!message) console.error("Registration failed unexpectedly:", error);
    return NextResponse.json(
      { success: false, message: message ?? "We couldn't create your account. Please try again." },
      { status: 400 }
    );
  }
}
