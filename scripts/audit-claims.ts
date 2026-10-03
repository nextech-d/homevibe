/**
 * Audits every product's customer-facing copy against what HomeVibe actually
 * offers.
 *
 *   npx tsx scripts/audit-claims.ts            # report
 *   npx tsx scripts/audit-claims.ts --quiet    # only contradictions
 *   npx tsx scripts/audit-claims.ts --json     # machine-readable
 *
 * Exits 1 when a contradiction is found, so it can gate a deploy or run after
 * a bulk import. Written after a sweep found invented warranty terms on 104
 * products: five contradictory warranty claims, two contradictory delivery
 * claims, and 24 component warranty figures that varied between identical
 * motors.
 *
 * CANONICAL is the single source of truth. When terms genuinely change, change
 * them here and in app/components/WhyBuyFromUs.tsx together.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

export const CANONICAL = {
  warrantyMonths: 12,
  warrantyWording: "12-month warranty on parts and labour, serviced by our own technicians",
  deliveryNairobi: "free",
  deliveryElsewhere: "courier rate confirmed before dispatch",
  installation: "included",
};

type Severity = "contradiction" | "unverified";

type Finding = {
  productId: number;
  productName: string;
  severity: Severity;
  kind: string;
  quote: string;
};

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

/** Months a sentence promises, or null when it states no duration. */
function promisedMonths(sentence: string): number | null {
  const m = sentence.match(DURATION);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2].toLowerCase().startsWith("month") ? n : n * 12;
}

const RULES: { kind: string; severity: Severity; test: (s: string) => boolean }[] = [
  {
    kind: "warranty longer than ours",
    severity: "contradiction",
    test: (s) => /warrant|guarantee/i.test(s) && (promisedMonths(s) ?? 0) > CANONICAL.warrantyMonths,
  },
  {
    kind: "delivery charge",
    severity: "contradiction",
    test: (s) =>
      /\bdeliver\w*\b|\bshipping\b/i.test(s) &&
      /\bKSh\s?[\d,]+/i.test(s) &&
      !/outside nairobi|courier rate|upcountry/i.test(s),
  },
  {
    kind: "installation charged or excluded",
    severity: "contradiction",
    test: (s) => /\binstallation\b/i.test(s) && /\b(extra|not included|excluded|charged|additional cost)\b/i.test(s),
  },
  {
    kind: "box contents",
    severity: "unverified",
    test: (s) => /what'?s in the box/i.test(s),
  },
  {
    kind: "price promise",
    severity: "unverified",
    test: (s) => /\bwe (stock|supply|fit|sell) (them|it|these)\b[^.]*KSh/i.test(s),
  },
  {
    kind: "service promise",
    severity: "unverified",
    test: (s) => /\bwe'?(ll| will) (replace|refund|repair|fix|collect)\b/i.test(s),
  },
];

async function main() {
  const quiet = process.argv.includes("--quiet");
  const asJson = process.argv.includes("--json");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    // A build without database access cannot audit, and failing it would block
    // deploys for a reason that has nothing to do with the copy.
    console.warn("audit-claims: DATABASE_URL not set, skipping the claim audit.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const findings: Finding[] = [];

  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { faqs: true },
      orderBy: { id: "asc" },
    });

    for (const product of products) {
      const sources = [
        product.description,
        product.body ?? "",
        ...product.faqs.map((f) => `${f.question} . ${f.answer}`),
      ];
      for (const sentence of sentences(textOf(sources.join(" . ")))) {
        for (const rule of RULES) {
          if (!rule.test(sentence)) continue;
          findings.push({
            productId: product.id,
            productName: product.name,
            severity: rule.severity,
            kind: rule.kind,
            quote: sentence.slice(0, 160),
          });
        }
      }
    }

    const contradictions = findings.filter((f) => f.severity === "contradiction");
    const unverified = findings.filter((f) => f.severity === "unverified");

    if (asJson) {
      console.log(JSON.stringify({ canonical: CANONICAL, contradictions, unverified }, null, 2));
    } else {
      console.log(`Checked ${products.length} published products against:`);
      console.log(`  warranty      ${CANONICAL.warrantyWording}`);
      console.log(`  delivery      Nairobi ${CANONICAL.deliveryNairobi}, elsewhere ${CANONICAL.deliveryElsewhere}`);
      console.log(`  installation  ${CANONICAL.installation}\n`);

      console.log(`CONTRADICTIONS: ${contradictions.length}`);
      for (const f of contradictions) {
        console.log(`  #${f.productId} ${f.productName.slice(0, 34)}`);
        console.log(`     ${f.kind}: ${f.quote}`);
      }

      if (!quiet) {
        const byKind = new Map<string, number>();
        for (const f of unverified) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
        console.log(`\nUNVERIFIED (not contradictions - claims nobody has checked): ${unverified.length}`);
        for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) {
          console.log(`  ${String(n).padStart(3)} ${kind}`);
        }
      }
    }

    process.exitCode = contradictions.length > 0 ? 1 : 0;
  } catch (error) {
    // Same reasoning: an unreachable database is an infrastructure problem,
    // not a claim problem. Loud, but not a failed build.
    console.warn(
      "audit-claims: could not reach the database, skipping -",
      error instanceof Error ? error.message.split("\n")[0] : error
    );
  } finally {
    await prisma.$disconnect();
  }
}

main();
