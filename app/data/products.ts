import {
  buildProductImageSet,
  type ProductImageSet,
} from "../lib/productImages";

export type Appliance = {
  id: number;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  status: string;
  /** Card-size URL — use getProductCardImage() when rendering. */
  image: string;
  /** Detail gallery — use getProductGallery() when rendering. */
  images: string[];
  imageSet: ProductImageSet;
  specs: string;
  brand: string;
  description: string;
  highlights: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
};

type ApplianceInput = Omit<Appliance, "image" | "images" | "imageSet" | "slug"> & {
  slug?: string;
  photoId: string;
  galleryPhotoIds: string[];
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productHref(product: { slug?: string; id: number }): string {
  return `/product/${product.slug || product.id}`;
}

function defineAppliance(input: ApplianceInput): Appliance {
  const { photoId, galleryPhotoIds, ...rest } = input;
  const imageSet = buildProductImageSet(photoId, galleryPhotoIds);
  return {
    ...rest,
    slug: rest.slug || slugifyName(rest.name),
    imageSet,
    image: imageSet.card,
    images: imageSet.gallery,
  };
}

export const APPLIANCES_INVENTORY: Appliance[] = [
  defineAppliance({
    id: 1,
    name: "AeroCook 9000 Smart Oven",
    category: "Cooking",
    subcategory: "ovens-ranges",
    price: 325000,
    status: "In Stock",
    photoId: "photo-1544816155-12df9643f363",
    galleryPhotoIds: [
      "photo-1544816155-12df9643f363",
      "photo-1584269600464-37b1b58a9fe7",
      "photo-1556909212-d5b604d0c90d",
    ],
    specs: "Convection • AI Assist • Matte Black",
    brand: "Bosch",
    description:
      "The AeroCook 9000 combines Bosch convection engineering with AI-assisted cooking programs. Its matte black finish and flush-mount design integrate seamlessly into contemporary kitchen architecture, while precision temperature control delivers restaurant-quality results at home.",
    highlights: [
      "AI-assisted cooking with 120+ preset programs",
      "True convection with even heat distribution",
      "Wi-Fi enabled — control from the HomeVibe app",
      "Self-cleaning cycle with eco mode",
    ],
  }),
  defineAppliance({
    id: 2,
    name: "Preserva Dual-Zone Refrigerator",
    category: "Refrigeration",
    subcategory: "refrigerators",
    price: 637000,
    status: "Low Stock",
    photoId: "photo-1588854337236-6889d631faa8",
    galleryPhotoIds: [
      "photo-1588854337236-6889d631faa8",
      "photo-1574269909862-7e1d70bb8078",
    ],
    specs: "Smart Glass • Tri-Zone Cooling • Stainless Steel",
    brand: "Sub-Zero",
    description:
      "Preserva's tri-zone cooling system keeps produce, proteins, and beverages at their ideal temperatures independently. Smart glass panels reveal contents without opening the door, reducing energy loss and preserving freshness longer in East African climates.",
    highlights: [
      "Tri-zone independent temperature control",
      "Smart glass door panels with tap-to-illuminate",
      "Air purification system reduces odors",
      "Energy Star rated for lower running costs",
    ],
  }),
  defineAppliance({
    id: 3,
    name: "Barista Pro Induction Espresso Engine",
    category: "Coffee Tech",
    subcategory: "espresso-machines",
    price: 195000,
    status: "In Stock",
    photoId: "photo-1514432324607-a09d9b4aefdd",
    galleryPhotoIds: [
      "photo-1514432324607-a09d9b4aefdd",
      "photo-1520209268518-aec4708a946b",
      "photo-1495474472287-4d71bcdd2085",
      "photo-1509042239860-f550ce710b93",
    ],
    specs: "Precision PID • 15 Bar Pressure • Walnut Accents",
    brand: "Miele",
    description:
      "Built for the serious home barista, the Barista Pro delivers café-quality espresso with PID temperature stability and 15-bar pump pressure. Walnut accent panels and a compact footprint make it a statement piece for any kitchen counter.",
    highlights: [
      "PID temperature control within ±0.5°C",
      "15-bar Italian pump for rich crema",
      "Integrated grinder with 18 grind settings",
      "Steam wand for microfoam latte art",
    ],
  }),
  defineAppliance({
    id: 4,
    name: "Lumina Whisper-Quiet Dishwasher",
    category: "Cleaning",
    subcategory: "dishwashers",
    price: 143000,
    status: "In Stock",
    photoId: "photo-1581622558667-3419a8dc5f83",
    galleryPhotoIds: [
      "photo-1581622558667-3419a8dc5f83",
      "photo-1584269600519-112d071b26e6",
    ],
    specs: "39 dBA • Third Rack • Smart Wash",
    brand: "Thermador",
    description:
      "At just 39 dBA, Lumina is quieter than a conversation — ideal for open-plan living. The third rack accommodates utensils and small items, while Smart Wash sensors adjust water and cycle time based on load soil level.",
    highlights: [
      "Ultra-quiet 39 dBA operation",
      "Flexible third rack for cutlery and tools",
      "Smart Wash auto-adjusts cycle intensity",
      "Stainless steel interior resists staining",
    ],
  }),
  defineAppliance({
    id: 5,
    name: "Vortex Pro Gas Rangetop",
    category: "Cooking",
    subcategory: "rangetops",
    price: 429000,
    status: "In Stock",
    photoId: "photo-1556910103-1c02745aae4d",
    galleryPhotoIds: [
      "photo-1556910103-1c02745aae4d",
      "photo-1556909114-f6e7ad7d3136",
      "photo-1584269600464-37b1b58a9fe7",
    ],
    specs: "6 Burners • 22K BTU • Continuous Grates",
    brand: "Wolf",
    description:
      "The Vortex Pro brings professional kitchen power home with six sealed burners including dual 22K BTU power burners for wok cooking and searing. Continuous cast-iron grates allow pots to slide effortlessly across the surface.",
    highlights: [
      "Six sealed burners with dual 22K BTU power zones",
      "Continuous cast-iron grates",
      "Flame failure safety on every burner",
      "Compatible with LPG — conversion kit included",
    ],
  }),
  defineAppliance({
    id: 6,
    name: "Celsius Smart Wine Cellar",
    category: "Refrigeration",
    subcategory: "wine-cellars",
    price: 286000,
    status: "Low Stock",
    photoId: "photo-1560243563-062bfc001d68",
    galleryPhotoIds: [
      "photo-1560243563-062bfc001d68",
      "photo-1584269600519-112d071b26e6",
    ],
    specs: "Dual Zone • UV Protection • 46 Bottles",
    brand: "Gaggenau",
    description:
      "Celsius preserves your collection in dual independently controlled zones — reds at 14–18°C, whites at 8–12°C. UV-protected glass doors and vibration-dampened shelving protect aging wines in Nairobi's warm climate.",
    highlights: [
      "Dual-zone temperature control",
      "UV-protected tempered glass doors",
      "46-bottle capacity with adjustable shelves",
      "Whisper-quiet compressor for living spaces",
    ],
  }),
  defineAppliance({
    id: 7,
    name: "ProRun X500 Treadmill",
    category: "Gym",
    subcategory: "cardio",
    price: 485000,
    status: "In Stock",
    photoId: "photo-1549060275-aea3f0709702",
    galleryPhotoIds: ["photo-1549060275-aea3f0709702", "photo-1571902940-048fa0169c0f"],
    specs: "22 km/h • 15% Incline • Bluetooth",
    brand: "Life Fitness",
    description:
      "A club-grade treadmill built for daily cardio at home. Cushioned deck reduces joint impact, while quick incline controls and built-in programs keep sessions varied.",
    highlights: [
      "3.5 CHP motor for smooth acceleration",
      "15% incline with quick-set buttons",
      "Heart-rate sync via Bluetooth",
      "Folds upright for space-saving storage",
    ],
  }),
  defineAppliance({
    id: 8,
    name: "SpinCycle Elite Indoor Bike",
    category: "Gym",
    subcategory: "cardio",
    price: 312000,
    status: "In Stock",
    photoId: "photo-1517836357463-d25dfeac3438",
    galleryPhotoIds: ["photo-1517836357463-d25dfeac3438", "photo-1534438327276-c14da0d093de"],
    specs: "Magnetic Resistance • SPD Cleats • LCD Console",
    brand: "Precor",
    description:
      "Studio-style indoor cycling with whisper-quiet magnetic resistance and a heavy flywheel. Ideal for HIIT sessions or steady endurance rides.",
    highlights: [
      "100 micro-adjust resistance levels",
      "Dual-sided SPD-compatible pedals",
      "Adjustable saddle and handlebars",
      "Transport wheels for easy repositioning",
    ],
  }),
  defineAppliance({
    id: 9,
    name: "PowerLift Cable Station",
    category: "Gym",
    subcategory: "strength",
    price: 558000,
    status: "In Stock",
    photoId: "photo-1571902940-048fa0169c0f",
    galleryPhotoIds: ["photo-1571902940-048fa0169c0f", "photo-1583454118551-48a0edd8430b"],
    specs: "Dual Pulleys • 200 kg Stack • Multi-Grip",
    brand: "Technogym",
    description:
      "A versatile cable station for full-body strength training. Dual adjustable pulleys support rows, flyes, tricep work, and functional movements in a compact footprint.",
    highlights: [
      "200 kg weight stack with smooth glide",
      "Dual independent pulley columns",
      "Includes lat bar, rope, and D-handles",
      "Powder-coated steel frame",
    ],
  }),
  defineAppliance({
    id: 10,
    name: "CoreForge Home Gym System",
    category: "Gym",
    subcategory: "home-gym",
    price: 395000,
    status: "In Stock",
    photoId: "photo-1534438327276-c14da0d093de",
    galleryPhotoIds: ["photo-1534438327276-c14da0d093de", "photo-1576678927484-cc907957088c"],
    specs: "Multi-Station • 90 kg Stack • Leg Developer",
    brand: "Bowflex",
    description:
      "An all-in-one home gym covering upper and lower body without a room full of machines. Perfect for apartments, spare rooms, or a garage setup.",
    highlights: [
      "Lat pulldown, press, and leg developer",
      "90 kg weight stack with quick pin select",
      "Compact footprint under 2 m²",
      "Includes exercise chart for beginners",
    ],
  }),
  defineAppliance({
    id: 11,
    name: "IronVault Dumbbell Rack Set",
    category: "Gym",
    subcategory: "weights-racks",
    price: 178000,
    status: "In Stock",
    photoId: "photo-1583454118551-48a0edd8430b",
    galleryPhotoIds: ["photo-1583454118551-48a0edd8430b", "photo-1434682881908-418b4842f92e"],
    specs: "5–30 kg Pairs • Rubber Hex • 3-Tier Rack",
    brand: "Rogue",
    description:
      "A complete dumbbell set with a heavy-duty three-tier rack. Rubber hex heads protect floors and stay put during workouts.",
    highlights: [
      "Pairs from 5 kg to 30 kg included",
      "Commercial-grade steel rack",
      "Knurled handles for secure grip",
      "Rubber-coated heads reduce noise",
    ],
  }),
  defineAppliance({
    id: 12,
    name: "ClubLine Commercial Elliptical",
    category: "Gym",
    subcategory: "commercial",
    price: 890000,
    status: "In Stock",
    photoId: "photo-1576678927484-cc907957088c",
    galleryPhotoIds: ["photo-1576678927484-cc907957088c", "photo-1549060275-aea3f0709702"],
    specs: "Self-Powered • 20\" Stride • Club Console",
    brand: "Life Fitness",
    description:
      "Built for boutique studios and hotel gyms, this elliptical handles high daily use with a smooth natural stride and self-generating console.",
    highlights: [
      "20-inch natural stride length",
      "Self-powered — no outlet required",
      "Heart-rate and calorie tracking",
      "Commercial warranty available",
    ],
  }),
  defineAppliance({
    id: 13,
    name: "FlameLine Induction Cooktop",
    category: "Cooking",
    subcategory: "cooktops",
    price: 245000,
    status: "In Stock",
    photoId: "photo-1556909212-d5b604d0c90d",
    galleryPhotoIds: ["photo-1556909212-d5b604d0c90d", "photo-1556910103-1c02745aae4d"],
    specs: "4 Zones • Boost • Touch Controls",
    brand: "Bosch",
    description:
      "Four induction zones with boost function for fast boiling and precise simmer control. Flush black glass integrates cleanly into modern counters.",
    highlights: [
      "Four independent induction zones",
      "Boost mode for rapid heating",
      "Timer and child lock",
      "Works with ferrous cookware only",
    ],
  }),
  defineAppliance({
    id: 14,
    name: "QuickHeat Built-In Microwave",
    category: "Cooking",
    subcategory: "microwaves",
    price: 89000,
    status: "In Stock",
    photoId: "photo-1584269600464-37b1b58a9fe7",
    galleryPhotoIds: ["photo-1584269600464-37b1b58a9fe7", "photo-1544816155-12df9643f363"],
    specs: "900 W • 25 L • Grill Function",
    brand: "Samsung",
    description:
      "A built-in microwave with grill combo for reheating, defrosting, and light browning. Simple controls and a stainless interior wipe clean easily.",
    highlights: [
      "900 W microwave with grill element",
      "25-litre capacity",
      "10 auto-cook programs",
      "Child safety lock",
    ],
  }),
  defineAppliance({
    id: 15,
    name: "FrostGuard Chest Freezer",
    category: "Refrigeration",
    subcategory: "freezers",
    price: 112000,
    status: "In Stock",
    photoId: "photo-1574269909862-7e1d70bb8078",
    galleryPhotoIds: ["photo-1574269909862-7e1d70bb8078", "photo-1588854337236-6889d631faa8"],
    specs: "300 L • Fast Freeze • Lockable Lid",
    brand: "Hisense",
    description:
      "Extra freezer space for bulk shopping and meal prep. Fast-freeze mode locks in freshness when you load a big shop.",
    highlights: [
      "300-litre capacity",
      "Fast-freeze function",
      "Removable storage basket",
      "Lockable lid for shared spaces",
    ],
  }),
  defineAppliance({
    id: 16,
    name: "WashPro Front Load Washer",
    category: "Cleaning",
    subcategory: "laundry",
    price: 156000,
    status: "In Stock",
    photoId: "photo-1626806782-119b7879f3d3",
    galleryPhotoIds: ["photo-1626806782-119b7879f3d3", "photo-1584269600519-112d071b26e6"],
    specs: "9 kg • Steam • 1400 RPM",
    brand: "LG",
    description:
      "A quiet front-loader with steam refresh for shirts and delicates. Large 9 kg drum handles family loads in fewer cycles.",
    highlights: [
      "9 kg wash capacity",
      "Steam refresh cycle",
      "1400 RPM spin reduces drying time",
      "Inverter motor for quiet operation",
    ],
  }),
  defineAppliance({
    id: 17,
    name: "PureAir Cordless Vacuum",
    category: "Cleaning",
    subcategory: "vacuums",
    price: 78000,
    status: "In Stock",
    photoId: "photo-1558317547-33e007d0374b",
    galleryPhotoIds: ["photo-1558317547-33e007d0374b", "photo-1581622558667-3419a8dc5f83"],
    specs: "60 min Runtime • HEPA • Wall Mount",
    brand: "Miele",
    description:
      "Lightweight cordless vacuum for daily floor care and quick clean-ups. HEPA filtration traps fine dust — helpful in dry climates.",
    highlights: [
      "Up to 60 minutes runtime",
      "HEPA filtration",
      "Motorised floor head included",
      "Wall-mounted charging dock",
    ],
  }),
  defineAppliance({
    id: 18,
    name: "GrindMaster Burr Grinder",
    category: "Coffee Tech",
    subcategory: "grinders",
    price: 68000,
    status: "In Stock",
    photoId: "photo-1520209268518-aec4708a946b",
    galleryPhotoIds: ["photo-1520209268518-aec4708a946b", "photo-1514432324607-a09d9b4aefdd"],
    specs: "40 Settings • Conical Burr • Timer",
    brand: "Miele",
    description:
      "Consistent grind size for espresso through French press. Conical burrs run cool to preserve aroma and reduce static.",
    highlights: [
      "40 grind settings",
      "Conical burr set",
      "Timed dosing in 0.2 s steps",
      "Anti-static chute",
    ],
  }),
  defineAppliance({
    id: 19,
    name: "PourCraft Drip Brewer",
    category: "Coffee Tech",
    subcategory: "brewers",
    price: 42000,
    status: "In Stock",
    photoId: "photo-1495474472287-4d71bcdd2085",
    galleryPhotoIds: ["photo-1495474472287-4d71bcdd2085", "photo-1509042239860-f550ce710b93"],
    specs: "SCA Certified • Thermal Carafe • Bloom",
    brand: "KitchenAid",
    description:
      "A precision drip brewer that hits the right water temperature and bloom time for balanced cups. Thermal carafe keeps coffee hot without a hot plate.",
    highlights: [
      "SCA-certified brewing profile",
      "1.25 L thermal carafe",
      "Shower-head dispersion",
      "Auto shut-off after brew",
    ],
  }),
  defineAppliance({
    id: 20,
    name: "FlexRow Adjustable Bench",
    category: "Gym",
    subcategory: "strength",
    price: 95000,
    status: "In Stock",
    photoId: "photo-1434682881908-418b4842f92e",
    galleryPhotoIds: ["photo-1434682881908-418b4842f92e", "photo-1571902940-048fa0169c0f"],
    specs: "Flat • Incline • Decline • 300 kg Rated",
    brand: "Rogue",
    description:
      "A sturdy adjustable bench for presses, rows, and dumbbell work. Seven back positions and three seat angles cover most training styles.",
    highlights: [
      "300 kg weight rating",
      "Seven back pad positions",
      "Compact footprint for home gyms",
      "Non-slip feet and vinyl upholstery",
    ],
  }),
];

/** Featured homepage columns: top product with optional paired product stacked below. */
export type FeaturedProductColumn = {
  topId: number;
  bottomId?: number;
};

export const FEATURED_PRODUCT_COLUMNS: FeaturedProductColumn[] = [
  { topId: 2 }, // Preserva
  { topId: 3, bottomId: 5 }, // Barista → Vortex
  { topId: 1, bottomId: 6 }, // AeroCook → Celsius
  { topId: 4 }, // Lumina
];

export function resolveFeaturedColumns(
  inventory: Appliance[] = APPLIANCES_INVENTORY
): { top: Appliance; bottom?: Appliance }[] {
  const byId = new Map(inventory.map((item) => [item.id, item]));

  return FEATURED_PRODUCT_COLUMNS.flatMap((column) => {
    const top = byId.get(column.topId);
    if (!top) return [];

    const bottom = column.bottomId ? byId.get(column.bottomId) : undefined;
    return [{ top, bottom }];
  });
}

export const MIN_CATALOG_PRICE = Math.min(...APPLIANCES_INVENTORY.map((p) => p.price));
export const MAX_CATALOG_PRICE = Math.max(...APPLIANCES_INVENTORY.map((p) => p.price));
