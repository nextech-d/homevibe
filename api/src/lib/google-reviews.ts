/**
 * Google Places (New) — Place Details lookup for the storefront reviews section.
 *
 * Google's Places policy forbids retaining review content indefinitely, so the
 * cache below is a short-lived performance buffer (it also keeps the billed
 * call count down), never a store. The place ID itself is exempt and lives in
 * config.
 */
const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";
const FIELD_MASK = "rating,userRatingCount,googleMapsUri,reviews";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

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
  configured: boolean;
  live: boolean;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  writeReviewUrl: string | null;
  reviews: GoogleReview[];
};

const EMPTY: GoogleReviewsData = {
  configured: false,
  live: false,
  rating: null,
  userRatingCount: null,
  googleMapsUri: null,
  writeReviewUrl: null,
  reviews: [],
};

type PlacesText = { text?: string };

type PlacesReview = {
  name?: string;
  rating?: number;
  text?: PlacesText;
  originalText?: PlacesText;
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
};

/**
 * A Knowledge Graph MID — the `kgmid=/g/...` in a Google share/search link.
 * It looks like an ID but the Places API rejects it, so it must never be used
 * as GOOGLE_PLACE_ID.
 */
export function isKnowledgeGraphMid(value: string): boolean {
  return /^\/[gm]\//.test(value);
}

function getPlaceId(): string {
  const placeId = process.env.GOOGLE_PLACE_ID?.trim() ?? "";
  if (placeId && isKnowledgeGraphMid(placeId)) {
    console.error(
      `GOOGLE_PLACE_ID is set to "${placeId}", which is a Knowledge Graph MID, not a Place ID. ` +
        'Resolve the real ID with: npx tsx scripts/find-place-id.ts "HomeVibe Nairobi"'
    );
    return "";
  }
  return placeId;
}

export function buildWriteReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function normalizeReview(review: PlacesReview, index: number): GoogleReview | null {
  const author = review.authorAttribution?.displayName?.trim() || "";
  // Google requires author attribution; drop anything we cannot attribute.
  if (!author) return null;

  return {
    id: review.name?.trim() || `review-${index}`,
    author,
    authorUrl: review.authorAttribution?.uri?.trim() || null,
    authorPhotoUrl: review.authorAttribution?.photoUri?.trim() || null,
    rating: typeof review.rating === "number" ? review.rating : 0,
    text: review.text?.text?.trim() || review.originalText?.text?.trim() || "",
    relativeTime: review.relativePublishTimeDescription?.trim() || "",
    googleMapsUri: review.googleMapsUri?.trim() || null,
  };
}

let cache: { expiresAt: number; data: GoogleReviewsData } | null = null;

/**
 * Degrades in three steps so the storefront never breaks on misconfiguration:
 *   no place ID    -> nothing renders
 *   place ID only  -> "leave a review" CTA renders, no live data
 *   place ID + key -> full rating, count and review cards
 */
export async function getGoogleReviews(): Promise<GoogleReviewsData> {
  const placeId = getPlaceId();
  if (!placeId) return EMPTY;

  const base: GoogleReviewsData = {
    ...EMPTY,
    configured: true,
    writeReviewUrl: buildWriteReviewUrl(placeId),
  };

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() ?? "";
  if (!apiKey) return base;

  if (cache && cache.expiresAt > Date.now()) return cache.data;

  try {
    const res = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
    });

    if (!res.ok) {
      console.error(`Google Places lookup failed (${res.status}): ${await res.text()}`);
      return base;
    }

    const data = (await res.json()) as PlacesResponse;
    const reviews = (data.reviews ?? [])
      .map(normalizeReview)
      .filter((review): review is GoogleReview => review !== null);

    const resolved: GoogleReviewsData = {
      ...base,
      live: true,
      rating: typeof data.rating === "number" ? data.rating : null,
      userRatingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
      googleMapsUri: data.googleMapsUri?.trim() || null,
      reviews,
    };

    cache = { expiresAt: Date.now() + CACHE_TTL_MS, data: resolved };
    return resolved;
  } catch (error) {
    console.error("Google Places lookup failed.", error);
    return base;
  }
}
