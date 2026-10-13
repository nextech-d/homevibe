import { NextResponse } from "next/server";
import { clearUserSession } from "../../../lib/users.server";
import { rejectCrossSiteWrite } from "../../../lib/same-origin.server";

export async function POST(request: Request) {
  const refused = rejectCrossSiteWrite(request);
  if (refused) return refused;

  await clearUserSession();
  return NextResponse.json({ success: true });
}
