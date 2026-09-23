import "server-only";

import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminToken, readAdminCookie } from "./admin-auth";

export { ADMIN_COOKIE, getAdminToken };

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  return readAdminCookie(cookieStore) === token;
}
