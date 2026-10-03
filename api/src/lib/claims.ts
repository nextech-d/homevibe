/**
 * Blocks a product from being published while its copy contradicts what we
 * offer.
 *
 * Written after a sweep found invented warranty terms across 104 products -
 * five contradictory warranty claims, two contradictory delivery claims, and
 * component warranty figures that varied between identical motors - all of it
 * written before anything was checking. scripts/audit-claims.ts catches what is
 * already in the catalogue; this stops the next one going out.
 *
 * Drafts are left alone, the same way a missing primary image is only an error
 * on publish.
 */
export const CANONICAL_WARRANTY_MONTHS = 12;

const DURATION = /\b(\d+)(?:\s*(?:to|–|-)\s*\d+)?\s*[-–]?\s*(year|month)s?\b/i;

function textOf(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " . ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\s\.\s/).map((s) => s.trim()).filter((s) => s.length > 8);
}

function promisedMonths(sentence: string): number | null {
  const m = sentence.match(DURATION);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2].toLowerCase().startsWith("month") ? n : n * 12;
}

export type ClaimProblem = { kind: string; quote: string };

/** Contradictions only - unverifiable claims are the audit script's business. */
export function findClaimProblems(parts: (string | null | undefined)[]): ClaimProblem[] {
  const problems: ClaimProblem[] = [];
  const text = textOf(parts.filter(Boolean).join(" . "));

  for (const sentence of sentences(text)) {
    if (/warrant|guarantee/i.test(sentence)) {
      const months = promisedMonths(sentence);
      if (months !== null && months > CANONICAL_WARRANTY_MONTHS) {
        problems.push({
          kind: `warranty longer than our ${CANONICAL_WARRANTY_MONTHS} months`,
          quote: sentence.slice(0, 140),
        });
      }
    }

    if (
      /\bdeliver\w*\b|\bshipping\b/i.test(sentence) &&
      /\bKSh\s?[\d,]+/i.test(sentence) &&
      !/outside nairobi|courier rate|upcountry/i.test(sentence)
    ) {
      problems.push({ kind: "delivery charge (Nairobi delivery is free)", quote: sentence.slice(0, 140) });
    }

    if (/\binstallation\b/i.test(sentence) && /\b(extra|not included|excluded|charged|additional cost)\b/i.test(sentence)) {
      problems.push({ kind: "installation charged (installation is included)", quote: sentence.slice(0, 140) });
    }
  }

  return problems;
}

/** One line for the admin to show, or null when the copy is clean. */
export function validateProductClaims(parts: (string | null | undefined)[]): string | null {
  const problems = findClaimProblems(parts);
  if (problems.length === 0) return null;

  const detail = problems
    .slice(0, 3)
    .map((p) => `${p.kind} — "${p.quote}"`)
    .join("; ");
  const more = problems.length > 3 ? ` (and ${problems.length - 3} more)` : "";

  return `This copy contradicts what we offer: ${detail}${more}. Fix the copy, or save it as a draft.`;
}
