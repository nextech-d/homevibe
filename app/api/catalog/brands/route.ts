import { NextResponse } from "next/server";
import { getPrisma } from "../../../lib/db";
import { FEATURED_BRANDS } from "../../../data/brands";
import { clientErrorMessage } from "../../../../shared/client-errors";
import { navBrands } from "../../../../shared/nav-brands";

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
    const rows = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        origin: true,
        logoUrl: true,
        isFeatured: true,
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });
    const brands = navBrands(rows).map(({ id, name, slug, tier, origin, logoUrl, isFeatured }) => ({
      id,
      name,
      slug,
      tier,
      origin,
      logoUrl,
      isFeatured,
    }));
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load brands.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
