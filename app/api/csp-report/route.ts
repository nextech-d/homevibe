import { clientIp } from "../../../shared/rate-limit";
import { MAX_REPORT_BYTES, createReportLimiter, parseCspReports } from "../../lib/csp-report";

/**
 * Where browsers send Content-Security-Policy violation reports (report-uri
 * and report-to in next.config.ts). Each one becomes a "[csp-violation]"
 * line in the server log, so a real visitor hitting a block shows up in
 * Vercel's logs.
 *
 * Not behind rejectCrossSiteWrite: browsers send reports with their own
 * content types and often without an Origin. The cap in csp-report.ts is
 * what keeps it from flooding the logs. It always answers 204, so a sender
 * learns nothing about what was logged.
 */

const limiter = createReportLimiter();
const REPORT_TYPES = /^application\/(csp-report|reports\+json|json)\s*(;|$)/i;
const noContent = () => new Response(null, { status: 204 });

/** The body as text, or null past MAX_REPORT_BYTES - read that far and no further. */
async function readCapped(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_REPORT_BYTES) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REPORT_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  if (!REPORT_TYPES.test(request.headers.get("content-type") ?? "")) {
    return new Response(null, { status: 415 });
  }
  const body = await readCapped(request);
  if (body === null) return new Response(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return noContent();
  }

  const ip = clientIp((name) => request.headers.get(name));
  for (const violation of parseCspReports(payload)) {
    const { allowed, suppressedLastWindow } = limiter.take(ip);
    if (suppressedLastWindow) {
      console.warn(`[csp-violation] ${suppressedLastWindow} more report(s) not logged in the last minute`);
    }
    if (!allowed) break;
    console.warn("[csp-violation]", JSON.stringify(violation));
  }
  return noContent();
}
