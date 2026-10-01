/**
 * Sets the order categories appear in, in the top nav and the footer.
 *
 *   npx tsx scripts/order-nav-categories.ts            # show current vs intended
 *   npx tsx scripts/order-nav-categories.ts --apply    # write it
 *
 * NAV_ORDER below is the intended order, with the "Others" catch-all last. The
 * storefront reads categories per request, so applying this changes the live nav
 * without a deploy.
 *
 * This is a baseline, not a lock: anyone can reorder afterwards in
 * Admin -> Categories -> Sort order, and a later run of this script would reset
 * them to the list below. Keep the list in step with any deliberate change.
 *
 * Categories missing from the list keep their relative order and land after the
 * listed ones, so a newly created category never silently jumps the queue.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next loads .env.local automatically; a standalone script does not.
config({ path: ".env.local" });

/** Intended nav order, by slug. "Others" is a catch-all, so it sits last. */
const NAV_ORDER = [
  "gym",
  "tvs",
  "cooking",
  "refrigeration",
  "cleaning",
  "coffee-tech",
  "others",
];

async function main() {
  const apply = process.argv.includes("--apply");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, slug: true, navLabel: true, sortOrder: true },
    });

    const ranked = [...categories].sort((a, b) => {
      const ai = NAV_ORDER.indexOf(a.slug);
      const bi = NAV_ORDER.indexOf(b.slug);
      // Unlisted categories keep their current order, after the listed ones.
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    const changes = ranked
      .map((category, index) => ({ category, sortOrder: index }))
      .filter(({ category, sortOrder }) => category.sortOrder !== sortOrder);

    console.log("Current:  " + categories.map((c) => `${c.navLabel}(${c.sortOrder})`).join(" "));
    console.log("Intended: " + ranked.map((c, i) => `${c.navLabel}(${i})`).join(" "));

    const unlisted = categories.filter((c) => !NAV_ORDER.includes(c.slug));
    if (unlisted.length > 0) {
      console.log(
        `\nNot in NAV_ORDER, placed last: ${unlisted.map((c) => c.slug).join(", ")}`
      );
    }

    if (changes.length === 0) {
      console.log("\nNothing to change.");
      return;
    }

    console.log(`\n${changes.length} category/categories to renumber:`);
    for (const { category, sortOrder } of changes) {
      console.log(`  ${category.navLabel}: ${category.sortOrder} -> ${sortOrder}`);
    }

    if (!apply) {
      console.log("\nRe-run with --apply to write this.");
      return;
    }

    await prisma.$queryRawUnsafe("SELECT 1"); // wake a sleeping Neon branch first
    await prisma.$transaction(
      changes.map(({ category, sortOrder }) =>
        prisma.category.update({ where: { id: category.id }, data: { sortOrder } })
      )
    );

    console.log("\nApplied.");
  } finally {
    await prisma.$disconnect();
  }
}

main();
