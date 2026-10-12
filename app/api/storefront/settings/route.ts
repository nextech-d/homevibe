import { NextResponse } from "next/server";
import { getSiteSettingsData } from "../../../lib/storefront.server";
import { clientErrorMessage } from "../../../../shared/client-errors";

export async function GET() {
  try {
    const settings = await getSiteSettingsData();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load site settings.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
