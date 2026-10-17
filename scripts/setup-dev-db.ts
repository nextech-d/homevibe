/**
 * Sets up the local development database (Neon project "homevibe-dev"):
 * applies the migrations, then copies the catalogue - and only the
 * catalogue - from production.
 *
 *   npx tsx scripts/setup-dev-db.ts            # show what it would do, change nothing
 *   npx tsx scripts/setup-dev-db.ts --apply    # migrate dev and copy
 *
 *   npx tsx scripts/setup-dev-db.ts --apply --replace
 *                                              # refresh: empty dev's catalogue first
 *
 * Production's URL comes from PROD_DATABASE_URL in .env.prod-db - which
 * nothing else loads - and dev's from DEV_DIRECT_URL (or DEV_DATABASE_URL)
 * in .env.dev-db. It refuses to run if the two are the same database, if
 * .env.prod-db's host isn't the PROD_DATABASE_HOST in .env.dev-db, or if
 * dev's catalogue tables already have rows and --replace wasn't given.
 * --replace empties them in the same transaction as the copy, and with them
 * dev's order_items, whose product ids would no longer mean anything.
 *
 * Production is only ever read, in one READ ONLY, REPEATABLE READ
 * transaction - one consistent snapshot - on a session that defaults to read
 * only as well. Customers, orders, order items, addresses, sessions and rate
 * limits are never read at all: the copy names its tables, it doesn't take
 * "everything but".
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { Client } from "pg";

import { databaseHost, readDevDbFile, sameDatabaseHost } from "../shared/prod-db-guard";

/** In foreign-key order: each table only refers to ones above it. */
const CATALOGUE_TABLES = [
  "brands",
  "categories",
  "subcategories",
  "products",
  "product_faqs",
  "featured_home_slots",
  "faq_items",
  "site_settings",
  "content_posts",
] as const;

/** Every other table, named so a new one fails the check below until someone decides. */
const NEVER_COPIED = [
  "users",
  "sessions",
  "saved_addresses",
  "orders",
  "order_items",
  "rate_limits",
  "_prisma_migrations",
] as const;

const apply = process.argv.includes("--apply");
const replace = process.argv.includes("--replace");

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function readEnvFile(path: string): Record<string, string> {
  try {
    return parseEnv(readFileSync(path, "utf8")) as Record<string, string>;
  } catch {
    fail(`Can't read ${path}.`);
  }
}

const prodUrl = readEnvFile(".env.prod-db").PROD_DATABASE_URL?.trim();
const devFile = readDevDbFile() ?? fail("Can't read .env.dev-db.");
const devUrl = (devFile.DEV_DIRECT_URL?.trim() || devFile.DEV_DATABASE_URL?.trim()) ?? "";
const prodHostOnFile = devFile.PROD_DATABASE_HOST?.trim();

const prodHost = databaseHost(prodUrl) ?? fail("PROD_DATABASE_URL in .env.prod-db isn't a database URL.");
const devHost = databaseHost(devUrl) ?? fail("DEV_DIRECT_URL / DEV_DATABASE_URL in .env.dev-db aren't filled in.");
if (!prodHostOnFile) fail("PROD_DATABASE_HOST isn't set in .env.dev-db.");
if (sameDatabaseHost(prodHost, devHost)) fail("The dev and production URLs are the same database.");
if (!sameDatabaseHost(prodHost, prodHostOnFile)) {
  fail(`.env.prod-db's PROD_DATABASE_URL (${prodHost}) isn't production (${prodHostOnFile}) - nothing to copy from.`);
}

const quote = (table: string) => `"${table}"`;

async function connect(url: string, readOnly: boolean): Promise<Client> {
  const client = new Client({
    connectionString: url,
    ...(readOnly ? { options: "-c default_transaction_read_only=on" } : {}),
  });
  await client.connect();
  return client;
}

async function tableColumns(client: Client): Promise<Map<string, string[]>> {
  const { rows } = await client.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' ORDER BY table_name, column_name`
  );
  const tables = new Map<string, string[]>();
  for (const row of rows) tables.set(row.table_name, [...(tables.get(row.table_name) ?? []), row.column_name]);
  return tables;
}

async function main() {
  console.log(`Production (read only): ${prodHost}`);
  console.log(`Dev (written):          ${devHost}`);
  console.log(`Copies:      ${CATALOGUE_TABLES.join(", ")}`);
  console.log(`Never reads: ${NEVER_COPIED.join(", ")}`);
  if (replace) console.log("--replace:   empties dev's copies of those tables, and dev's order_items, first");
  if (!apply) {
    console.log("\nDry run - nothing changed. Run again with --apply to migrate dev and copy.");
    return;
  }

  const prod = await connect(prodUrl!, true);
  let dev: Client | null = null;
  try {
    const prodColumns = await tableColumns(prod);
    const known = new Set<string>([...CATALOGUE_TABLES, ...NEVER_COPIED]);
    const unknown = [...prodColumns.keys()].filter((table) => !known.has(table));
    if (unknown.length > 0) fail(`Production has tables this script doesn't know: ${unknown.join(", ")}. Add each to one list.`);

    console.log("\n1. prisma migrate deploy on dev");
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      // prisma.config.ts loads .env.local without overriding, so this wins.
      env: { ...process.env, DATABASE_URL: devUrl },
    });

    dev = await connect(devUrl, false);
    const devColumns = await tableColumns(dev);

    // Same columns on both sides, or the copy would silently drop some.
    for (const table of CATALOGUE_TABLES) {
      const a = prodColumns.get(table)?.join(",");
      const b = devColumns.get(table)?.join(",");
      if (!a || a !== b) fail(`"${table}" has different columns in production and dev - the migrations and production have drifted.`);
    }

    for (const table of replace ? [] : CATALOGUE_TABLES) {
      const { rows } = await dev.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${quote(table)}`);
      if (rows[0].n > 0) fail(`Dev's "${table}" already has rows. Run again with --replace to refresh it.`);
    }

    console.log("2. Reading the catalogue from production");
    const snapshot = new Map<string, string>();
    await prod.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    try {
      for (const table of CATALOGUE_TABLES) {
        // As JSON text, so no value round-trips through a JS Date or array.
        const { rows } = await prod.query<{ rows: string; n: number }>(
          `SELECT coalesce(json_agg(t), '[]')::text AS rows, count(*)::int AS n FROM ${quote(table)} t`
        );
        snapshot.set(table, rows[0].rows);
        console.log(`   ${table}: ${rows[0].n}`);
      }
    } finally {
      await prod.query("ROLLBACK");
    }

    console.log("3. Writing to dev, then resetting its id sequences");
    await dev.query("BEGIN");
    try {
      if (replace) {
        // Named, not CASCADE: anything else that refers to these makes it fail instead.
        await dev.query(`TRUNCATE ${[...CATALOGUE_TABLES, "order_items"].map(quote).join(", ")}`);
        console.log("   emptied dev's catalogue tables and order_items");
      }
      for (const table of CATALOGUE_TABLES) {
        await dev.query(
          `INSERT INTO ${quote(table)} SELECT * FROM json_populate_recordset(null::${quote(table)}, $1::json)`,
          [snapshot.get(table)]
        );
      }
      for (const table of CATALOGUE_TABLES) {
        if (!devColumns.get(table)?.includes("id")) continue; // site_settings is keyed by name
        const { rows } = await dev.query<{ seq: string | null }>(
          `SELECT pg_get_serial_sequence($1, 'id') AS seq`,
          [quote(table)]
        );
        if (!rows[0]?.seq) continue;
        await dev.query(
          `SELECT setval($1, coalesce((SELECT max(id) FROM ${quote(table)}), 1), (SELECT max(id) IS NOT NULL FROM ${quote(table)}))`,
          [rows[0].seq]
        );
      }
      await dev.query("COMMIT");
    } catch (error) {
      await dev.query("ROLLBACK");
      throw error;
    }
    console.log("\n✔ Dev database ready.");
  } finally {
    await prod.end();
    await dev?.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
