/**
 * Links in FAQ answers, written as markdown: [link text](url).
 *
 * Answers are otherwise plain text, so this is the only markup they carry. A
 * link renders on the page only when it points somewhere on this shop - a
 * product or category path, or homevibe.co.ke itself. Anything else renders
 * as its text alone, the way markdown.ts treats an unsafe link target.
 *
 * Google's FAQPage data gets the text alone either way: it is read as text,
 * and brackets and a URL in the middle of an answer are noise there.
 */

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export type FaqAnswerPart = { text: string; href?: string };

/** The href a link may use, or null when it must render as text. */
export function faqLinkHref(url: string): string | null {
  // Control characters, spaces and backslashes have no place in these URLs,
  // and a browser reading around them is how "/product/" becomes "//evil".
  if (/[\u0000- \u007f\\]/.test(url)) return null;
  if (url.startsWith("/product/") || url.startsWith("/category/")) return url;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "homevibe.co.ke" &&
      !parsed.port &&
      !parsed.username &&
      !parsed.password
    ) {
      return parsed.href;
    }
  } catch {
    // Not an absolute URL, and not one of the paths above.
  }
  return null;
}

/**
 * An answer as text and link runs, in order. An answer with no links is one
 * text run holding the whole answer, so it renders exactly as before.
 */
export function parseFaqAnswer(answer: string): FaqAnswerPart[] {
  const parts: FaqAnswerPart[] = [];
  let last = 0;
  for (const match of answer.matchAll(LINK)) {
    const [whole, label, url] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: answer.slice(last, start) });
    const href = faqLinkHref(url);
    parts.push(href ? { text: label, href } : { text: label });
    last = start + whole.length;
  }
  if (last < answer.length || parts.length === 0) parts.push({ text: answer.slice(last) });
  return parts;
}

/** The answer with every link reduced to its text, for structured data. */
export function faqAnswerPlainText(answer: string): string {
  return answer.replace(LINK, "$1");
}
