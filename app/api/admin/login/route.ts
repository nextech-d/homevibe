import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  getAdminToken,
} from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Admin password is not configured on the server." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { password?: string };
  if (body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ success: true });
}
