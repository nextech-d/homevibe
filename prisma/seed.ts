import { BrandTier, PrismaClient, StockStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { NAV_CATEGORIES } from "../app/data/categories";
import { FEATURED_BRANDS } from "../app/data/brands";
import {
  APPLIANCES_INVENTORY,
  FEATURED_PRODUCT_COLUMNS,
} from "../app/data/products";
import { FAQ_LIST } from "../app/data/faq";
import { SITE } from "../app/config/site";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function photoIdFromCardUrl(url: string): string {
  const match = url.match(/unsplash\.com\/(photo-[^/?]+)/);
  return match?.[1] ?? url;
}

function mapStockStatus(status: string): StockStatus {
  if (status.toLowerCase().includes("low")) return StockStatus.low_stock;
  if (status.toLowerCase().includes("out")) return StockStatus.out_of_stock;
  return StockStatus.in_stock;
}

async function main() {
  console.log("Clearing catalog tables…");
  await prisma.featuredHomeSlot.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  console.log("Seeding brands…");
  const brandByName = new Map<string, number>();
  for (const [index, brand] of FEATURED_BRANDS.entries()) {
    const created = await prisma.brand.create({
      data: {
        slug: brand.slug,
        name: brand.name,
        tier: brand.tier as BrandTier,
        origin: brand.origin,
        sortOrder: index,
      },
    });
    brandByName.set(brand.name.toLowerCase(), created.id);
  }

  console.log("Seeding categories…");
  const subcategoryByKey = new Map<string, number>();

  for (const [catIndex, category] of NAV_CATEGORIES.entries()) {
    const createdCategory = await prisma.category.create({
      data: {
        slug: category.slug,
        label: category.label,
        navLabel: category.navLabel,
        description: category.description,
        sortOrder: catIndex,
      },
    });

    for (const [subIndex, sub] of category.subcategories.entries()) {
      const createdSub = await prisma.subcategory.create({
        data: {
          categoryId: createdCategory.id,
          slug: sub.slug,
          label: sub.label,
          sortOrder: subIndex,
        },
      });
      subcategoryByKey.set(`${category.slug}:${sub.slug}`, createdSub.id);
    }
  }

  console.log("Seeding products…");
  for (const item of APPLIANCES_INVENTORY) {
    const categorySlug = item.category.toLowerCase().replace(/\s+/g, "-");

    const subcategoryId = subcategoryByKey.get(`${categorySlug}:${item.subcategory}`);
    const brandId = brandByName.get(item.brand.toLowerCase());

    if (!subcategoryId || !brandId) {
      throw new Error(
        `Missing brand or subcategory for product "${item.name}" (${item.brand}, ${categorySlug}/${item.subcategory})`
      );
    }

    const primaryPhotoId = photoIdFromCardUrl(item.image);
    const galleryPhotoIds = item.images.map(photoIdFromCardUrl);

    await prisma.product.create({
      data: {
        id: item.id,
        slug: slugify(item.name),
        name: item.name,
        brandId,
        subcategoryId,
        priceKes: item.price,
        stockStatus: mapStockStatus(item.status),
        isPublished: true,
        specs: item.specs,
        description: item.description,
        highlights: item.highlights,
        primaryPhotoId,
        galleryPhotoIds,
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))`
  );

  console.log("Seeding featured homepage slots…");
  for (const [index, column] of FEATURED_PRODUCT_COLUMNS.entries()) {
    await prisma.featuredHomeSlot.create({
      data: {
        columnIndex: index,
        topProductId: column.topId,
        bottomProductId: column.bottomId ?? null,
      },
    });
  }

  console.log("Seeding site settings…");
  const siteDefaults: Record<string, string> = {
    name: SITE.name,
    tagline: SITE.tagline,
    email: SITE.email,
    phone: SITE.phone,
    whatsapp: SITE.whatsapp,
    region: SITE.region,
    city: SITE.city,
    facebook_url: SITE.social.facebook,
    instagram_url: SITE.social.instagram,
    tiktok_url: SITE.social.tiktok,
  };
  for (const [key, value] of Object.entries(siteDefaults)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  console.log("Seeding FAQ…");
  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    for (const [index, item] of FAQ_LIST.entries()) {
      await prisma.faqItem.create({
        data: {
          question: item.q,
          answer: item.a,
          sortOrder: index,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
