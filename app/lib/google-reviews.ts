import { apiUrl } from "./api-client";

export type GoogleReview = {
  id: string;
  author: string;
  authorUrl: string | null;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  googleMapsUri: string | null;
};

export type GoogleReviewsData = {
  /** True once a place ID is configured — the "leave a review" CTA needs only this. */
  configured: boolean;
  /** True when the Places API key is also set and the live lookup succeeded. */
  live: boolean;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  writeReviewUrl: string | null;
  reviews: GoogleReview[];
};

export const EMPTY_GOOGLE_REVIEWS: GoogleReviewsData = {
  configured: false,
  live: false,
  rating: null,
  userRatingCount: null,
  googleMapsUri: null,
  writeReviewUrl: null,
  reviews: [],
};

/**
 * A Knowledge Graph MID — the `kgmid=/g/...` in a Google share/search link.
 * It looks like an ID but the Places API rejects it, so it must never be used
 * as GOOGLE_PLACE_ID.
 */
export function isKnowledgeGraphMid(value: string): boolean {
  return /^\/[gm]\//.test(value);
}

/**
 * Deep link to the Google review composer for a place.
 * Free and key-less — this is the whole "collect reviews" half of the feature.
 */
export function buildWriteReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

export async function fetchGoogleReviewsClient(): Promise<GoogleReviewsData> {
  const endpoint = apiUrl("/storefront/reviews") || "/api/storefront/reviews";
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return EMPTY_GOOGLE_REVIEWS;
    const data = (await res.json()) as { success?: boolean; reviews?: GoogleReviewsData };
    if (data.success && data.reviews) return data.reviews;
    return EMPTY_GOOGLE_REVIEWS;
  } catch {
    return EMPTY_GOOGLE_REVIEWS;
  }
}
