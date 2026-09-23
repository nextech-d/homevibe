import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  LEGACY_ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  getAdminToken,
  readAdminCookie,
} from "./app/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  const adminAppUrl = process.env.ADMIN_APP_URL?.trim().replace(/\/$/, "");
  const legacyDisabled = process.env.DISABLE_LEGACY_ADMIN === "true";

  if (adminAppUrl || legacyDisabled) {
    if (pathname.startsWith("/api/admin") && !isLoginApi) {
      return NextResponse.json(
        {
          success: false,
          message: "Legacy admin API is disabled. Use the Patril Admin app.",
        },
        { status: 410 }
      );
    }

    if (pathname.startsWith("/admin")) {
      if (adminAppUrl) {
        const adminPath = pathname.replace(/^\/admin/, "") || "/";
        const target = new URL(adminPath, `${adminAppUrl}/`);
        target.search = request.nextUrl.search;
        return NextResponse.redirect(target);
      }
      if (legacyDisabled && !isLoginPage) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  const isProtected =
    (pathname.startsWith("/admin") && !isLoginPage) ||
    (pathname.startsWith("/api/admin") && !isLoginApi);

  if (!isProtected) {
    return NextResponse.next();
  }

  const expected = await getAdminToken();
  if (!expected) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Admin is not configured." },
        { status: 503 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const session = readAdminCookie(request.cookies);
  if (session !== expected) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const response = NextResponse.next();

  /** Move a still-valid pre-rename cookie onto the current name, once. */
  if (!request.cookies.has(ADMIN_COOKIE)) {
    response.cookies.set(ADMIN_COOKIE, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
    });
    response.cookies.delete(LEGACY_ADMIN_COOKIE);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
