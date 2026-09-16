/**
 * Runtime guard if env was changed after build (should not happen on Vercel).
 * Production builds already fail in next.config.ts when NEXT_PUBLIC_API_URL is missing.
 */
export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) return;

  const banner =
    "FATAL: NEXT_PUBLIC_API_URL is unset — checkout cannot proxy orders to the API.";
  console.error("\n" + "=".repeat(72));
  console.error(banner);
  console.error("Set NEXT_PUBLIC_API_URL on the shop project and redeploy.");
  console.error("=".repeat(72) + "\n");
}
