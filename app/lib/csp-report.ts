/**
 * CSP violation reports: parsing and the log cap, for /api/csp-report.
 *
 * Browsers send reports in two shapes:
 * - report-uri: one report, Content-Type application/csp-report,
 *   {"csp-report": {"document-uri", "violated-directive", "blocked-uri", ...}}
 * - report-to (Reporting API): a batch, Content-Type application/reports+json,
 *   [{"type": "csp-violation", "body": {"documentURL", "effectiveDirective",
 *   "blockedURL", ...}}]
 *
 * Anyone can POST here, so nothing in a report is trusted: each field is
 * cut down to a short, single-line value, URLs lose their query string and
 * fragment (a tracking id or token must not end up in the logs), and how
 * much gets logged is capped.
 */

export type CspViolation = {
  directive: string;
  blocked: string;
  page: string;
  disposition: string;
};

/** Bigger than any real report; anything over this isn't one. */
export const MAX_REPORT_BYTES = 16 * 1024;
/** Reports logged from one request, however many it carries. */
const MAX_PER_REQUEST = 5;
const FIELD_MAX = 200;

function text(value: unknown): string {
  if (typeof value !== "string") return "";
  // Control characters out, so a report can't forge extra log lines.
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, FIELD_MAX);
}

/** A URL without credentials, query or fragment; keywords ("inline", "eval") as they are. */
function url(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol === "data:" || u.protocol === "blob:") return u.protocol;
    return `${u.protocol}//${u.host}${u.pathname}`.slice(0, FIELD_MAX);
  } catch {
    return raw.split(/[?#]/)[0];
  }
}

function fromReportUri(body: Record<string, unknown>): CspViolation {
  return {
    directive: text(body["effective-directive"]) || text(body["violated-directive"]),
    blocked: url(body["blocked-uri"]),
    page: url(body["document-uri"]),
    disposition: text(body.disposition),
  };
}

function fromReportTo(body: Record<string, unknown>): CspViolation {
  return {
    directive: text(body.effectiveDirective),
    blocked: url(body.blockedURL),
    page: url(body.documentURL),
    disposition: text(body.disposition),
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The violations in a parsed request body; anything that isn't one is ignored. */
export function parseCspReports(payload: unknown): CspViolation[] {
  const found: CspViolation[] = [];
  if (isObject(payload) && isObject(payload["csp-report"])) {
    found.push(fromReportUri(payload["csp-report"]));
  } else if (Array.isArray(payload)) {
    for (const report of payload) {
      if (isObject(report) && report.type === "csp-violation" && isObject(report.body)) {
        found.push(fromReportTo(report.body));
      }
    }
  }
  return found.filter((v) => v.directive).slice(0, MAX_PER_REQUEST);
}

/**
 * How many reports get logged, per server instance, per minute: in total and
 * from any one IP. Kept in memory rather than the rate_limits table so a
 * flood costs no database writes. Each instance caps itself, which is
 * enough to keep the logs readable.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const MAX_PER_IP_PER_WINDOW = 5;

export function createReportLimiter(now: () => number = Date.now) {
  let windowStart = now();
  let logged = 0;
  let suppressed = 0;
  let perIp = new Map<string, number>();

  return {
    /**
     * Whether one more report from this IP may be logged. When a window
     * closes with reports dropped, returns how many, to log once.
     */
    take(ip: string): { allowed: boolean; suppressedLastWindow: number } {
      let suppressedLastWindow = 0;
      if (now() - windowStart >= WINDOW_MS) {
        suppressedLastWindow = suppressed;
        windowStart = now();
        logged = 0;
        suppressed = 0;
        perIp = new Map();
      }
      const fromIp = perIp.get(ip) ?? 0;
      if (logged >= MAX_PER_WINDOW || fromIp >= MAX_PER_IP_PER_WINDOW) {
        suppressed++;
        return { allowed: false, suppressedLastWindow };
      }
      logged++;
      perIp.set(ip, fromIp + 1);
      return { allowed: true, suppressedLastWindow };
    },
  };
}
