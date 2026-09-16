import "server-only";

import { getApiBaseUrl } from "./api-client";
import type { OrderPayload } from "./orders.server";

/**
 * Upstream fetch budget (shop → API only).
 * Kept under Vercel's common ~10s serverless default so ORDER_PROXY_TIMEOUT fires
 * before the platform hard-kills the route. maxDuration on the route can be higher
 * when the plan allows it; this timeout stays conservative.
 */
const ORDER_FORWARD_TIMEOUT_MS = 9_000;

export type OrderProxyFailureCode =
  | "ORDER_PROXY_NOT_CONFIGURED"
  | "ORDER_PROXY_TIMEOUT"
  | "ORDER_PROXY_UNAVAILABLE"
  | "ORDER_PROXY_BAD_RESPONSE";

type ForwardBody = Pick<
  OrderPayload,
  "name" | "email" | "phone" | "address" | "city" | "items" | "saveAddress"
>;

/**
 * Forwards checkout to the standalone API. Session is attached server-side via Bearer.
 * Proxy failures set proxyError: true and a distinct code; API rejections forward the API body.
 */
export async function forwardOrderCreate(
  payload: ForwardBody,
  sessionToken?: string | null
): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    return Response.json(
      {
        success: false,
        code: "ORDER_PROXY_NOT_CONFIGURED" satisfies OrderProxyFailureCode,
        proxyError: true,
        message: "Order service is not configured. Please try again later or contact us.",
      },
      { status: 503 }
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionToken?.trim()) {
    headers.Authorization = `Bearer ${sessionToken.trim()}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...payload, total: 0 }),
      signal: AbortSignal.timeout(ORDER_FORWARD_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    const code: OrderProxyFailureCode = timedOut
      ? "ORDER_PROXY_TIMEOUT"
      : "ORDER_PROXY_UNAVAILABLE";
    const message = timedOut
      ? "The order service took too long to respond. Your order may not have been placed — check your email or contact us before submitting again."
      : "Unable to reach the order service. Please try again in a moment.";

    console.error("Order proxy forward failed:", code, error);

    return Response.json(
      { success: false, code, proxyError: true, message },
      { status: timedOut ? 504 : 503 }
    );
  }

  const raw = await upstream.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error("Order proxy bad JSON from API:", upstream.status, raw.slice(0, 200));
    return Response.json(
      {
        success: false,
        code: "ORDER_PROXY_BAD_RESPONSE" satisfies OrderProxyFailureCode,
        proxyError: true,
        message:
          "Received an invalid response from the order service. Your order may not have been placed — contact us before submitting again.",
      },
      { status: 502 }
    );
  }

  const apiSuccess = upstream.ok && data.success === true;
  if (!apiSuccess) {
    return Response.json(
      {
        ...data,
        success: false,
        proxyError: false,
        message:
          typeof data.message === "string"
            ? data.message
            : "Unable to place your order. Please try again.",
      },
      { status: upstream.status >= 400 ? upstream.status : 400 }
    );
  }

  return Response.json(data, { status: 200 });
}
