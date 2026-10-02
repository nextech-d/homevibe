/**
 * Refresh the storefront after a write, without making the write wait for it or
 * fail with it. Used by every admin route that changes something the storefront
 * caches - which, since the sitemap is prerendered, means anything that changes
 * the set of URLs or what they contain.
 */
export function scheduleStorefrontPublish(reason: string): void {
  void publishStorefront().catch((error) => {
    console.error(`Storefront publish failed after ${reason}:`, error);
  });
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
