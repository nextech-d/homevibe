import { useEffect, useState } from "react";
import { AlertTriangle, Rocket, X } from "lucide-react";
import { api, PUBLISH_FAILED_EVENT, type StorefrontPublishStatus } from "../lib/api";

/**
 * Shown when a save went through but the live site's refresh after it did not.
 * The page's own "saved" is true - the data is in - so this sits above every
 * page rather than replacing it, and offers the same Publish the Settings page
 * has, so the fix is one press away.
 */
export default function StorefrontPublishWarning() {
  const [failure, setFailure] = useState<StorefrontPublishStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    function onFailed(event: Event) {
      setFailure((event as CustomEvent<StorefrontPublishStatus>).detail);
      setResult(null);
    }
    window.addEventListener(PUBLISH_FAILED_EVENT, onFailed);
    return () => window.removeEventListener(PUBLISH_FAILED_EVENT, onFailed);
  }, []);

  if (!failure) return null;

  async function publish() {
    setPublishing(true);
    setResult(null);
    try {
      const data = await api<{ publish: { message: string } }>("/admin/storefront/publish", {
        method: "POST",
      });
      setResult({ ok: true, message: data.publish.message || "Live site refreshed." });
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Publish failed.",
      });
    } finally {
      setPublishing(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-xs text-emerald-900">
        <span>Published - the live site is up to date ({result.message}).</span>
        <button
          type="button"
          onClick={() => setFailure(null)}
          aria-label="Dismiss"
          className="rounded p-1 hover:bg-emerald-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-6 py-3 text-xs text-amber-950"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="font-semibold">Saved, but the live site didn&apos;t refresh. Press Publish.</p>
          <p className="mt-0.5 text-amber-800">
            {result && !result.ok ? `Publish failed: ${result.message}` : failure.message}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={publish}
          disabled={publishing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          <Rocket className={`h-3.5 w-3.5 ${publishing ? "animate-pulse" : ""}`} />
          {publishing ? "Publishing…" : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => setFailure(null)}
          aria-label="Dismiss"
          className="rounded p-1 hover:bg-amber-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
