import type { CSSProperties } from "react";
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
import { TRUST_BADGES } from "../config/site";
import { categoryHref } from "../data/categories";
import { getAllCategories } from "../lib/categories.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";

/**
 * Catalogue packshots, as files rather than queries: the hero shows no name or
 * price, so there's nothing to keep in step with the catalogue. The fridge and
 * dispenser are trimmed to the product; the washer's file is the whole
 * 1920px square, so its frame is sized from where the machine sits in it
 * (1211x1707 at 355,116).
 */
const WASHER_IMAGE = "/hero/hisense-wd3q1043bt.webp";
const FRIDGE_IMAGE = "/hero/von-vrt-125drag-fridge.webp"; // 760x1784, transparent
const DISPENSER_IMAGE = "/hero/ramtons-water-dispenser.webp"; // 242x640, white

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
  "Hisense, TCL, Ramtons and Von, with delivery countrywide. Our own technicians install in Nairobi and service what we sell.";

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
 * and a low-opacity shade bottom-right, on the band's own colour. The hairline
 * keeps an edge where the shadows alone would not.
 */
const raised =
  "border border-[var(--hero-edge)] bg-[var(--hero-bg)] shadow-[-4px_-4px_12px_rgba(255,255,255,0.9),4px_4px_12px_var(--hero-shade)]";

/** Pressed in: on tap or click (:active), and while Enter is held (data-pressed). */
const pressable =
  "group-active:shadow-[inset_3px_3px_8px_var(--hero-shade),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] group-data-pressed:shadow-[inset_3px_3px_8px_var(--hero-shade),inset_-3px_-3px_8px_rgba(255,255,255,0.9)]";

const TRUST_ICONS = [Truck, ShieldCheck, Wrench, Smartphone] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gym: Dumbbell,
  "heating-and-cooling": ThermometerSnowflake,
  tvs: Tv,
  kitchen: CookingPot,
  cleaning: WashingMachine,
};

const buttonBase = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors sm:w-auto ${focusRing}`;

/**
 * Server-rendered end to end, from the layout's own memoised queries (the
 * categories and site settings): the photos are files, so the hero reads
 * nothing of its own from the database.
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
  const [siteSettings, categories] = await Promise.all([getSiteSettingsData(), getAllCategories()]);
  const whatsappUrl = buildWhatsAppUrl("Hi, I'd like to place an order.", siteSettings.whatsapp);

  return (
    <section style={HERO_THEME} className="relative -mt-12 mb-12 bg-[var(--hero-bg)] pb-8 pt-8 [box-shadow:0_0_0_100vmax_var(--hero-bg)] [clip-path:inset(0_-100vmax)] sm:pt-12 lg:pt-14">
      {/* The same white panel as the sections below it, from 640px up, at half
          their inset. */}
      <div className={`${raisedSurfaceFromSm} grid gap-6 sm:gap-8 sm:p-5 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-rows-[auto_auto_auto] lg:gap-x-12 lg:gap-y-6`}>
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
        </div>

        {/* A white panel round the three, with the category circles' hairline
            and shadow, so they read as one group - a box within the hero's own
            panel from 640px; the photos' own white backgrounds disappear into it. A fixed ratio on a
            phone and tablet, so the space is held before the photos arrive:
            16:9 (about 185px of an 812px screen), then 2:1. Beside the text
            it runs from the headline's top to the category row's foot
            instead (the three rows it spans).

            Inside, the group's own box: as tall as the fridge and as wide as
            the three plus two gaps (1.37:1), at 82% of whichever way the
            panel is tighter (cq units: the panel is a size container), so
            the margins are about 9% all round. Never over 496px wide: that
            keeps the dispenser, the smallest photo (640px tall), within 2x
            of its own pixels. On one baseline at their real heights relative
            to each other - fridge about 1.13m, dispenser 1.0m, washer 0.85m.
            A gap rather than an overlap: the washer is multiplied, so the
            fridge would show through it. Each is whole, never cropped. */}
        <div className="relative aspect-[16/9] w-full rounded-3xl border border-[var(--hero-edge)] bg-white shadow-[-4px_-4px_12px_rgba(255,255,255,0.9),4px_4px_12px_var(--hero-shade)] [container-type:size] sm:aspect-[2/1] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:aspect-auto lg:self-stretch">
          {/* Centred with flexbox, not a transform: a transformed parent would
              isolate the multiply blend and leave the white backgrounds showing. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-[137/100] w-[min(82cqw,112cqh)] max-w-[496px]">
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="relative aspect-[760/1784] h-full">
                  <Image
                    src={FRIDGE_IMAGE}
                    alt=""
                    fill
                    sizes={heroSizes(0.12, 0.17, 0.2)}
                    quality={90}
                    className="object-contain object-bottom"
                  />
                </div>
                {/* The machine's own box (0.85 / 1.13 of the fridge), with the
                    square photo laid over it so the frame round the machine
                    hangs outside. */}
                <div className="relative ml-[2.9%] aspect-[1211/1707] h-[75.2%]">
                  <div className="absolute left-[-29.3%] top-[-6.8%] h-[112.5%] w-[158.5%]">
                    <Image
                      src={WASHER_IMAGE}
                      alt="Hisense front load washing machine, with a fridge and a water dispenser"
                      fill
                      sizes={heroSizes(0.23, 0.34, 0.39)}
                      quality={90}
                      // Preloaded from the head, and the only one: it's the
                      // largest of the three. fetchPriority="high" on the <img>
                      // instead was no faster in Lighthouse on mobile and slower
                      // on desktop: it put the photo up against the fonts and CSS.
                      preload
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
                <div className="relative ml-[2.9%] aspect-[242/640] h-[88.5%]">
                  <Image
                    src={DISPENSER_IMAGE}
                    alt=""
                    fill
                    sizes={heroSizes(0.1, 0.14, 0.16)}
                    quality={90}
                    className="object-contain object-bottom mix-blend-multiply"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid max-w-md grid-cols-2 gap-x-4 gap-y-3 text-[13px] font-medium leading-snug text-[#57534e] lg:col-start-1 lg:row-start-2">
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

        {/* One row on a phone, swiped sideways - two rows of 72px circles took
            a third of the screen - and wrapped from 640px, where all six fit.
            The row runs to the screen's edges (-mx-6 px-6) so a cut-off circle
            says there's more; the page itself never scrolls sideways. */}
        <HeroCategoryNav className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-x-6 sm:gap-y-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:col-start-1 lg:row-start-3 [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? LayoutGrid;
            const photo = TILE_IMAGES[category.slug];
            return (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                className={`group flex w-[4.25rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl text-center text-xs font-semibold leading-tight text-neutral-900 sm:w-[4.5rem] sm:gap-2 ${focusRing}`}
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
