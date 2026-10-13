const TOKEN_KEY = "homevibe_admin_token";
/** Pre-rename key. Read-only: migrated on first read so logins survive. */
const LEGACY_TOKEN_KEY = "patril_admin_token";

const base =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "/api" : "https://api.homevibe.co.ke/api");

export function getToken(): string | null {
  try {
    const current = localStorage.getItem(TOKEN_KEY);
    if (current !== null) return current;

    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy === null) return null;

    localStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

type ApiOptions = RequestInit & { auth?: boolean };

/**
 * The one way a session ends in the admin: forget the token and go to the
 * login page, which explains why. Used for an expired token found before a
 * request goes out, and for any 401 that comes back.
 */
export function sessionExpired(): void {
  clearToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login?expired=1";
  }
}

/**
 * Whether the token's own expiry (the JWT "exp" claim, 12 hours after
 * sign-in) has passed. Checked before sending, so an expired session goes
 * straight to login instead of failing a request and flashing an error.
 * The API still verifies the token; this only spares the round trip.
 */
function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = getToken();
    if (token && tokenExpired(token)) {
      sessionExpired();
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const startedAt = Date.now();
  const res = await fetch(`${base}${path}`, { ...options, headers });

  const raw = await res.text();
  let data: T & { success?: boolean; message?: string };
  try {
    data = JSON.parse(raw) as T & { success?: boolean; message?: string };
  } catch {
    throw new Error(
      raw.trim().slice(0, 120) || `Request failed (${res.status}). Is the API running on port 4000?`
    );
  }

  if (!res.ok) {
    if (res.status === 401 && options.auth !== false) sessionExpired();
    throw new Error(data.message ?? `Request failed (${res.status})`);
  }

  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && PUBLISHING_PATHS.test(path)) {
    watchStorefrontPublish(startedAt);
  }

  return data;
}

/**
 * Admin writes that refresh the live site in the background. The save answers
 * before that refresh is done, so a moment later the admin asks how it went
 * and raises a warning if it failed - see StorefrontPublishWarning.
 */
const PUBLISHING_PATHS =
  /^\/admin\/(products|catalog\/|storefront\/(settings|featured|faq)|seo\/global|content\/)/;

export const PUBLISH_FAILED_EVENT = "homevibe:storefront-publish-failed";

export type StorefrontPublishStatus = {
  ok: boolean;
  message: string;
  reason: string;
  startedAt: string;
  finishedAt: string;
};

/** Checks after a save: quick first, then backing off - about ten seconds in all. */
const PUBLISH_CHECK_DELAYS_MS = [1500, 2000, 3000, 4000];

/** Slack for network time when placing the save on the server's clock. */
const SAVE_CLOCK_SLACK_MS = 1000;

function watchStorefrontPublish(saveStartedAt: number): void {
  void (async () => {
    for (const delay of PUBLISH_CHECK_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      let reply: { status: StorefrontPublishStatus | null; now: string };
      try {
        reply = await api<{ status: StorefrontPublishStatus | null; now: string }>(
          "/admin/storefront/publish-status"
        );
      } catch {
        return;
      }
      if (!reply.status) continue;

      // The save, on the server's clock: its "now" less the time that has
      // passed here since the save went out. No comparing two machines' clocks.
      const saveOnServer = Date.parse(reply.now) - (Date.now() - saveStartedAt);
      if (Date.parse(reply.status.startedAt) < saveOnServer - SAVE_CLOCK_SLACK_MS) {
        continue; // still the refresh before this save; ours has not finished yet
      }

      if (!reply.status.ok && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<StorefrontPublishStatus>(PUBLISH_FAILED_EVENT, { detail: reply.status })
        );
      }
      return;
    }
  })();
}

export async function login(password: string) {
  const data = await api<{ success: boolean; token?: string; message?: string }>(
    "/auth/admin/login",
    {
      method: "POST",
      body: JSON.stringify({ password }),
      auth: false,
    }
  );
  if (data.token) setToken(data.token);
  return data;
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getApiBase(): string {
  return base;
}

export async function exportOrdersCsv(): Promise<void> {
  const token = getToken();
  const res = await fetch(`${base}/admin/orders/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    sessionExpired();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homevibe-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadProductImage(file: File): Promise<string> {
  return uploadImage(file, "/admin/uploads");
}

export async function uploadBrandLogo(file: File): Promise<string> {
  return uploadImage(file, "/admin/uploads/brand");
}

async function uploadImage(file: File, path: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = (await res.json()) as { success?: boolean; url?: string; message?: string };

  if (res.status === 401) {
    sessionExpired();
    throw new Error(data.message ?? "Unauthorized.");
  }

  if (!res.ok || !data.url) {
    throw new Error(data.message ?? `Upload failed (${res.status})`);
  }

  return data.url;
}

export const STORE_URL =
  import.meta.env.VITE_STORE_URL?.replace(/\/$/, "") || "https://homevibe.co.ke";
