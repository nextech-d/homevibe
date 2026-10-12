import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateStorefront } from "../../lib/revalidate-storefront.server";
import { clientErrorMessage } from "../../../shared/client-errors";

/**
 * Constant-time: both sides hashed to 32 bytes first, so neither the
 * secret's length nor how much of a guess matched shows in response times.
 */
function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(given), digest(expected));
}

export async function POST(request: Request) {
  // Header only. The ?secret= form is gone: a secret in a URL ends up in
  // request logs. The API's publish call has always sent the header.
  const secret = request.headers.get("x-revalidate-secret");

  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected || !secretMatches(secret, expected)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    revalidateStorefront();

    return NextResponse.json({
      success: true,
      revalidated: true,
      message: "Storefront cache cleared.",
    });
  } catch (error) {
    const message = clientErrorMessage(error, "Revalidation failed.");
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
