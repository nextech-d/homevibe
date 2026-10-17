/**
 * Builds the homepage's six category tiles (public/categories/*.webp) from
 * catalogue packshots kept in image-originals/categories/ (gitignored):
 *
 *   npx tsx scripts/build-category-tiles.ts
 *
 * Each photo is trimmed to its subject and centred on a white square with the
 * same margin, so every subject fills its circle the same way: its diagonal
 * spans FILL of the tile, which keeps a wide TV and a squat set of footpads
 * equally far from a round edge where matching the longest side made the
 * squat ones look bigger. White, because the tiles sit in the hero's circles
 * with mix-blend-multiply and white is what blends away.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SIZE = 384; // shown at 40-48px, so 3x with room to spare
const FILL = 0.96;

type Tile = {
  slug: string;
  file: string;
  /** Product id and name, for public/credits.txt. */
  source: string;
  /** Part of the photo to use, when it shows more than the one thing. */
  crop?: { left: number; top: number; width: number; height: number };
};

const TILES: Tile[] = [
  // The set's case and barbell crowd a 48px circle; one dumbbell reads as "gym".
  { slug: "gym", file: "115.webp", source: "#115 York Fitness 50kg dumbbell and barbell set", crop: { left: 78, top: 386, width: 110, height: 158 } },
  { slug: "heating-and-cooling", file: "163.jpg", source: "#163 Ramtons 3-bar quartz heater" },
  { slug: "tvs", file: "64.webp", source: "#64 TCL 75T6D 75-inch QLED TV" },
  { slug: "kitchen", file: "31.jpg", source: "#31 Hisense H20MOMS11 20L microwave" },
  { slug: "cleaning", file: "30.jpg", source: "#30 Hisense WFVC6010S 6kg front load washer" },
  { slug: "others", file: "116.jpg", source: "#116 washing machine anti-vibration footpads" },
];

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function build({ slug, file, crop }: Tile) {
  let image = sharp(`image-originals/categories/${file}`).flatten({ background: WHITE });
  // A separate pass: sharp trims before it extracts, so in one pipeline the
  // crop would land on the trimmed image instead of the photo.
  if (crop) image = sharp(await image.extract(crop).toBuffer());
  // Trimmed to the subject: anything within 12 of white counts as background.
  const subject = await image.trim({ background: "#ffffff", threshold: 12 }).toBuffer({ resolveWithObject: true });
  const { width, height } = subject.info;
  const scale = (SIZE * FILL) / Math.hypot(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const fitted = await sharp(subject.data).resize(w, h, { kernel: "lanczos3" }).toBuffer();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: WHITE } })
    .composite([{ input: fitted, left: Math.round((SIZE - w) / 2), top: Math.round((SIZE - h) / 2) }])
    .webp({ quality: 90, effort: 6 })
    .toFile(`public/categories/${slug}.webp`);
  console.log(`${slug}: subject ${width}x${height} -> ${w}x${h} in ${SIZE}px`);
}

async function main() {
  mkdirSync("public/categories", { recursive: true });
  for (const tile of TILES) await build(tile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
