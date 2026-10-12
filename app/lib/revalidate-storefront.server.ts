import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { GOOGLE_REVIEWS_TAG } from "./google-reviews.server";

/**
 * Refreshes everything the storefront caches. One function, so the publish
 * endpoint the standalone API calls (/api/revalidate) and the storefront's own
 * admin routes refresh exactly the same set - a write through either admin
 * shows on the live site the same way.
 *
 * The "/" layout path covers every page under the root layout, product pages
 * included; the rest are named for clarity and for the sitemap.
 */
export function revalidateStorefront(): void {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/faq");
  revalidatePath("/blog");
  revalidatePath("/articles");
  revalidatePath("/sitemap.xml");
  revalidateTag(GOOGLE_REVIEWS_TAG, "max");
}
