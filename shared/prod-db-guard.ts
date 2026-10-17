/**
 * Keeps the local dev server and local API off the production database.
 *
 * Production's host isn't written here - the repository is public - but read
 * from PROD_DATABASE_HOST in the gitignored .env.dev-db at the repo root.
 * Hosts are compared by Neon endpoint, so the pooled (ep-x-pooler.…) and
 * direct (ep-x.…) hosts of one database count as the same.
 *
 * Fails closed: a DATABASE_URL on a remote host when production's host can't
 * be read (no .env.dev-db, or no PROD_DATABASE_HOST in it) is refused too.
 * ALLOW_PROD_DB=1 for one run lets it through either way.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const DEV_DB_FILE = ".env.dev-db";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** The host of a Postgres URL, or null if it isn't one. */
export function databaseHost(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/** One name per database: Neon's pooled and direct hosts differ only by "-pooler". */
export function sameDatabaseHost(a: string, b: string): boolean {
  const normalise = (host: string) => host.toLowerCase().replace(/^(ep-[a-z0-9-]+?)-pooler\./, "$1.");
  return normalise(a) === normalise(b);
}

/** .env.dev-db from the repo root - the current directory or its parent (the API runs from api/). */
export function readDevDbFile(cwd = process.cwd()): Record<string, string> | null {
  for (const dir of [cwd, join(cwd, "..")]) {
    const path = join(dir, DEV_DB_FILE);
    if (existsSync(path)) return parseEnv(readFileSync(path, "utf8")) as Record<string, string>;
  }
  return null;
}

/** Throws if databaseUrl is (or may be) production's, unless ALLOW_PROD_DB=1. */
export function assertNotProductionDatabase(what: string, databaseUrl = process.env.DATABASE_URL): void {
  if (process.env.ALLOW_PROD_DB === "1") return;

  const host = databaseHost(databaseUrl);
  if (!host || LOCAL_HOSTS.has(host)) return;

  const prodHost = readDevDbFile()?.PROD_DATABASE_HOST?.trim();
  const reason = !prodHost
    ? `DATABASE_URL points at ${host}, and production's host can't be checked: PROD_DATABASE_HOST isn't set in ${DEV_DB_FILE}.`
    : sameDatabaseHost(host, prodHost)
      ? "DATABASE_URL points at the production database."
      : null;
  if (!reason) return;

  throw new Error(
    `Refusing to start ${what}: ${reason} Point DATABASE_URL in .env.local at the dev database, or set ALLOW_PROD_DB=1 for this run if you mean it.`
  );
}
