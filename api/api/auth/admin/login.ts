import { assertAdminJwtSecret } from "../../../src/lib/admin-jwt.js";
import { attemptAdminLogin } from "../../../src/lib/admin-login.js";
import { clientIp } from "../../../../shared/rate-limit.js";

export const runtime = "nodejs";

assertAdminJwtSecret();

function corsHeaders(req: Request): Headers {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    origin === "https://admin.homevibe.co.ke" ||
    origin === "https://homevibe.co.ke" ||
    origin === "http://localhost:5173" ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
  const headers = new Headers();
  if (allowed) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Vary", "Origin");
  return headers;
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json");

  let password: unknown;
  try {
    password = ((await req.json()) as { password?: unknown }).password;
  } catch {
    return Response.json({ success: false, message: "Invalid JSON." }, { status: 400, headers });
  }

  const outcome = await attemptAdminLogin(password, clientIp((name) => req.headers.get(name)));
  if (outcome.retryAfterSeconds) headers.set("Retry-After", String(outcome.retryAfterSeconds));
  return Response.json(outcome.body, { status: outcome.status, headers });
}
