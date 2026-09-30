/**
 * Resolves a Google Place ID from a business name, for GOOGLE_PLACE_ID.
 *
 * A Knowledge Graph MID (the `kgmid=/g/...` in a Google share link) is NOT a
 * Place ID and is rejected by the Places API, so the ID has to be looked up.
 *
 *   npx tsx scripts/find-place-id.ts "HomeVibe Nairobi"
 *
 * Reads GOOGLE_PLACES_API_KEY from .env.local (or the environment).
 */
import { config } from "dotenv";

// Next loads .env.local automatically; a standalone script does not.
config({ path: ".env.local" });

const SEARCH_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri";

type SearchResult = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
  }>;
};

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error('Usage: npx tsx scripts/find-place-id.ts "Business Name City"');
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "GOOGLE_PLACES_API_KEY is not set. Add it to .env.local, or pass it inline:\n" +
        '  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/find-place-id.ts "HomeVibe Nairobi"'
    );
    process.exit(1);
  }

  const res = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) {
    console.error(`Places search failed (${res.status}):\n${await res.text()}`);
    process.exit(1);
  }

  const data = (await res.json()) as SearchResult;
  const places = data.places ?? [];
  if (places.length === 0) {
    console.log(`No places matched "${query}". Try adding the town or street.`);
    return;
  }

  console.log(`\nMatches for "${query}":\n`);
  places.forEach((place, index) => {
    const rating =
      typeof place.rating === "number"
        ? `${place.rating} stars (${place.userRatingCount ?? 0} reviews)`
        : "no rating yet";
    console.log(`${index + 1}. ${place.displayName?.text ?? "Unnamed"} — ${rating}`);
    console.log(`   ${place.formattedAddress ?? "no address"}`);
    console.log(`   GOOGLE_PLACE_ID=${place.id ?? "unknown"}`);
    if (place.googleMapsUri) console.log(`   ${place.googleMapsUri}`);
    console.log("");
  });

  console.log("Copy the GOOGLE_PLACE_ID line for the correct business into .env.local.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
