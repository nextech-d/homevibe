import { serve } from "@hono/node-server";
import { config as loadEnv } from "dotenv";
import { createApp } from "./app.js";
import { assertNotProductionDatabase } from "../../shared/prod-db-guard.js";

// A DATABASE_URL given for one run wins over the files, as it does for Next
// and Prisma - how a deliberate run against production is made.
const shellDatabaseUrl = process.env.DATABASE_URL;

loadEnv({ path: ".env.local" });
loadEnv({ path: "../.env.local", override: true });
loadEnv({ override: true });

if (shellDatabaseUrl) process.env.DATABASE_URL = shellDatabaseUrl;

// Local runs only - Vercel serves api/*.ts, not this file.
assertNotProductionDatabase("the local API");

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

console.log(`HomeVibe API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

export default app;
