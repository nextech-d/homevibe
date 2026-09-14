import { NextResponse } from "next/server";
import { getPrisma } from "../../../lib/db";
import { FEATURED_BRANDS } from "../../../data/brands";

export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({
      success: true,
      brands: FEATURED_BRANDS.map((brand, index) => ({
        id: index + 1,
        name: brand.name,
        slug: brand.slug,
        tier: brand.tier,
        origin: brand.origin,
        logoUrl: null,
        isFeatured: brand.tier === "signature",
      })),
    });
  }

  try {
    const brands = await prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        origin: true,
        logoUrl: true,
        isFeatured: true,
      },
    });
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load brands.";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
