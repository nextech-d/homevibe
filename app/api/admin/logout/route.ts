import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, LEGACY_ADMIN_COOKIE } from "../../../lib/admin-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.delete(LEGACY_ADMIN_COOKIE);
  return NextResponse.json({ success: true });
}
