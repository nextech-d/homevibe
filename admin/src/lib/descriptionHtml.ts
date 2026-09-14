const ALLOWED_TAGS = new Set([
  "P",
  "DIV",
  "SPAN",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "FONT",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
]);

const ALLOWED_STYLES = new Set([
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "color",
]);

export function descriptionLooksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function descriptionHasText(value: string): boolean {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0;
}

export function plainTextToDescriptionHtml(value: string): string {
  return value
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const LEGACY_FONT_SIZE_MAP: Record<string, string> = {
  "1": "11px",
  "2": "12px",
  "3": "14px",
  "4": "16px",
  "5": "18px",
  "6": "24px",
  "7": "36px",
};

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI"]);

function normalizeFontSizeValue(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) return `${Math.round(Number(pxMatch[1]))}px`;
  return null;
}

function isEmptyBlock(el: HTMLElement): boolean {
  return !(el.textContent ?? "").replace(/\u00a0/g, " ").replace(/\u200B/g, "").trim();
}

function blockToParagraph(el: HTMLElement): HTMLParagraphElement {
  const p = document.createElement("p");
  while (el.firstChild) p.appendChild(el.firstChild);
  if (isEmptyBlock(p)) {
    p.innerHTML = "";
    p.appendChild(document.createElement("br"));
  }
  return p;
}

/** Editor line breaks use divs — normalize to paragraphs for predictable storefront spacing. */
function normalizeDescriptionBlocks(root: HTMLElement) {
  [...root.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? "").replace(/\u00a0/g, " ").trim();
      if (!text) {
        child.parentNode?.removeChild(child);
        return;
      }
      const p = document.createElement("p");
      p.textContent = text;
      child.replaceWith(p);
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    if (el.tagName === "DIV") el.replaceWith(blockToParagraph(el));
  });
}

/** Font size belongs on inline spans only — keeps sizes predictable on the storefront. */
function normalizeFontSizes(node: ParentNode) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;

    if (el.tagName === "FONT") {
      const span = document.createElement("span");
      const legacySize = el.getAttribute("size");
      if (legacySize && LEGACY_FONT_SIZE_MAP[legacySize]) {
        span.style.fontSize = LEGACY_FONT_SIZE_MAP[legacySize];
      }
      while (el.firstChild) span.appendChild(el.firstChild);
      el.replaceWith(span);
      normalizeFontSizes(node);
      return;
    }

    if (BLOCK_TAGS.has(el.tagName)) {
      el.style.removeProperty("font-size");
      if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
    }

    if (el.tagName === "SPAN" && el.style.fontSize) {
      const normalized = normalizeFontSizeValue(el.style.fontSize);
      if (normalized) el.style.fontSize = normalized;
      else el.style.removeProperty("font-size");
    }

    normalizeFontSizes(el);
  });
}

export function sanitizeDescriptionHtml(dirty: string): string {
  if (typeof DOMParser === "undefined") return dirty;
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  sanitizeNode(doc.body);
  normalizeDescriptionBlocks(doc.body);
  normalizeFontSizes(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: ParentNode) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    if (!ALLOWED_TAGS.has(el.tagName)) {
      const parent = el.parentNode;
      while (el.firstChild) parent?.insertBefore(el.firstChild, el);
      parent?.removeChild(el);
      return;
    }
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name === "style") {
        const kept: string[] = [];
        el.style.cssText.split(";").forEach((part) => {
          const [rawKey, ...rest] = part.split(":");
          const key = rawKey?.trim().toLowerCase();
          const val = rest.join(":").trim();
          if (key && val && ALLOWED_STYLES.has(key) && !/expression|url\s*\(/i.test(val)) {
            if (key === "font-size") {
              const normalized = normalizeFontSizeValue(val);
              if (normalized) kept.push(`font-size: ${normalized}`);
            } else {
              kept.push(`${key}: ${val}`);
            }
          }
        });
        if (kept.length) el.setAttribute("style", kept.join("; "));
        else el.removeAttribute("style");
      } else if (name !== "align") {
        el.removeAttribute(attr.name);
      }
    });
    sanitizeNode(el);
  });
}
