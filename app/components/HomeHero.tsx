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
import { productHref } from "../data/products";
import { getAllCategories } from "../lib/categories.server";
import { formatPrice } from "../lib/formatPrice";
import { getHeroData } from "../lib/hero.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";

/** A copy of the washer's catalogue photo (1920px, as stored), for when the database has nothing to show. */
const FALLBACK_IMAGE = "/hero/hisense-wd3q1043bt.webp";

const HEADLINE = "Washers, fridges and TVs, delivered free in Nairobi";
const SUPPORTING_LINE =
  "Hisense, TCL, Ramtons and Von, with delivery countrywide. Our own technicians install and service what we sell.";

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
 * Server-rendered end to end. The categories and site settings are the
 * layout's own memoised queries; the hero adds one read of its own, for the
 * washer and the six tile photos.
 *
 * The section paints a full-bleed band with a box-shadow (which never adds
 * scrollable width, unlike a 100vw box) and pulls up over the page's top
 * padding so no cooler strip shows between it and the header.
 */
export default async function HomeHero() {
  const [siteSettings, categories] = await Promise.all([getSiteSettingsData(), getAllCategories()]);
  const { product, companions, tilePhotos } = await getHeroData(categories.map((category) => category.slug));
  const whatsappUrl = buildWhatsAppUrl("Hi, I'd like to place an order.", siteSettings.whatsapp);

  const washer = (
    <Image
      src={product?.image ?? FALLBACK_IMAGE}
      alt={product?.name ?? "Hisense front load washing machine"}
      fill
      sizes="(min-width: 1024px) calc((min(100vw, 1280px) - 4.5rem) * 0.45 * 0.8), min(21rem, calc(100vw - 3rem))"
      quality={90}
      className="object-contain mix-blend-multiply"
      preload
    />
  );

  return (
    <section style={HERO_THEME} className="relative -mt-12 mb-12 bg-[var(--hero-bg)] pb-8 pt-12 [box-shadow:0_0_0_100vmax_var(--hero-bg)] [clip-path:inset(0_-100vmax)] lg:pt-14">
      {/* The same white panel as the sections below it, from 640px up, at half
          their inset. */}
      <div className={`${raisedSurfaceFromSm} grid items-center gap-8 sm:p-5 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:content-center lg:gap-x-12 lg:gap-y-6`}>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1 className="max-w-[16ch] text-balance text-4xl font-medium leading-[1.08] tracking-tight text-neutral-950 md:max-w-[20ch] md:text-5xl lg:max-w-[18ch]">
            {HEADLINE}
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-[#57534e]">{SUPPORTING_LINE}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          <ul className="mt-6 grid max-w-md grid-cols-2 gap-x-4 gap-y-3 text-[13px] font-medium leading-snug text-[#57534e]">
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
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-[26rem] transition-[translate] duration-700 ease-out starting:translate-y-3 motion-reduce:transition-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:aspect-[5/4] lg:max-w-[960px]">
          {product && companions && (
            <>
              {companions.dispenser && (
                <div className="absolute -left-[21%] bottom-0 aspect-square h-[66%]">
                  <Image
                    src={companions.dispenser}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) calc((min(100vw, 1280px) - 4.5rem) * 0.45 * 0.56), 8.5rem"
                    quality={90}
                    className="object-contain mix-blend-multiply"
                  />
                </div>
              )}
              <div className="absolute -right-[2%] bottom-0 aspect-[3/4] h-[75%]">
                <Image
                  src={companions.fridge}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) calc((min(100vw, 1280px) - 4.5rem) * 0.45 * 0.56), 8.5rem"
                  quality={90}
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </>
          )}
          {product ? (
            <div className="absolute inset-y-0 left-[2%] aspect-square">{washer}</div>
          ) : (
            // Centred with flexbox, not a transform: a transformed parent would isolate the
            // image's multiply blend and leave its white background showing.
            <div className="absolute inset-0 flex justify-center">
              <div className="relative aspect-square h-full">{washer}</div>
            </div>
          )}
          {product && (
            <Link
              href={productHref(product)}
              className={`absolute bottom-1 left-[18%] max-w-[10.5rem] rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_8px_20px_-10px_rgba(80,50,20,0.4)] transition-colors hover:border-[#a85414] sm:bottom-3 sm:max-w-[15.5rem] ${focusRing}`}
            >
              <span className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-900">{product.name}</span>
              <span className="mt-0.5 block text-xs font-semibold text-[#8f4710]">{formatPrice(product.price)}</span>
            </Link>
          )}
        </div>
        <HeroCategoryNav className="flex flex-wrap gap-x-6 gap-y-5 lg:col-start-1 lg:row-start-2">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? LayoutGrid;
            const photo = tilePhotos[category.slug];
            return (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                className={`group flex w-[4.5rem] flex-col items-center gap-2 rounded-2xl text-center text-xs font-semibold leading-tight text-neutral-900 ${focusRing}`}
              >
                <span
                  className={`${raised} flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full transition-shadow duration-150 ${pressable}`}
                >
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      width={48}
                      height={48}
                      quality={90}
                      className="h-12 w-12 object-contain mix-blend-multiply"
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
