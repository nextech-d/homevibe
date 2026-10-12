/**
 * The browser origins allowed to call the API - one list, used by the main
 * app and by the standalone login/me functions.
 *
 * Production: the shop and the admin. Previews: this project's own Vercel
 * deployments only - <project>-<9-char hash>-nextech-ds-projects.vercel.app
 * and <project>-git-<branch>-nextech-ds-projects.vercel.app for the
 * homevibe and homevibe-admin projects - not any *.vercel.app. Localhost
 * only outside production.
 *
 * Fixed in code on purpose: the CORS_ORIGINS variable used to replace this
 * list wholesale, and is no longer read.
 */
const PRODUCTION_ORIGINS = new Set([
  "https://homevibe.co.ke",
  "https://admin.homevibe.co.ke",
  "https://homevibe-admin.vercel.app",
]);

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
]);

const PREVIEW_ORIGIN =
  /^https:\/\/(?:homevibe|homevibe-admin)-(?:[a-z0-9]{9}|git-[a-z0-9-]+)-nextech-ds-projects\.vercel\.app$/;

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (PRODUCTION_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin)) return true;
  return process.env.VERCEL_ENV !== "production" && LOCAL_ORIGINS.has(origin);
}
