import { SITE } from "../config/site";

/**
 * The digit grouping only. en-US ships with every browser, so this is the
 * same everywhere; it groups thousands with commas, as en-KE does.
 */
const GROUPING = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * "Ksh 19,400" (with a no-break space), on the server and in every browser.
 *
 * Not Intl's currency style: that takes the symbol from the browser's locale
 * data, and a browser without en-KE (Chrome on Android, at least) falls back
 * to "KES 19,400" - so the phone's text differed from the server's, and the
 * prices were re-rendered on load.
 */
export function formatPrice(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${SITE.currency.symbol} ${GROUPING.format(Math.abs(amount))}`;
}
