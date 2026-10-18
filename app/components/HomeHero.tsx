import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CookingPot,
  Dumbbell,
  LayoutGrid,
  ShieldCheck,
  Smartphone,
  ThermometerSnowflake,
  Truck,
  Tv,
  WashingMachine,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import HeroCategoryNav from "./HeroCategoryNav";
import { raisedSurfaceFromSm } from "./homeSurfaces";
import WhatsAppIcon from "./WhatsAppIcon";
import { SITE, TRUST_BADGES } from "../config/site";
import { categoryHref } from "../data/categories";
import { productHref } from "../data/products";
import { getAllCategories } from "../lib/categories.server";
import { formatPrice } from "../lib/formatPrice";
import type { Appliance } from "../lib/inventory";
import { getPublishedProduct } from "../lib/inventory.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";

/**
 * Catalogue packshots, as files: a copy sized and trimmed for the hero rather
 * than the product's own photo URL. Each links to its product, whose name and
 * price come from the catalogue (HERO_PRODUCT_IDS). The fridge, TV, microwave and vacuum are
 * trimmed to the product; the washer's file is the whole 1920px square, so its
 * frame is sized from where the machine sits in it (1211x1707 at 355,116).
 */
const WASHER_IMAGE = "/hero/hisense-wd3q1043bt.webp";
const FRIDGE_IMAGE = "/hero/von-vrt-125drag-fridge.webp"; // 760x1784, transparent
const TV_IMAGE = "/hero/tcl-85c8l-tv.webp"; // 1340x805, transparent
const MICROWAVE_IMAGE = "/hero/von-vams-20dgb-microwave.webp"; // 1014x550, transparent
const VACUUM_IMAGE = "/hero/ramtons-wet-dry-vacuum.webp"; // 594x612, white

/** The products the photos are of. Replace a photo, change its id here. */
const HERO_PRODUCT_IDS = { fridge: 129, washer: 25, tv: 66, microwave: 126, vacuum: 124 } as const;

/** Widths as fractions of the photo band, which is 3:2 beside the text, 2:1 on a tablet and 16:9 on a phone. */
const heroSizes = (desktop: number, tablet: number, phone: number) =>
  `(min-width: 1024px) calc((min(100vw, 1280px) - 8.5rem) * ${desktop}), (min-width: 640px) calc((100vw - 5.5rem) * ${tablet}), calc((100vw - 3rem) * ${phone})`;

/**
 * One packshot per category, trimmed and centred alike by
 * scripts/build-category-tiles.ts. A category without one - added after this
 * set was made - shows its icon instead.
 */
const TILE_IMAGES: Record<string, string> = {
  gym: "/categories/gym.webp",
  "heating-and-cooling": "/categories/heating-and-cooling.webp",
  tvs: "/categories/tvs.webp",
  kitchen: "/categories/kitchen.webp",
  cleaning: "/categories/cleaning.webp",
  others: "/categories/others.webp",
};

const HEADLINE = "Washers, fridges and TVs, delivered free in Nairobi";
const SUPPORTING_LINE =
  "Hisense, TCL, Ramtons and Von, and delivery within 24 hours countrywide. Our own technicians install in Nairobi and service what we sell.";

/** The header's accent and focus ring, so the hero and the nav read as one. */
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]";

/**
 * The band and the circles' shadows. Option A, cool and neutral; the warm
 * alternative is bg #F1EFEC, edge #E3DDD3, shade rgba(140, 98, 57, 0.18).
 */
const HERO_THEME = {
  "--hero-bg": "#EDEFF3",
  "--hero-edge": "#DCE0E7",
  "--hero-shade": "rgba(112, 122, 142, 0.26)",
} as CSSProperties;

/**
 * Soft neumorphism, for the category circles only: a white highlight top-left
 * and a low-opacity shade bottom-right, on the band's own colour. The hairline,
 * in the accent like the product tags, keeps an edge where the shadows alone
 * would not.
 */
const raised =
  "border border-[#a85414] bg-[var(--hero-bg)] shadow-[-4px_-4px_12px_rgba(255,255,255,0.9),4px_4px_12px_var(--hero-shade)]";

/** Pressed in: on tap or click (:active), and while Enter is held (data-pressed). */
const pressable =
  "group-active:shadow-[inset_3px_3px_8px_var(--hero-shade),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] group-data-pressed:shadow-[inset_3px_3px_8px_var(--hero-shade),inset_-3px_-3px_8px_rgba(255,255,255,0.9)]";

/** A soft oval of shade where a product meets the floor. */
const floorShadow =
  "pointer-events-none absolute rounded-[50%] bg-[radial-gradient(closest-side,rgba(30,36,48,0.22),transparent)]";

const TRUST_ICONS = [Truck, ShieldCheck, Wrench, Smartphone] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gym: Dumbbell,
  "heating-and-cooling": ThermometerSnowflake,
  tvs: Tv,
  kitchen: CookingPot,
  cleaning: WashingMachine,
};

/**
 * One photo of the group, as a link to its product - or, if it's unpublished,
 * just the photo. From 1024px its name and price are always shown, in a
 * small white tag outlined in the accent, placed per product
 * (labelClassName) so the five don't collide; hover or keyboard focus tints
 * it the page's grey. On a phone or tablet there's no tag - in the smaller band five would cover
 * the photos - and it's only tappable. The tag is absolute and the link's
 * box is the photo's own, so neither moves anything. The before: box holds
 * the tap area to at least 44px however small the photo is drawn. The
 * className places it in the group, so it carries the position.
 */
function HeroProduct({
  product,
  className,
  labelClassName,
  children,
}: {
  product: Appliance | null;
  className: string;
  labelClassName: string;
  children: ReactNode;
}) {
  if (!product) return <div className={className}>{children}</div>;
  const price = formatPrice(product.price);
  return (
    <Link
      href={productHref(product)}
      aria-label={`${product.name}, ${price}`}
      className={`group/product block rounded-lg before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${focusRing} ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-10 hidden w-max max-w-32 rounded-md border border-[#a85414] bg-white px-2 py-1 text-[10px] leading-tight shadow-[0_2px_6px_var(--hero-shade)] transition-colors duration-150 group-hover/product:bg-[var(--hero-bg)] group-focus-visible/product:bg-[var(--hero-bg)] motion-reduce:transition-none lg:block ${labelClassName}`}
      >
        <span className="line-clamp-2 font-medium text-neutral-800">{product.name}</span>
        <span className="mt-px block font-bold tabular-nums text-neutral-950 group-hover/product:text-[#8f4710]">{price}</span>
      </span>
    </Link>
  );
}

const buttonBase = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors sm:w-auto ${focusRing}`;

/**
 * Server-rendered end to end, from the layout's own memoised queries (the
 * categories and site settings) and the pictured products, for their links
 * and labels.
 *
 * On a phone it stacks headline, line and buttons, then the photo as a 16:9
 * band - so the headline, the main button and the top of the photo share the
 * first screen - then the badges and one swipeable row of categories. From
 * 1024px the text, badges and categories take the left column and the photo
 * the right, as before.
 *
 * The section paints a full-bleed band with a box-shadow (which never adds
 * scrollable width, unlike a 100vw box) and pulls up over the page's top
 * padding so no cooler strip shows between it and the header.
 */
export default async function HomeHero() {
  const [siteSettings, categories, fridge, washer, tv, microwave, vacuum] = await Promise.all([
    getSiteSettingsData(),
    getAllCategories(),
    getPublishedProduct(HERO_PRODUCT_IDS.fridge),
    getPublishedProduct(HERO_PRODUCT_IDS.washer),
    getPublishedProduct(HERO_PRODUCT_IDS.tv),
    getPublishedProduct(HERO_PRODUCT_IDS.microwave),
    getPublishedProduct(HERO_PRODUCT_IDS.vacuum),
  ]);
  const whatsappUrl = buildWhatsAppUrl("Hi, I'd like to place an order.", siteSettings.whatsapp);

  return (
    <section style={HERO_THEME} className="relative -mt-12 mb-12 bg-[var(--hero-bg)] pb-8 pt-8 [box-shadow:0_0_0_100vmax_var(--hero-bg)] [clip-path:inset(0_-100vmax)] sm:pt-12 lg:pt-14">
      {/* The same white panel as the sections below it, from 640px up, at half
          their inset. */}
      <div className={`${raisedSurfaceFromSm} grid grid-cols-[minmax(0,1fr)] gap-6 sm:gap-8 sm:p-5 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-rows-[auto_auto_auto] lg:gap-x-12 lg:gap-y-6`}>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
          <h1 className="max-w-[16ch] text-balance text-[2rem] font-medium leading-[1.08] tracking-tight text-neutral-950 sm:text-4xl md:max-w-[20ch] md:text-5xl lg:max-w-[18ch]">
            {HEADLINE}
          </h1>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[#57534e] sm:mt-4 sm:text-lg">{SUPPORTING_LINE}</p>

          <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row">
            <Link
              href={categoryHref("cleaning", "laundry")}
              className={`${buttonBase} bg-[#a85414] text-white hover:bg-[#8f4710]`}
            >
              Shop washing machines
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} border-2 border-[#a85414] text-[#8f4710] hover:bg-[#a85414]/10`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Order on WhatsApp
            </a>
          </div>
          <p className="mt-3 text-sm text-[#57534e]">
            or call{" "}
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              className={`inline-block rounded py-3 font-medium text-neutral-900 underline decoration-[#DCE0E7] underline-offset-4 hover:decoration-[#a85414] sm:py-0 ${focusRing}`}
            >
              {SITE.phone}
            </a>
          </p>
        </div>

        {/* The group's own area, with no box of its own: it stands on the
            hero's panel (on a phone, the page), with only its floor and
            shadows round it. A fixed ratio on a phone and tablet, so the
            space is held before the photos arrive: 16:9 (about 185px of an
            812px screen), then 2:1. Beside the text it runs from the
            headline's top to the category row's foot instead (the three rows
            it spans).

            Inside, a little stage in three rows, laid out in metres: the TV
            at the back, drawn at 80% with its stand at 0.65m; the fridge
            (the microwave on top) and the washer in the middle row,
            overlapping its edges; the vacuum stepped forward on a front row,
            0.13m lower, just under the TV's stand. Otherwise at their real
            sizes relative to each other - TV on its stand about 1.15m tall,
            fridge 1.13m, washer 0.85m, the vacuum with its hose 0.78m, the
            microwave 0.26m - and each whole, never cropped. The group's box
            is 2.15m by 1.70m (1.27:1): 88% of the panel's width, or 82% of
            its height if that's tighter (cq units: the panel is a size
            container). A soft floor runs back to the TV's stand, and a
            contact shadow under each sets it on that floor. */}
        <div className="relative aspect-[16/9] w-full [container-type:size] sm:aspect-[2/1] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:aspect-auto lg:self-stretch">
          {/* Centred with flexbox, not a transform: a transformed parent
              would isolate the vacuum's multiply blend. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-[127/100] w-[min(88cqw,104cqh)]">
              {/* The floor, from the TV's stand to the front, fading out at
                  the sides: what makes the TV read as further back rather
                  than floating. */}
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-[7%] -left-[8%] -right-[8%] top-[54%] bg-[linear-gradient(to_bottom,transparent,rgba(214,219,228,0.75)_55%,transparent)] [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]" />
              <span aria-hidden="true" className={`${floorShadow} bottom-[43.4%] left-[37%] h-[5%] w-[25%] opacity-70`} />
              <span aria-hidden="true" className={`${floorShadow} bottom-[5.1%] left-[-2%] h-[6%] w-[26%]`} />
              <span aria-hidden="true" className={`${floorShadow} -bottom-[1.5%] left-[50%] h-[4.5%] w-[15%]`} />
              <span aria-hidden="true" className={`${floorShadow} bottom-[5.1%] right-[-2%] h-[6%] w-[32%]`} />

              <HeroProduct product={tv} labelClassName="bottom-full left-1/2 mb-2 -translate-x-1/2" className="absolute left-[13.9%] top-0 aspect-[1340/805] w-[71.2%]">
                <Image
                  src={TV_IMAGE}
                  alt=""
                  fill
                  sizes={heroSizes(0.3, 0.37, 0.42)}
                  quality={90}
                  // Preloaded from the head, and the only one: it's the
                  // largest. fetchPriority="high" on the <img> instead was no
                  // faster in Lighthouse on mobile and slower on desktop: it
                  // put the photo up against the fonts and CSS.
                  preload
                  className="object-contain"
                />
              </HeroProduct>
              <HeroProduct product={fridge} labelClassName="bottom-[12%] -left-[40%]" className="absolute bottom-[7.6%] left-0 aspect-[760/1784] h-[66.5%]">
                <Image
                  src={FRIDGE_IMAGE}
                  alt=""
                  fill
                  sizes={heroSizes(0.095, 0.12, 0.13)}
                  quality={90}
                  className="object-contain object-bottom"
                />
              </HeroProduct>
              <HeroProduct product={microwave} labelClassName="bottom-full -left-[42%] mb-2" className="absolute bottom-[74.1%] left-0 aspect-[1014/550] w-[22.2%]">
                <Image
                  src={MICROWAVE_IMAGE}
                  alt=""
                  fill
                  sizes={heroSizes(0.095, 0.12, 0.13)}
                  quality={90}
                  className="object-contain object-bottom"
                />
              </HeroProduct>
              {/* Its top stops at the TV's stand, so the multiply only ever
                  meets the panel and the floor. */}
              <HeroProduct product={vacuum} labelClassName="left-1/2 top-full mt-2 -translate-x-1/2" className="absolute bottom-0 left-[32.5%] aspect-[594/612] h-[45.9%]">
                <Image
                  src={VACUUM_IMAGE}
                  alt=""
                  fill
                  sizes={heroSizes(0.15, 0.185, 0.21)}
                  quality={90}
                  className="object-contain object-bottom mix-blend-multiply"
                />
              </HeroProduct>
              {/* The machine's own box, with the square photo laid over it and
                  clipped to the machine, so the photo's white frame can't
                  cover the TV behind. Multiplied, so the white between its
                  feet takes the floor's grey - over white everywhere above
                  the feet, so the TV can't show through the machine. */}
              <HeroProduct product={washer} labelClassName="bottom-full right-0 mb-2" className="absolute bottom-[7.6%] right-0 aspect-[1211/1707] h-[50%]">
                <div className="absolute inset-0 overflow-hidden rounded-[1.2%/0.85%]">
                  <div className="absolute inset-x-0 bottom-[2%] top-0 bg-white" />
                  <div className="absolute left-[-29.3%] top-[-6.8%] h-[112.5%] w-[158.5%]">
                    <Image
                      src={WASHER_IMAGE}
                      alt=""
                      fill
                      sizes={heroSizes(0.185, 0.23, 0.26)}
                      quality={90}
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
              </HeroProduct>
            </div>
          </div>
        </div>

        {/* Each point on one line. Two across, each column as wide as its
            own longest point, need about 560px, so they pair up only where
            there's that much room - from 768px, and beside the photo from
            1280px - and stack in one column elsewhere. */}
        <ul className="grid w-max max-w-full grid-cols-1 gap-x-6 gap-y-3 whitespace-nowrap max-[359px]:whitespace-normal text-[13px] font-medium leading-snug text-[#57534e] md:grid-cols-[auto_auto] lg:col-start-1 lg:row-start-2 lg:grid-cols-1 xl:grid-cols-[auto_auto]">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <li key={badge.label} className="flex items-start gap-2">
                <Icon aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-[#a85414]" strokeWidth={1.8} />
                {badge.label}
              </li>
            );
          })}
        </ul>

        {/* Three to a row on a phone, so every circle shows whole - a swiped
            row cut the last one off at the screen's edge - and one wrapped row
            from 640px, where all six fit. */}
        <HeroCategoryNav className="grid grid-cols-3 justify-items-center gap-x-3 gap-y-4 pt-1 sm:flex sm:flex-wrap sm:justify-items-stretch sm:gap-x-6 sm:gap-y-5 lg:col-start-1 lg:row-start-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? LayoutGrid;
            const photo = TILE_IMAGES[category.slug];
            return (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                className={`group flex w-[5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl text-center text-xs font-semibold leading-tight text-neutral-900 sm:w-[4.5rem] sm:gap-2 ${focusRing}`}
              >
                <span
                  className={`${raised} flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-shadow duration-150 sm:h-[4.5rem] sm:w-[4.5rem] ${pressable}`}
                >
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      width={60}
                      height={60}
                      quality={90}
                      className="h-12 w-12 object-contain mix-blend-multiply sm:h-[3.75rem] sm:w-[3.75rem]"
                    />
                  ) : (
                    <Icon aria-hidden="true" className="h-6 w-6 text-neutral-700" strokeWidth={1.7} />
                  )}
                </span>
                {category.navLabel || category.label}
              </Link>
            );
          })}
        </HeroCategoryNav>
      </div>
    </section>
  );
}
