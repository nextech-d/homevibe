import type { StaticImageData } from "next/image";
import hisense from "../assets/brand-logos/hisense.png";
import mika from "../assets/brand-logos/mika.png";
import ramtons from "../assets/brand-logos/ramtons.png";
import skyworth from "../assets/brand-logos/skyworth.png";
import tcl from "../assets/brand-logos/tcl.png";
import von from "../assets/brand-logos/von.png";

/**
 * Official logos bundled with the storefront, by brand slug: each taken from
 * the brand's own website (Skyworth's English wordmark from Wikimedia
 * Commons, as skyworth.com only serves it white or with 创维), trimmed to the
 * mark and saved as a transparent PNG.
 *
 * A logo uploaded in the admin (the brand's logoUrl) takes precedence; a
 * brand in neither place shows its name.
 */
export const BUNDLED_BRAND_LOGOS: Record<string, StaticImageData> = {
  hisense,
  mika,
  ramtons,
  skyworth,
  tcl,
  "von-hotpoint": von,
};
