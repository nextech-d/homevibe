import { waitUntil } from "@vercel/functions";
import { getPrisma } from "./db.js";

/**
 * The outcome of the most recent background refresh, kept in site_settings
 * under a key no reader maps, so the admin can show a warning when one fails.
 * The save has already answered by then; this is how the admin finds out.
 */
const PUBLISH_STATUS_KEY = "_storefront_publish_status";

export type PublishStatus = {
  ok: boolean;
  message: string;
  reason: string;
  /** When the refresh started, ISO - the admin compares it with its save. */
  startedAt: string;
  finishedAt: string;
};

async function recordPublishStatus(status: PublishStatus): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const value = JSON.stringify(status);
  await prisma.siteSetting.upsert({
    where: { key: PUBLISH_STATUS_KEY },
    create: { key: PUBLISH_STATUS_KEY, value },
    update: { value },
  });
}

export async function getLastPublishStatus(): Promise<PublishStatus | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const row = await prisma.siteSetting.findUnique({ where: { key: PUBLISH_STATUS_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as PublishStatus;
  } catch {
    return null;
  }
}

/**
 * Refresh the storefront after a write, without making the write wait for it or
 * fail with it. Used by every admin route that changes something the storefront
 * caches - which, since the sitemap is prerendered, means anything that changes
 * the set of URLs or what they contain.
 *
 * waitUntil keeps the function alive until the refresh is done: on Vercel a
 * function can be frozen once it has answered, and a refresh started without
 * it could be cut off with nobody told. The outcome is logged and recorded
 * either way, so a failure reaches the admin as a warning rather than a
 * plain "saved".
 */
export function scheduleStorefrontPublish(reason: string): void {
  const startedAt = new Date().toISOString();
  const run = publishStorefront()
    .then(
      (result): PublishStatus => ({
        ok: true,
        message: result.message,
        reason,
        startedAt,
        finishedAt: new Date().toISOString(),
      }),
      (error): PublishStatus => {
        console.error(`Storefront publish failed after ${reason}:`, error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Storefront refresh failed.",
          reason,
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      }
    )
    .then(recordPublishStatus)
    .catch((error) => {
      console.error(`Could not record the storefront publish status after ${reason}:`, error);
    });
  waitUntil(run);
}

export type PublishResult = {
  revalidated: boolean;
  deployed: boolean;
  message: string;
};

export async function publishStorefront(): Promise<PublishResult> {
  const storefrontUrl = (process.env.STOREFRONT_URL ?? process.env.SITE_URL ?? "").replace(
    /\/$/,
    ""
  );
  const revalidateSecret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim();
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();

  let revalidated = false;
  let deployed = false;
  const notes: string[] = [];

  if (storefrontUrl && revalidateSecret) {
    try {
      const res = await fetch(`${storefrontUrl}/api/revalidate`, {
        method: "POST",
        headers: { "x-revalidate-secret": revalidateSecret },
      });
      if (res.ok) {
        revalidated = true;
        notes.push("cache refreshed");
      } else {
        const text = await res.text();
        notes.push(`cache refresh failed (${res.status}${text ? `: ${text.slice(0, 80)}` : ""})`);
      }
    } catch (error) {
      notes.push(
        `cache refresh error: ${error instanceof Error ? error.message : "request failed"}`
      );
    }
  }

  if (deployHook) {
    try {
      const res = await fetch(deployHook, { method: "POST" });
      if (res.ok) {
        deployed = true;
        notes.push("deploy triggered");
      } else {
        notes.push(`deploy hook failed (${res.status})`);
      }
    } catch (error) {
      notes.push(
        `deploy hook error: ${error instanceof Error ? error.message : "request failed"}`
      );
    }
  }

  if (!revalidated && !deployed) {
    if (!storefrontUrl || !revalidateSecret) {
      if (!deployHook) {
        throw new Error(
          "Storefront publish is not configured. Set STOREFRONT_URL + STOREFRONT_REVALIDATE_SECRET, or VERCEL_DEPLOY_HOOK_URL on the API."
        );
      }
    }
    throw new Error(notes.join("; ") || "Storefront publish failed.");
  }

  return {
    revalidated,
    deployed,
    message: notes.join(" · "),
  };
}
