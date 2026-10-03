/**
 * Audits every published product's customer-facing copy against what HomeVibe
 * actually offers.
 *
 *   npx tsx scripts/audit-claims.ts              # report
 *   npx tsx scripts/audit-claims.ts --quiet      # only contradictions
 *   npx tsx scripts/audit-claims.ts --json       # machine-readable
 *   npx tsx scripts/audit-claims.ts --require-db # no database access is a failure
 *
 * Written after a sweep found invented warranty terms on 104 products: five
 * contradictory warranty claims, two contradictory delivery claims, and 24
 * component warranty figures that varied between identical motors.
 *
 * The rules live in app/lib/claims.ts, shared with the publish guard, so this
 * report and that gate cannot drift apart. The division of labour:
 *
 *   publish guard  refuses new copy - contradictions always, unverified
 *                  promises unless the product's claims have been checked
 *   this script    reports what is already in the catalogue, and exits 1 on a
 *                  contradiction so it can gate a deploy or a bulk import
 *
 * Unverified promises do not fail the run. They cannot reach the catalogue
 * through the admin any more, and the handful predating the guard are listed
 * so they can be checked or removed deliberately.
 *
 * Without --require-db, missing or unreachable database access logs a warning
 * and passes: a Neon socket timeout should not block a deploy the way a false
 * claim should. CI passes --require-db, because there the whole point of the
 * run is to check, and a run that cannot check must not report success.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CANONICAL, findClaimProblems, type ClaimSeverity } from "../app/lib/claims";

config({ path: ".env.local" });

export { CANONICAL };

type Finding = {
  productId: number;
  productName: string;
  severity: ClaimSeverity;
  kind: string;
  quote: string;
  /** When someone confirmed this product's promises, if they have. */
  claimsCheckedAt: string | null;
};

async function main() {
  const quiet = process.argv.includes("--quiet");
  const asJson = process.argv.includes("--json");
  // CI sets this: a run that cannot reach the catalogue has checked nothing,
  // and must say so by failing rather than printing a warning nobody reads.
  const requireDb = process.argv.includes("--require-db");
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    if (requireDb) {
      console.error("audit-claims: DATABASE_URL is not set, so NOTHING WAS CHECKED.");
      console.error("audit-claims: this run was asked to audit the catalogue and could not reach it.");
      console.error("audit-claims: add a DATABASE_URL secret with read access to the catalogue.");
      process.exitCode = 1;
      return;
    }
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
      const problems = findClaimProblems([
        product.description,
        product.body,
        ...(Array.isArray(product.highlights) ? (product.highlights as string[]) : []),
        ...product.faqs.map((faq) => `${faq.question} . ${faq.answer}`),
      ]);

      for (const problem of problems) {
        findings.push({
          productId: product.id,
          productName: product.name,
          severity: problem.severity,
          kind: problem.kind,
          quote: problem.quote,
          claimsCheckedAt: product.claimsCheckedAt ? product.claimsCheckedAt.toISOString() : null,
        });
      }
    }

    const contradictions = findings.filter((f) => f.severity === "contradiction");
    const unverified = findings.filter((f) => f.severity === "unverified" && !f.claimsCheckedAt);
    const checked = findings.filter((f) => f.severity === "unverified" && f.claimsCheckedAt);

    if (asJson) {
      console.log(
        JSON.stringify({ canonical: CANONICAL, contradictions, unverified, checked }, null, 2)
      );
    } else {
      console.log(`Checked ${products.length} published products against:`);
      console.log(`  warranty      ${CANONICAL.warrantyWording}`);
      console.log(
        `  delivery      Nairobi ${CANONICAL.deliveryNairobi}, elsewhere ${CANONICAL.deliveryElsewhere}`
      );
      console.log(`  installation  ${CANONICAL.installation}\n`);

      console.log(`CONTRADICTIONS: ${contradictions.length}`);
      for (const f of contradictions) {
        console.log(`  #${f.productId} ${f.productName.slice(0, 34)}`);
        console.log(`     ${f.kind}: ${f.quote}`);
      }

      if (!quiet) {
        const byKind = new Map<string, number>();
        for (const f of unverified) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
        console.log(`\nUNVERIFIED (not contradictions - promises nobody has checked): ${unverified.length}`);
        for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) {
          console.log(`  ${String(n).padStart(3)} ${kind}`);
        }
        const ids = [...new Set(unverified.map((f) => f.productId))];
        if (ids.length > 0) {
          console.log(`  products: ${ids.join(", ")}`);
          console.log("  each needs the promise checked and ticked in the admin, or the claim removed");
        }

        if (checked.length > 0) {
          const checkedIds = [...new Set(checked.map((f) => f.productId))];
          console.log(`\nCHECKED (promises someone has confirmed): ${checked.length}`);
          console.log(`  products: ${checkedIds.join(", ")}`);
        }
      }
    }

    process.exitCode = contradictions.length > 0 ? 1 : 0;
  } catch (error) {
    // Prisma's connection errors lead with a blank line, so take the first
    // line that actually says something.
    const detail =
      (error instanceof Error ? error.message : String(error))
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? "no error message";
    if (requireDb) {
      console.error(`audit-claims: could not reach the database, so NOTHING WAS CHECKED - ${detail}`);
      console.error("audit-claims: this run was asked to audit the catalogue and could not reach it.");
      process.exitCode = 1;
    } else {
      // Same reasoning: an unreachable database is an infrastructure problem,
      // not a claim problem. Loud, but not a failed build.
      console.warn("audit-claims: could not reach the database, skipping -", detail);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
