import { NextResponse } from "next/server";
import { getGoogleReviewsData } from "../../../lib/google-reviews.server";
import { clientErrorMessage } from "../../../../shared/client-errors";

export async function GET() {
  try {
    const reviews = await getGoogleReviewsData();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load Google reviews.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
