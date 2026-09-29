import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { GOOGLE_REVIEWS_TAG } from "../../lib/google-reviews.server";

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");

  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/faq");
    revalidatePath("/blog");
    revalidatePath("/articles");
    revalidatePath("/sitemap.xml");
    revalidateTag(GOOGLE_REVIEWS_TAG, "max");

    return NextResponse.json({
      success: true,
      revalidated: true,
      message: "Storefront cache cleared.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revalidation failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
