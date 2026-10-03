/**
 * Converts pasted HTML to the markdown the long-form field stores.
 *
 * Word, Docs and web pages all put an HTML flavour on the clipboard alongside
 * the plain text; without this, that flavour is thrown away and the writer
 * retypes every # and ** by hand. Only the constructs the storefront's renderer
 * understands are produced - headings, bold, italic, links, lists, tables -
 * and anything else degrades to its text.
 */
/**
 * Google Docs wraps the entire clipboard in <b style="font-weight:normal"> and
 * Word wraps runs in similar weight-cancelling tags. An explicit normal weight
 * is the signal that the tag is structural rather than emphasis.
 */
function isFauxBold(el: HTMLElement): boolean {
  return /font-weight\s*:\s*(normal|400)\b/i.test(el.getAttribute("style") ?? "");
}

/**
 * Docs and Word express emphasis as an inline style on a <span> rather than
 * <strong> or <em>, so the style has to be read or a pasted document arrives
 * with every bold word flattened.
 */
function styledBold(el: HTMLElement): boolean {
  const weight = /font-weight\s*:\s*([^;]+)/i.exec(el.getAttribute("style") ?? "")?.[1]?.trim().toLowerCase();
  if (!weight) return false;
  if (weight === "bold" || weight === "bolder") return true;
  const numeric = Number(weight);
  return Number.isFinite(numeric) && numeric >= 600;
}

function styledItalic(el: HTMLElement): boolean {
  return /font-style\s*:\s*italic/i.test(el.getAttribute("style") ?? "");
}

/** Wraps text in a marker without swallowing the spaces that surround it. */
function wrap(marker: string, inner: string): string {
  const text = inner.trim();
  if (!text) return "";
  return `${inner.match(/^\s*/)![0]}${marker}${text}${marker}${inner.match(/\s*$/)![0]}`;
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(inline).join("");
  const text = inner.trim();

  switch (el.tagName) {
    case "BR":
      return " ";
    case "STRONG":
    case "B":
      // A weight-cancelling wrapper is not emphasis and passes its children
      // through unmarked.
      if (!text) return "";
      return isFauxBold(el) ? inner : wrap("**", inner);
    case "EM":
    case "I":
      return wrap("*", inner);
    case "CODE":
      return wrap("`", inner);
    case "A": {
      const href = el.getAttribute("href");
      return href && text ? `[${text}](${href})` : text;
    }
    default: {
      if (!text) return inner;
      let result = inner;
      if (styledItalic(el)) result = wrap("*", result);
      if (styledBold(el)) result = wrap("**", result);
      return result;
    }
  }
}

const BLOCK_TAGS = /^(H[1-6]|UL|OL|TABLE|P|DIV|SECTION|ARTICLE|BLOCKQUOTE)$/;

function cell(el: Element): string {
  return inline(el).trim().replace(/\|/g, "\\|");
}

function block(el: Element, out: string[]): void {
  const tag = el.tagName;

  if (/^H[1-6]$/.test(tag)) {
    const level = Math.min(Number(tag[1]), 3);
    const text = inline(el).trim();
    if (text) out.push("#".repeat(level) + " " + text);
    return;
  }

  if (tag === "UL" || tag === "OL") {
    const items = Array.from(el.children).filter((c) => c.tagName === "LI");
    items.forEach((li, index) => {
      const text = inline(li).trim();
      if (text) out.push(tag === "OL" ? `${index + 1}. ${text}` : `- ${text}`);
    });
    return;
  }

  if (tag === "TABLE") {
    const rows = Array.from(el.querySelectorAll("tr"));
    if (rows.length === 0) return;
    const headerCells = Array.from(rows[0].children).map(cell);
    if (headerCells.length === 0) return;
    out.push(`| ${headerCells.join(" | ")} |`);
    out.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
    for (const row of rows.slice(1)) {
      const cells = Array.from(row.children).map(cell);
      if (cells.length) out.push(`| ${cells.join(" | ")} |`);
    }
    return;
  }

  if (tag === "BLOCKQUOTE") {
    const text = inline(el).trim();
    if (text) out.push("> " + text);
    return;
  }

  // Everything else is treated as a container: P and DIV, but also the single
  // <b> Google Docs wraps a whole document in and the <span>/<font> nesting
  // Word produces. Walking it matters - flattening a wrapper that holds blocks
  // collapses the entire paste onto one line.
  const hasBlockChildren = Array.from(el.children).some((c) => BLOCK_TAGS.test(c.tagName));
  if (hasBlockChildren) {
    Array.from(el.children).forEach((child) => block(child, out));
    return;
  }

  const text = inline(el).trim();
  if (text) out.push(text);
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("style, script, meta, link").forEach((n) => n.remove());

  const out: string[] = [];
  Array.from(doc.body.children).forEach((child) => block(child, out));

  // Lists and table rows must stay on consecutive lines; everything else gets a
  // blank line between it and its neighbour.
  const joined: string[] = [];
  out.forEach((line, i) => {
    const previous = out[i - 1];
    const bothList = previous && /^([-*]|\d+\.)\s/.test(previous) && /^([-*]|\d+\.)\s/.test(line);
    const bothTable = previous && previous.startsWith("|") && line.startsWith("|");
    joined.push(bothList || bothTable ? line : (i === 0 ? line : "\n" + line));
  });

  return joined.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
