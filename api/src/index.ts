import { serve } from "@hono/node-server";
import { config as loadEnv } from "dotenv";
import { createApp } from "./app.js";

loadEnv({ path: ".env.local" });
loadEnv({ path: "../.env.local", override: true });
loadEnv({ override: true });

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

console.log(`HomeVibe API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

export default app;
