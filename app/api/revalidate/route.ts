import { NextResponse } from "next/server";
import { revalidateStorefront } from "../../lib/revalidate-storefront.server";

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");

  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    revalidateStorefront();

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
