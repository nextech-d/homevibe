-- Rate-limit counters for admin login and public order lookup.
--
-- The first file in prisma/migrations: until now the schema was managed with
-- `prisma db push` and the hand-run scripts in prisma/sql. Additive only - a
-- new table, nothing existing is touched.
--
-- Apply with `npx prisma migrate deploy`, which runs pending migration files
-- and nothing else. Do NOT use `prisma migrate dev` (npm run db:migrate)
-- against a real database: with no earlier migrations recorded, it reads the
-- whole existing schema as drift and offers to reset the database.
--
-- Reverse with: DROP TABLE "rate_limits";

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");
