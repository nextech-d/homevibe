import { NextResponse } from "next/server";
import { loginUser } from "../../../lib/users.server";
import { getPrisma } from "../../../lib/db";
import { checkRateLimits, clientIp, customerLoginRules } from "../../../../shared/rate-limit";
import { AUTH_RATE_LIMITED_MESSAGE, LOGIN_FAILED_MESSAGE } from "../../../../shared/customer-auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required." },
      { status: 400 }
    );
  }

  // 10 per IP per 15 minutes, before any password is checked.
  const prisma = getPrisma();
  const limit = prisma
    ? await checkRateLimits(
        prisma,
        customerLoginRules(clientIp((name) => request.headers.get(name))),
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
          { success: false, message: "Sign-in is temporarily unavailable. Please try again shortly." },
          { status: 503 }
        );
  }

  try {
    const user = await loginUser(body.email, body.password);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    // One answer for every failure; anything unexpected is logged, not shown.
    if (!(error instanceof Error && error.message === LOGIN_FAILED_MESSAGE)) {
      console.error("Login failed unexpectedly:", error);
    }
    return NextResponse.json({ success: false, message: LOGIN_FAILED_MESSAGE }, { status: 401 });
  }
}
