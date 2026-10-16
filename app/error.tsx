"use client";

import Link from "next/link";
import StatusPanel from "./components/StatusPanel";
import { primaryButton, secondaryButton } from "./components/homeSurfaces";

/**
 * A page that threw while rendering. The header and footer stay, so this is
 * only the middle of the page; retry() re-fetches and re-renders it without a
 * full reload.
 */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <StatusPanel
        title="Something went wrong"
        actions={
          <>
            <button type="button" onClick={() => retry()} className={primaryButton}>
              Try again
            </button>
            <Link href="/" className={secondaryButton}>
              Return home
            </Link>
          </>
        }
      >
        This page didn&apos;t load. Try again, or come back in a minute.
      </StatusPanel>
    </div>
  );
}
