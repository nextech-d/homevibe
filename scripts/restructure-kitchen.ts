/**
 * Folds the kitchen categories into one.
 *
 *   npx tsx scripts/restructure-kitchen.ts            # show what would change
 *   npx tsx scripts/restructure-kitchen.ts --apply    # write it
 *
 * Cooking becomes Kitchen at /category/kitchen, and the subcategories that
 * belong in a kitchen move under it: Refrigeration's three, Coffee's three, and
 * Dishwashers out of Cleaning. Refrigeration and Coffee are then empty shells
 * and are removed. Cleaning keeps Washing Machines and Vacuums.
 *
 * Products are attached to subcategories, not categories, so they follow their
 * subcategory and nothing needs reassigning one product at a time.
 *
 * Idempotent: a second run reports nothing to do. The old URLs are redirected
 * in next.config.ts, which must ship with this.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next loads .env.local automatically; a standalone script does not.
config({ path: ".env.local" });

const KITCHEN = {
  fromSlug: "cooking",
  slug: "kitchen",
  label: "Kitchen",
  navLabel: "Kitchen",
  description:
    "Ovens, cooktops, microwaves, fridges, freezers and coffee machines for the whole kitchen.",
};

/** Subcategory slugs to pull in, with the category they currently sit under. */
const ADOPT: Array<{ slug: string; fromCategory: string }> = [
  { slug: "refrigerators", fromCategory: "refrigeration" },
  { slug: "freezers", fromCategory: "refrigeration" },
  { slug: "wine-cellars", fromCategory: "refrigeration" },
  { slug: "dishwashers", fromCategory: "cleaning" },
  { slug: "espresso-machines", fromCategory: "coffee-tech" },
  { slug: "grinders", fromCategory: "coffee-tech" },
  { slug: "brewers", fromCategory: "coffee-tech" },
];

/** Display order inside Kitchen. Cooking's own four stay first. */
const SUB_ORDER = [
  "ovens-ranges",
  "rangetops",
  "cooktops",
  "microwaves",
  "refrigerators",
  "freezers",
  "wine-cellars",
  "dishwashers",
  "espresso-machines",
  "grinders",
  "brewers",
];

/** Emptied by the move, so they go. Their URLs redirect to /category/kitchen. */
const RETIRE = ["refrigeration", "coffee-tech"];

async function main() {
  const apply = process.argv.includes("--apply");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: { _count: { select: { products: true } } },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const kitchen = bySlug.get(KITCHEN.slug) ?? bySlug.get(KITCHEN.fromSlug);
    if (!kitchen) {
      console.error(`Neither "${KITCHEN.slug}" nor "${KITCHEN.fromSlug}" exists. Nothing to do.`);
      process.exit(1);
    }

    console.log("Before:");
    for (const category of categories) {
      const subs = category.subcategories
        .map((s) => `${s.slug}(${s._count.products})`)
        .join(" ");
      console.log(`  ${category.slug.padEnd(14)} ${subs}`);
    }

    const renaming = kitchen.slug !== KITCHEN.slug || kitchen.label !== KITCHEN.label;
    const moving = ADOPT.map(({ slug, fromCategory }) => {
      const parent = bySlug.get(fromCategory);
      const sub = parent?.subcategories.find((s) => s.slug === slug);
      return sub ? { sub, fromCategory } : null;
    }).filter((m): m is { sub: (typeof kitchen.subcategories)[number]; fromCategory: string } => m !== null);

    const retiring = RETIRE.map((slug) => bySlug.get(slug)).filter((c) => c !== undefined);

    console.log("\nPlanned:");
    if (renaming) {
      console.log(`  rename ${kitchen.slug} -> ${KITCHEN.slug} ("${kitchen.label}" -> "${KITCHEN.label}")`);
    }
    for (const { sub, fromCategory } of moving) {
      console.log(`  move   ${fromCategory}/${sub.slug} (${sub._count.products} products) -> ${KITCHEN.slug}`);
    }
    for (const category of retiring) {
      const left = category.subcategories.filter(
        (s) => !moving.some((m) => m.sub.id === s.id)
      );
      const note = left.length > 0 ? ` BUT ${left.length} subcategory(ies) would remain - not deleting` : "";
      console.log(`  delete ${category.slug}${note}`);
    }

    const blocked = retiring.filter(
      (c) => c.subcategories.filter((s) => !moving.some((m) => m.sub.id === s.id)).length > 0
    );
    if (blocked.length > 0) {
      console.error("\nRefusing: a category to be retired still holds subcategories. Fix ADOPT first.");
      process.exit(1);
    }

    if (!renaming && moving.length === 0 && retiring.length === 0) {
      console.log("  nothing - already applied.");
      return;
    }

    if (!apply) {
      console.log("\nRe-run with --apply to write this.");
      return;
    }

    await prisma.$queryRawUnsafe("SELECT 1"); // wake a sleeping Neon branch first
    await prisma.$transaction(
      async (tx) => {
        await tx.category.update({
          where: { id: kitchen.id },
          data: {
            slug: KITCHEN.slug,
            label: KITCHEN.label,
            navLabel: KITCHEN.navLabel,
            description: KITCHEN.description,
          },
        });

        for (const { sub } of moving) {
          await tx.subcategory.update({
            where: { id: sub.id },
            data: { categoryId: kitchen.id },
          });
        }

        const subs = await tx.subcategory.findMany({ where: { categoryId: kitchen.id } });
        for (const sub of subs) {
          const index = SUB_ORDER.indexOf(sub.slug);
          await tx.subcategory.update({
            where: { id: sub.id },
            data: { sortOrder: index === -1 ? SUB_ORDER.length : index },
          });
        }

        for (const category of retiring) {
          await tx.category.delete({ where: { id: category.id } });
        }
      },
      { maxWait: 20000, timeout: 30000 }
    );

    const after = await prisma.category.findMany({
      include: {
        subcategories: {
          include: { _count: { select: { products: true } } },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    console.log("\nAfter:");
    for (const category of after) {
      const subs = category.subcategories
        .map((s) => `${s.slug}(${s._count.products})`)
        .join(" ");
      console.log(`  ${category.slug.padEnd(14)} ${subs}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
