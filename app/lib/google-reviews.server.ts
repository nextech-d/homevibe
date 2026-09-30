import "server-only";

import {
  buildWriteReviewUrl,
  EMPTY_GOOGLE_REVIEWS,
  isKnowledgeGraphMid,
  type GoogleReview,
  type GoogleReviewsData,
} from "./google-reviews";

/**
 * Places API (New) — Place Details.
 * The field mask is mandatory; omitting it is an error, not a default.
 */
const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";
const FIELD_MASK = "rating,userRatingCount,googleMapsUri,reviews";

/**
 * Google's Places policy forbids retaining review content indefinitely, so this
 * is a short performance cache rather than a store. The place ID is exempt and
 * lives in config. Bump the whole cache with `revalidateTag("google-reviews")`.
 */
export const GOOGLE_REVIEWS_TAG = "google-reviews";
const REVALIDATE_SECONDS = 60 * 60 * 6;

type PlacesText = { text?: string };

type PlacesReview = {
  name?: string;
  rating?: number;
  text?: PlacesText;
  originalText?: PlacesText;
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
};

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

function getApiKey(): string {
  return process.env.GOOGLE_PLACES_API_KEY?.trim() ?? "";
}

function normalizeReview(review: PlacesReview, index: number): GoogleReview | null {
  const text = review.text?.text?.trim() || review.originalText?.text?.trim() || "";
  const author = review.authorAttribution?.displayName?.trim() || "";
  // A review with no author cannot be attributed, and Google requires attribution.
  if (!author) return null;

  return {
    id: review.name?.trim() || `review-${index}`,
    author,
    authorUrl: review.authorAttribution?.uri?.trim() || null,
    authorPhotoUrl: review.authorAttribution?.photoUri?.trim() || null,
    rating: typeof review.rating === "number" ? review.rating : 0,
    text,
    relativeTime: review.relativePublishTimeDescription?.trim() || "",
    googleMapsUri: review.googleMapsUri?.trim() || null,
  };
}

/**
 * Resolves the storefront's Google rating and reviews.
 *
 * Degrades in three steps so the storefront never breaks on misconfiguration:
 *   no place ID  -> nothing renders
 *   place ID only -> the "leave a review" CTA renders, no live data
 *   place ID + key -> full rating, count and review cards
 */
export async function getGoogleReviewsData(): Promise<GoogleReviewsData> {
  const placeId = getPlaceId();
  if (!placeId) return EMPTY_GOOGLE_REVIEWS;

  const base: GoogleReviewsData = {
    ...EMPTY_GOOGLE_REVIEWS,
    configured: true,
    writeReviewUrl: buildWriteReviewUrl(placeId),
  };

  const apiKey = getApiKey();
  if (!apiKey) return base;

  try {
    const res = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      next: { revalidate: REVALIDATE_SECONDS, tags: [GOOGLE_REVIEWS_TAG] },
    });

    if (!res.ok) {
      console.error(`Google Places lookup failed (${res.status}): ${await res.text()}`);
      return base;
    }

    const data = (await res.json()) as PlacesResponse;
    const reviews = (data.reviews ?? [])
      .map(normalizeReview)
      .filter((review): review is GoogleReview => review !== null);

    return {
      ...base,
      live: true,
      rating: typeof data.rating === "number" ? data.rating : null,
      userRatingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
      googleMapsUri: data.googleMapsUri?.trim() || null,
      reviews,
    };
  } catch (error) {
    console.error("Google Places lookup failed.", error);
    return base;
  }
}
