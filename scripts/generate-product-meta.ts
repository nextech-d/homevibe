/**
 * Audits product SEO meta, optionally rewrites the weak rows with Claude, and
 * applies the reviewed result back to the database.
 *
 * Nothing reaches the database until you have read the CSV and marked rows
 * "yes", so generated copy is always reviewed by a person first.
 *
 *   npx tsx scripts/generate-product-meta.ts             # audit only, free, no API calls
 *   npx tsx scripts/generate-product-meta.ts --generate  # rewrite weak rows -> CSV
 *   npx tsx scripts/generate-product-meta.ts --apply --dry-run  # show what --apply would write
 *   npx tsx scripts/generate-product-meta.ts --apply     # write approved CSV rows to the DB
 *
 * Needs DATABASE_URL (.env.local) and, for --generate, ANTHROPIC_API_KEY.
 */
import { config } from "dotenv";

// Next loads .env.local automatically; a standalone script does not.
config({ path: ".env.local" });

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const CSV_PATH = "product-meta-review.csv";
const MODEL = "claude-opus-5";
const CONCURRENCY = 4;

/** Google truncates titles near 60 chars and descriptions near 155. */
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 155;

const MetaSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
});

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  specs: string;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  brand: { name: string };
  subcategory: { label: string; category: { label: string } };
};

// ---------------------------------------------------------------- audit ----

/** Why a row is not good enough to leave alone. Empty means it is fine. */
function weaknesses(product: ProductRow): string[] {
  const title = (product.metaTitle ?? "").trim();
  const desc = (product.metaDescription ?? "").trim();
  const name = product.name.trim().toLowerCase();
  const reasons: string[] = [];

  if (!title) reasons.push("no title");
  else if (title.length > TITLE_MAX) reasons.push(`title ${title.length} chars`);

  if (!desc) reasons.push("no description");
  else if (desc.toLowerCase() === name) reasons.push("description is just the product name");
  else if (title && desc.toLowerCase() === title.toLowerCase()) reasons.push("description same as title");
  else if (desc.length < DESC_MIN) reasons.push(`description ${desc.length} chars`);
  else if (desc.length > DESC_MAX + 5) reasons.push(`description ${desc.length} chars`);

  return reasons;
}

// ------------------------------------------------------------------ csv ----

function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Minimal RFC-4180 parser - handles quoted fields containing commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const CSV_HEADER = [
  "id",
  "apply",
  "name",
  "reasons",
  "currentTitle",
  "proposedTitle",
  "currentDescription",
  "proposedDescription",
] as const;

// ----------------------------------------------------------- generation ----

const SYSTEM = `You write SEO meta tags for an online appliance shop in Kenya.

Rules, in priority order:
1. Never state a fact that is not in the product data you are given. No invented
   capacities, warranties, certifications, delivery promises, awards or prices.
   If the data is thin, write something shorter and plainer rather than padding it.
2. The title must be at most ${TITLE_MAX} characters, and must name the product.
3. The description must be between ${DESC_MIN} and ${DESC_MAX} characters, read as a
   natural sentence or two, and lead with what makes this model worth choosing.
4. No clickbait, no "Buy now!", no ALL CAPS, no emoji, no exclamation marks.
5. Do not mention price - prices change and the tag would go stale.
6. Write plain international English.`;

function userPrompt(product: ProductRow): string {
  return [
    `Product name: ${product.name}`,
    `Brand: ${product.brand.name}`,
    `Category: ${product.subcategory.category.label} > ${product.subcategory.label}`,
    `Specs: ${product.specs || "(none recorded)"}`,
    `Description: ${product.description || "(none recorded)"}`,
    "",
    "Write the meta title and meta description for this product page.",
  ].join("\n");
}

/** Runs tasks with a fixed worker pool so we don't open 78 sockets at once. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

type Generated = { metaTitle: string; metaDescription: string; error?: string };

async function generate(
  client: Anthropic,
  product: ProductRow,
  usage: { input: number; output: number }
): Promise<Generated> {
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt(product) }],
      output_config: { format: zodOutputFormat(MetaSchema) },
    });

    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;

    if (response.stop_reason === "refusal") {
      return { metaTitle: "", metaDescription: "", error: "model declined" };
    }

    const parsed = response.parsed_output;
    if (!parsed) return { metaTitle: "", metaDescription: "", error: "unparseable response" };

    return { metaTitle: parsed.metaTitle.trim(), metaDescription: parsed.metaDescription.trim() };
  } catch (error) {
    const message =
      error instanceof Anthropic.APIError
        ? `API ${error.status}: ${error.message}`
        : error instanceof Error
          ? error.message
          : "unknown error";
    return { metaTitle: "", metaDescription: "", error: message };
  }
}

// ----------------------------------------------------------------- main ----

function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
}

async function loadProducts(prisma: PrismaClient): Promise<ProductRow[]> {
  return (await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      specs: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      brand: { select: { name: true } },
      subcategory: { select: { label: true, category: { select: { label: true } } } },
    },
  })) as ProductRow[];
}

async function runAudit(prisma: PrismaClient) {
  const products = await loadProducts(prisma);
  const weak = products.filter((p) => weaknesses(p).length > 0);

  console.log(`\n${products.length} published products, ${weak.length} need attention.\n`);

  const byReason = new Map<string, number>();
  for (const product of weak) {
    for (const reason of weaknesses(product)) {
      const key = reason.replace(/\d+/, "N");
      byReason.set(key, (byReason.get(key) ?? 0) + 1);
    }
  }
  for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${reason}`);
  }

  console.log(`\nRun with --generate to rewrite these ${weak.length} with Claude.\n`);
}

async function runGenerate(prisma: PrismaClient) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local, or pass it inline:\n" +
        "  ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-product-meta.ts --generate"
    );
    process.exit(1);
  }

  const products = await loadProducts(prisma);
  const weak = products.filter((p) => weaknesses(p).length > 0);
  if (weak.length === 0) {
    console.log("Nothing to rewrite - every product already has usable meta.");
    return;
  }

  console.log(`Rewriting ${weak.length} products with ${MODEL}...`);

  const client = new Anthropic();
  const usage = { input: 0, output: 0 };
  let done = 0;

  const generated = await mapLimit(weak, CONCURRENCY, async (product) => {
    const result = await generate(client, product, usage);
    done += 1;
    process.stdout.write(`\r  ${done}/${weak.length}`);
    return result;
  });

  process.stdout.write("\n");

  const lines = [CSV_HEADER.join(",")];
  let failures = 0;

  weak.forEach((product, index) => {
    const result = generated[index];
    if (result.error) {
      failures += 1;
      console.error(`  ! ${product.name}: ${result.error}`);
      return;
    }

    const notes = [...weaknesses(product)];
    if (result.metaTitle.length > TITLE_MAX) {
      notes.push(`CHECK: generated title ${result.metaTitle.length} chars`);
    }
    if (result.metaDescription.length > DESC_MAX + 5) {
      notes.push(`CHECK: generated description ${result.metaDescription.length} chars`);
    }

    lines.push(
      [
        String(product.id),
        "no",
        product.name,
        notes.join("; "),
        product.metaTitle ?? "",
        result.metaTitle,
        product.metaDescription ?? "",
        result.metaDescription,
      ]
        .map(csvEscape)
        .join(",")
    );
  });

  writeFileSync(CSV_PATH, `${lines.join("\n")}\n`, "utf8");

  // Opus 5: $5 per Mtok in, $25 per Mtok out.
  const cost = (usage.input / 1_000_000) * 5 + (usage.output / 1_000_000) * 25;

  console.log(`\nWrote ${lines.length - 1} rows to ${CSV_PATH}`);
  if (failures > 0) console.log(`${failures} failed - rerun to retry those.`);
  console.log(`Tokens: ${usage.input} in / ${usage.output} out  (~$${cost.toFixed(2)})`);
  console.log(
    `\nNext: open ${CSV_PATH}, edit any proposed text you want to change,\n` +
      `set the "apply" column to yes on the rows you approve, then run:\n` +
      "  npx tsx scripts/generate-product-meta.ts --apply\n"
  );
}

async function runApply(prisma: PrismaClient, dryRun: boolean) {
  if (!existsSync(CSV_PATH)) {
    console.error(`${CSV_PATH} not found. Run with --generate first.`);
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const header = rows.shift();
  if (!header || header[0] !== "id") {
    console.error(`${CSV_PATH} does not look like the generated file (no id header).`);
    process.exit(1);
  }

  const col = Object.fromEntries(CSV_HEADER.map((name) => [name, header.indexOf(name)]));
  const approved = rows.filter((row) => (row[col.apply] ?? "").trim().toLowerCase() === "yes");

  if (approved.length === 0) {
    console.log(`No rows marked "yes" in ${CSV_PATH} - nothing to apply.`);
    return;
  }

  let applied = 0;
  for (const row of approved) {
    const id = Number(row[col.id]);
    const metaTitle = (row[col.proposedTitle] ?? "").trim();
    const metaDescription = (row[col.proposedDescription] ?? "").trim();

    if (!Number.isInteger(id) || !metaTitle || !metaDescription) {
      console.error(`  ! skipped row ${row[col.id]}: missing id, title or description`);
      continue;
    }

    if (dryRun) {
      console.log(`  #${id}  ${metaTitle}`);
      console.log(`        ${metaDescription}`);
    } else {
      await prisma.product.update({ where: { id }, data: { metaTitle, metaDescription } });
    }
    applied += 1;
  }

  if (dryRun) {
    console.log(`\nDry run - nothing written. ${applied} of ${approved.length} approved rows are valid.`);
    return;
  }

  console.log(`Updated ${applied} of ${approved.length} approved products.`);
  console.log("Publish from the admin (or POST /api/revalidate) to refresh the storefront cache.");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const prisma = getPrisma();

  try {
    if (args.has("--apply")) await runApply(prisma, args.has("--dry-run"));
    else if (args.has("--generate")) await runGenerate(prisma);
    else await runAudit(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
