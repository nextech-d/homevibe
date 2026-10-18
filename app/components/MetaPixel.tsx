"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, META_PIXEL_SCRIPT, trackPixel } from "../lib/pixel";

/**
 * Loads the Meta Pixel once for the whole site and reports a PageView per
 * route. App Router navigations never reload the page, so without the effect
 * every session would look like a single view. The `fbq` queue itself lives in
 * lib/pixel, so events fired before the library loads still reach Meta.
 *
 * Renders nothing when no pixel is configured.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  /** The path last reported, so a re-run effect (Strict Mode) isn't a second view. */
  const reported = useRef<string | null>(null);

  useEffect(() => {
    if (reported.current === pathname) return;
    reported.current = pathname;
    trackPixel("PageView");
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      {/* Once the browser is idle rather than straight after hydration, so
          Meta's script doesn't compete with the first paint. Nothing is lost:
          events fired before it arrives wait in lib/pixel's fbq queue and are
          sent, in order, when it loads. */}
      <Script id="meta-pixel" src={META_PIXEL_SCRIPT} strategy="lazyOnload" />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(
            META_PIXEL_ID
          )}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
