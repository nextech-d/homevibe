/** Standard square product image widths for catalog + PDP. */
export const PRODUCT_IMAGE_WIDTHS = {
  thumbnail: 400,
  card: 600,
  detail: 1500,
} as const;

export type ProductImageSet = {
  thumbnail: string;
  card: string;
  detail: string;
  gallery: string[];
};

const UNSPLASH_BASE = "https://images.unsplash.com";

function isFullUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
}

/** Square crop URL — supports Unsplash photo ids or full image URLs. */
export function buildSquareImageUrl(photoIdOrUrl: string, width: number): string {
  if (isFullUrl(photoIdOrUrl)) {
    return photoIdOrUrl;
  }
  return `${UNSPLASH_BASE}/${photoIdOrUrl}?auto=format&fit=crop&w=${width}&h=${width}&q=80`;
}

function uniquePhotoIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Primary image is always gallery[0], followed by distinct secondary images. */
export function buildProductImageSet(
  photoId: string,
  galleryPhotoIds?: string[]
): ProductImageSet {
  const primary = photoId.trim();
  const extras = (galleryPhotoIds ?? []).map((id) => id.trim()).filter((id) => id && id !== primary);
  const galleryIds = uniquePhotoIds(primary ? [primary, ...extras] : extras);
  const resolvedGalleryIds = galleryIds.length > 0 ? galleryIds : primary ? [primary] : [];

  return {
    thumbnail: buildSquareImageUrl(photoId, PRODUCT_IMAGE_WIDTHS.thumbnail),
    card: buildSquareImageUrl(photoId, PRODUCT_IMAGE_WIDTHS.card),
    detail: buildSquareImageUrl(photoId, PRODUCT_IMAGE_WIDTHS.detail),
    gallery: resolvedGalleryIds.map((id) =>
      buildSquareImageUrl(id, PRODUCT_IMAGE_WIDTHS.detail)
    ),
  };
}

type ImageSource = { imageSet?: ProductImageSet; image: string };

export function getProductThumbnail(source: ImageSource): string {
  return source.imageSet?.thumbnail ?? source.image;
}

export function getProductCardImage(source: ImageSource): string {
  return source.imageSet?.card ?? source.image;
}

export function getProductDetailImage(source: ImageSource): string {
  return source.imageSet?.detail ?? source.image;
}

export function getProductGallery(source: ImageSource & { images?: string[] }): string[] {
  return source.imageSet?.gallery ?? source.images ?? [source.image];
}

export const PRODUCT_IMAGE_SIZES = {
  card: "(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw",
  thumbnail: "80px",
  cart: "72px",
  detail: "(min-width: 1024px) 600px, 100vw",
  search: "40px",
} as const;
