/**
 * What HomeVibe actually offers, and the rules that keep product copy honest
 * about it.
 *
 * Two kinds of problem, with different consequences:
 *
 *   contradiction  the copy states something untrue - a three-year warranty, a
 *                  delivery charge, installation as an extra. Always refused
 *                  on publish.
 *   unverified     the copy promises something specific that nobody has
 *                  checked - a box contents list, a free accessory, a price.
 *                  Refused on publish too, unless the product carries an
 *                  explicit acknowledgement that someone opened a carton or
 *                  read the manufacturer's spec sheet.
 *
 * The unverified half exists because a sweep cannot be relied on. Product 149
 * was created while the sweep that cleared 95 box contents lists was running,
 * and went out with its own list and a Warranty Card promise - not a missed
 * pattern, just a catalogue that moved. A gate at publish time cannot be
 * outrun that way.
 *
 * Mirrored in api/src/lib/claims.ts for the standalone API, the way
 * mapProduct.ts is. Change both together, and change CANONICAL alongside
 * app/components/WhyBuyFromUs.tsx.
 */
export const CANONICAL = {
  warrantyMonths: 12,
  warrantyWording: "12-month warranty on parts and labour, serviced by our own technicians",
  deliveryNairobi: "free",
  deliveryElsewhere: "courier rate confirmed before dispatch",
  installation: "included",
};

export const CANONICAL_WARRANTY_MONTHS = CANONICAL.warrantyMonths;

export type ClaimSeverity = "contradiction" | "unverified";

export type ClaimProblem = {
  kind: string;
  severity: ClaimSeverity;
  quote: string;
};

const DURATION = /\b(\d+)(?:\s*(?:to|–|-)\s*\d+)?\s*[-–]?\s*(year|month)s?\b/i;

/**
 * Every spelling of a box contents heading the catalogue has produced:
 * "What's in the Box", a curly apostrophe, no apostrophe at all, "What is",
 * "WHAT COMES IN THE BOX", and the two header styles an importer used. Kept
 * deliberately wide - a false positive costs one tick of a checkbox, a false
 * negative puts an unchecked promise on the storefront.
 */
const BOX_CONTENTS =
  /what(?:['’]?s|\s+is)\s+in\s+the\s+box|what\s+comes\s+in\s+the\s+box|\bbox\s+contents\b|\bpackage\s+contents\b|\bin\s+the\s+carton\b/i;

/**
 * A promise of a specific accessory. Narrow on purpose: "Vegetable Box: Yes"
 * is a spec, and "we remove the transit bolts" is something we do, so the
 * pattern wants a free/bonus framing or the warranty card we were promising
 * on 93 products without having seen one.
 */
const ACCESSORY_PROMISE =
  /\bwarranty card\b|\b(?:free|extra|bonus)\s+accessor\w+|\baccessories\s+included\b|\bcomes with (?:a |an )?free\b/i;

const PRICE_PROMISE = /\bwe (stock|supply|fit|sell) (them|it|these)\b[^.]*KSh/i;

const SERVICE_PROMISE = /\bwe'?(ll| will) (replace|refund|repair|fix|collect)\b/i;

function textOf(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " . ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\s\.\s/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

/** Months a sentence promises, or null when it states no duration. */
function promisedMonths(sentence: string): number | null {
  const match = sentence.match(DURATION);
  if (!match) return null;
  const n = Number(match[1]);
  return match[2].toLowerCase().startsWith("month") ? n : n * 12;
}

const RULES: { kind: string; severity: ClaimSeverity; test: (sentence: string) => boolean }[] = [
  {
    kind: `warranty longer than our ${CANONICAL.warrantyMonths} months`,
    severity: "contradiction",
    test: (s) => /warrant|guarantee/i.test(s) && (promisedMonths(s) ?? 0) > CANONICAL.warrantyMonths,
  },
  {
    kind: "delivery charge (Nairobi delivery is free)",
    severity: "contradiction",
    test: (s) =>
      /\bdeliver\w*\b|\bshipping\b/i.test(s) &&
      /\bKSh\s?[\d,]+/i.test(s) &&
      !/outside nairobi|courier rate|upcountry/i.test(s),
  },
  {
    kind: "installation charged (installation is included)",
    severity: "contradiction",
    test: (s) =>
      /\binstallation\b/i.test(s) && /\b(extra|not included|excluded|charged|additional cost)\b/i.test(s),
  },
  {
    kind: "box contents",
    severity: "unverified",
    test: (s) => BOX_CONTENTS.test(s),
  },
  {
    kind: "accessory promise",
    severity: "unverified",
    test: (s) => ACCESSORY_PROMISE.test(s),
  },
  {
    kind: "price promise",
    severity: "unverified",
    test: (s) => PRICE_PROMISE.test(s),
  },
  {
    kind: "service promise",
    severity: "unverified",
    test: (s) => SERVICE_PROMISE.test(s),
  },
];

/** Every problem in a product's customer-facing copy, both severities. */
export function findClaimProblems(parts: (string | null | undefined)[]): ClaimProblem[] {
  const problems: ClaimProblem[] = [];
  const text = textOf(parts.filter(Boolean).join(" . "));

  for (const sentence of sentences(text)) {
    for (const rule of RULES) {
      if (!rule.test(sentence)) continue;
      problems.push({ kind: rule.kind, severity: rule.severity, quote: sentence.slice(0, 140) });
    }
  }

  return problems;
}

function detail(problems: ClaimProblem[]): string {
  const shown = problems
    .slice(0, 3)
    .map((p) => `${p.kind} — "${p.quote}"`)
    .join("; ");
  return problems.length > 3 ? `${shown} (and ${problems.length - 3} more)` : shown;
}

/**
 * One line for the admin to show, or null when the copy may be published.
 *
 * `claimsChecked` is the escape hatch for the unverified half: it says someone
 * has confirmed these specific promises against a carton or a spec sheet. It
 * does nothing for a contradiction, which no amount of checking makes true.
 */
export function validateProductClaims(
  parts: (string | null | undefined)[],
  options: { claimsChecked?: boolean } = {}
): string | null {
  const problems = findClaimProblems(parts);

  const contradictions = problems.filter((p) => p.severity === "contradiction");
  if (contradictions.length > 0) {
    return `This copy contradicts what we offer: ${detail(contradictions)}. Fix the copy, or save it as a draft.`;
  }

  if (options.claimsChecked) return null;

  const unverified = problems.filter((p) => p.severity === "unverified");
  if (unverified.length > 0) {
    return `This copy promises something nobody has checked: ${detail(unverified)}. Open a carton or read the manufacturer's spec sheet and tick "promises checked", or remove the claim, or save it as a draft.`;
  }

  return null;
}
