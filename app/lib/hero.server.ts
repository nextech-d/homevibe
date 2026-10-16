import "server-only";

import { getPrisma } from "./db";

/**
 * The hero's imagery is an editorial pick, not a query result: the washer is
 * the one product whose catalogue photo is both high-resolution (1920px) and a
 * clean packshot, and each category tile shows one product that reads as the
 * category. Ids, not slugs - slugs get renamed. Everything the page prints
 * (name, price, photo) is still read live from the product.
 *
 * Tile photos are shown at 40px, so any of these sources clears the 2x bar
 * with room to spare (the smallest is 447px).
 */
const HERO_PRODUCT_ID = 25;

/** Shown small, behind the washer, to say the range goes beyond washers: a fridge, a microwave and a dispenser. */
const FRIDGE_PRODUCT_ID = 23;
const MICROWAVE_PRODUCT_ID = 22;
const DISPENSER_PRODUCT_ID = 162;

const TILE_PRODUCT_IDS: Record<string, number> = {
  gym: 115,
  "heating-and-cooling": 163,
  tvs: 50,
  kitchen: 23,
  cleaning: 24,
  others: 118,
};

export type HeroProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
};

export type HeroData = {
  /** Photos for the hero's composition; null unless the fridge and microwave are available. The dispenser is optional. */
  companions: { fridge: string; microwave: string; dispenser: string | null } | null;
  /** Null when the product is gone or the database is unreachable. */
  product: HeroProduct | null;
  /** Category slug to photo. Empty unless every tile has one: photos and icons are never mixed. */
  tilePhotos: Record<string, string>;
};

/** next/image needs a URL or a path; a bare photo id would throw and take the page with it. */
function isImageSource(value: string | undefined): value is string {
  return Boolean(value) && /^(https?:\/\/|\/)/.test(value as string);
}

const EMPTY: HeroData = { product: null, companions: null, tilePhotos: {} };

/**
 * One read-only query for the hero product, its companions and the six tile
 * photos.
 *
 * Nothing to read - no DATABASE_URL (a Preview build), or the product is gone
 * - returns empty data, and the hero shows its static washer instead. A query
 * that fails throws: this page is regenerated in the background, and a render
 * that throws leaves the last good page in place, where an empty hero would
 * have replaced it with a degraded one.
 */
export async function getHeroData(categorySlugs: string[]): Promise<HeroData> {
  if (!process.env.DATABASE_URL) {
    return EMPTY;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return EMPTY;
  }

  const tileEntries = categorySlugs.flatMap((slug) => {
    const id = TILE_PRODUCT_IDS[slug];
    return id === undefined ? [] : [[slug, id] as const];
  });

  try {
    const rows = await prisma.product.findMany({
      where: {
        isPublished: true,
        id: { in: [HERO_PRODUCT_ID, FRIDGE_PRODUCT_ID, MICROWAVE_PRODUCT_ID, DISPENSER_PRODUCT_ID, ...tileEntries.map(([, id]) => id)] },
      },
      select: { id: true, slug: true, name: true, priceKes: true, primaryPhotoId: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    const hero = byId.get(HERO_PRODUCT_ID);
    const photos = tileEntries.map(([slug, id]) => [slug, byId.get(id)?.primaryPhotoId] as const);
    const everyTileHasPhoto =
      categorySlugs.length > 0 &&
      tileEntries.length === categorySlugs.length &&
      photos.every(([, photo]) => isImageSource(photo));

    const fridge = byId.get(FRIDGE_PRODUCT_ID)?.primaryPhotoId;
    const microwave = byId.get(MICROWAVE_PRODUCT_ID)?.primaryPhotoId;
    const dispenser = byId.get(DISPENSER_PRODUCT_ID)?.primaryPhotoId;

    return {
      companions:
        isImageSource(fridge) && isImageSource(microwave)
          ? { fridge, microwave, dispenser: isImageSource(dispenser) ? dispenser : null }
          : null,
      product: hero && isImageSource(hero.primaryPhotoId)
        ? { id: hero.id, slug: hero.slug, name: hero.name, price: hero.priceKes, image: hero.primaryPhotoId }
        : null,
      tilePhotos: everyTileHasPhoto
        ? Object.fromEntries(photos.map(([slug, photo]) => [slug, photo as string]))
        : {},
    };
  } catch (error) {
    throw new Error("Failed to load hero products from database", { cause: error });
  }
}
