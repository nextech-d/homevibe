/**
 * The storefront's surface language, matched to the hero: white panels on the
 * #EDEFF3 page, the hero's #DCE0E7 hairline, and the same soft, cool shadow as
 * its category circles - a white highlight top-left, a low grey-blue shade
 * bottom-right. Started on the homepage and now used site-wide; shared here so
 * the pages can't drift apart.
 *
 * Contrast on #EDEFF3 (WCAG AA wants 4.5 for text, 3 for a field's outline):
 * neutral-600 6.8, the accent #a85414 4.6, the darker #8f4710 5.9. neutral-500
 * (4.1) and neutral-400 (2.2) fail on the page, so secondary text is
 * neutral-600 or darker.
 */
export const raisedSurface =
  "rounded-2xl border border-[#DCE0E7] bg-white shadow-[-4px_-4px_12px_rgba(255,255,255,0.9),4px_4px_14px_rgba(112,122,142,0.2)]";

/** A tinted strip or nested box inside a white panel: an order summary's rows, a table header. */
export const insetSurface = "rounded-xl border border-[#DCE0E7] bg-[#F6F7F9]";

/** Section headings below the hero: the hero's weight and tracking, one size down. */
export const sectionHeading = "text-2xl font-medium tracking-tight text-neutral-950 md:text-3xl";

/** A page's h1 off the homepage: the hero's weight and tracking, between its size and a section's. */
export const pageHeading =
  "text-balance text-3xl font-medium leading-tight tracking-tight text-neutral-950 md:text-4xl";

/** A panel's own heading, inside a white card. */
export const panelHeading = "text-lg font-semibold tracking-tight text-neutral-950";

/** The header's and hero's accent focus ring. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]";

const buttonBase = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

/** The hero's "Shop washing machines": accent fill, white text (5.3:1). */
export const primaryButton = `${buttonBase} bg-[#a85414] text-white hover:bg-[#8f4710]`;

/** The hero's "Order on WhatsApp": a 2px accent outline. */
export const secondaryButton = `${buttonBase} border-2 border-[#a85414] text-[#8f4710] hover:bg-[#a85414]/10`;

/** An inline link in running text or a "back to" line. */
export const textLink = `rounded-sm font-semibold text-[#8f4710] underline-offset-4 hover:underline ${focusRing}`;

/** The homepage's brand chip: a 44px white pill that warms to the accent on hover. */
export const chip = `inline-flex min-h-11 items-center rounded-full border border-[#DCE0E7] bg-white px-5 text-[13px] font-medium text-neutral-800 transition-colors hover:border-[#a85414] hover:text-neutral-950 ${focusRing}`;

/** The selected chip in a set: filled, so it reads as chosen without colour alone. */
export const chipActive = `inline-flex min-h-11 items-center rounded-full border border-neutral-950 bg-neutral-950 px-5 text-[13px] font-semibold text-white ${focusRing}`;

/** A form field label, above its input. */
export const fieldLabel = "mb-1.5 block text-sm font-medium text-neutral-800";

/**
 * A text input: 44px, 16px text so iOS doesn't zoom on focus, and a #7D8594
 * border - 3.7:1 on white, where the hairline's 1.3 would leave the field's
 * edge invisible to anyone with low vision.
 */
export const fieldInput =
  "min-h-11 w-full rounded-xl border border-[#7D8594] bg-white px-4 py-2.5 text-base text-neutral-950 placeholder:text-neutral-500 focus-visible:border-[#a85414] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#a85414]";

/** A native checkbox, sized for the thumb and drawn in the accent. */
export const fieldCheckbox = `h-5 w-5 shrink-0 accent-[#a85414] ${focusRing}`;
