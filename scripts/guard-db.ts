/**
 * Runs before the db:* scripts (push, studio, seed, migrate):
 *
 *   tsx scripts/guard-db.ts "prisma db push" && prisma db push
 *
 * Loads the env files in the order prisma.config.ts does - .env.local here,
 * then the repo root's when run from api/, then .env, none overriding what's
 * already set - so it checks the DATABASE_URL Prisma is about to use, and
 * exits non-zero if that's production's. ALLOW_PROD_DB=1 lets it through.
 */
import { config as loadEnv } from "dotenv";

import { assertNotProductionDatabase } from "../shared/prod-db-guard";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: "../.env.local", quiet: true });
loadEnv({ quiet: true });

try {
  assertNotProductionDatabase(process.argv[2] ?? "this Prisma command");
} catch (error) {
  console.error(`\n✖ ${(error as Error).message}\n`);
  process.exit(1);
}
