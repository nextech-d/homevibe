/**
 * The allowlist for product description HTML, as sanitize-html options.
 *
 * Shared by the storefront (sanitising on render) and the API (sanitising on
 * save), so the two can never disagree about what a description may contain.
 * Like everything in shared/, it imports nothing - not even sanitize-html's
 * types - because the API's build can't see the root node_modules; each side
 * passes these options to its own copy of sanitize-html.
 *
 * It keeps what the admin's description editor produces and what live
 * descriptions use (p, br, span, b, div; style with font-size, font-weight,
 * font-style, text-align, color), plus the rest of the paste allowlist: i,
 * strong, em, u, headings, lists, tables, and links to http(s), mailto and tel.
 *
 * The transforms reproduce the editor's own normalising, so a description
 * sanitised here renders as it always has: <font size> becomes a sized span,
 * blocks don't carry font sizes, and span sizes are whole pixels.
 */

type Attribs = Record<string, string>;
type Transformed = { tagName: string; attribs: Attribs };

const LEGACY_FONT_SIZE_MAP: Record<string, string> = {
  "1": "11px",
  "2": "12px",
  "3": "14px",
  "4": "16px",
  "5": "18px",
  "6": "24px",
  "7": "36px",
};

const BLOCK_TAGS = ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li"];

const TABLE_TAGS = ["table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td"];

export const DESCRIPTION_ALLOWED_TAGS = [
  "p", "div", "span", "br",
  "b", "strong", "i", "em", "u",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a",
  ...TABLE_TAGS,
];

/** A whole or fractional pixel size - the only font-size the editor writes. */
const PX = /^\d+(?:\.\d+)?px$/;

/** Splits a style attribute into [property, value] pairs, lower-casing the property. */
function styleEntries(style: string | undefined): [string, string][] {
  if (!style) return [];
  return style
    .split(";")
    .map((part) => {
      const [rawKey, ...rest] = part.split(":");
      return [rawKey?.trim().toLowerCase() ?? "", rest.join(":").trim()] as [string, string];
    })
    .filter(([key, value]) => key && value);
}

function withStyle(attribs: Attribs, entries: [string, string][]): Attribs {
  const next = { ...attribs };
  if (entries.length) next.style = entries.map(([k, v]) => `${k}: ${v}`).join("; ");
  else delete next.style;
  return next;
}

/** Blocks keep their other styles but never a font size - sizes live on spans. */
function stripFontSize(tagName: string, attribs: Attribs): Transformed {
  return {
    tagName,
    attribs: withStyle(attribs, styleEntries(attribs.style).filter(([k]) => k !== "font-size")),
  };
}

/** Span sizes are rounded to whole pixels; anything that isn't px is dropped. */
function normaliseSpan(tagName: string, attribs: Attribs): Transformed {
  const entries = styleEntries(attribs.style).flatMap(([k, v]): [string, string][] => {
    if (k !== "font-size") return [[k, v]];
    const px = PX.test(v.toLowerCase()) ? `${Math.round(parseFloat(v))}px` : null;
    return px ? [[k, px]] : [];
  });
  return { tagName, attribs: withStyle(attribs, entries) };
}

/** <font size="4"> → <span style="font-size: 16px">, as the editor does. */
function fontToSpan(_tagName: string, attribs: Attribs): Transformed {
  const size = LEGACY_FONT_SIZE_MAP[attribs.size ?? ""];
  const next: Attribs = size ? { style: `font-size: ${size}` } : {};
  return { tagName: "span", attribs: next };
}

/** Links leave the site in a new tab, without referrer or ranking signal. */
function safeLink(tagName: string, attribs: Attribs): Transformed {
  return {
    tagName,
    attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" },
  };
}

export function descriptionSanitizeOptions() {
  return {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["style", "align"],
      a: ["href", "target", "rel"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    } as Record<string, string[]>,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        "font-size": [PX],
        "font-weight": [/^(?:normal|bold|bolder|lighter|[1-9]00)$/i],
        "font-style": [/^(?:normal|italic|oblique)$/i],
        "text-decoration": [/^(?:none|underline|overline|line-through)(?:\s+[a-z-]+)*$/i],
        "text-align": [/^(?:left|right|center|justify|start|end)$/i],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*[\d.\s,%]+\)$/i, /^[a-z]+$/i],
      },
    } as Record<string, Record<string, RegExp[]>>,
    transformTags: {
      font: fontToSpan,
      span: normaliseSpan,
      a: safeLink,
      ...Object.fromEntries(BLOCK_TAGS.map((tag) => [tag, stripFontSize])),
    } as Record<string, (tagName: string, attribs: Attribs) => Transformed>,
  };
}

const VOID_TAGS = new Set(["br", "col", "hr", "img", "wbr"]);

/** Text content of a fragment of sanitised HTML, as the editor measures emptiness. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;| /g, " ")
    .replace(/&#8203;|​/g, "")
    .trim();
}

/**
 * The editor's top-level normalising, on sanitised HTML: loose text becomes a
 * paragraph, a top-level <div> (what contenteditable makes of a new line)
 * becomes a plain <p>, and an empty one becomes <p><br></p>. Only the top
 * level changes - nested markup is left exactly as sanitised.
 *
 * A tag scanner is enough because the input is sanitize-html's output:
 * well-formed, no comments or scripts, every attribute quoted and escaped.
 */
function normaliseTopLevel(html: string): string {
  const tokens = html.split(/(<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>)/);
  const out: string[] = [];
  let depth = 0;
  let topTag: string | null = null;
  let topBuffer: string[] = [];

  for (const token of tokens) {
    if (!token) continue;
    const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(token);

    if (!tag) {
      if (depth > 0) topBuffer.push(token);
      else {
        const text = token.replace(/&nbsp;| /g, " ").trim();
        if (text) out.push(`<p>${text}</p>`);
      }
      continue;
    }

    const closing = tag[1] === "/";
    const name = tag[2].toLowerCase();
    const selfClosing = VOID_TAGS.has(name) || /\/>$/.test(token);

    if (depth === 0 && !closing) {
      if (selfClosing) {
        out.push(token);
        continue;
      }
      topTag = name;
      topBuffer = [token];
      depth = 1;
      continue;
    }

    topBuffer.push(token);
    if (selfClosing) continue;
    depth += closing ? -1 : 1;

    if (depth === 0) {
      if (topTag === "div") {
        const inner = topBuffer.slice(1, -1).join("");
        out.push(textOf(inner) ? `<p>${inner}</p>` : "<p><br /></p>");
      } else {
        out.push(topBuffer.join(""));
      }
      topTag = null;
      topBuffer = [];
    }
  }
  if (topBuffer.length) out.push(topBuffer.join(""));
  return out.join("");
}

export type DescriptionSanitizerDeps = {
  /** sanitize-html, from the caller's own node_modules. */
  sanitizeHtml: (dirty: string, options: ReturnType<typeof descriptionSanitizeOptions>) => string;
  /**
   * Parse and re-serialise with a spec-compliant HTML5 parser (parse5).
   * sanitize-html's parser doesn't repair misnested markup the way browsers
   * do - an unclosed <b> carries its bold into the paragraphs after it in a
   * browser, and simply closes in htmlparser2 - so descriptions are first
   * put into the shape a browser would give them.
   */
  reparse: (html: string) => string;
};

/**
 * Sanitises a product description: browser-equivalent parsing, the allowlist
 * above, then the editor's top-level normalising. The caller passes its own
 * sanitize-html and parse5, which keeps this file free of imports.
 */
export function sanitizeDescription(html: string, deps: DescriptionSanitizerDeps): string {
  return normaliseTopLevel(deps.sanitizeHtml(deps.reparse(html), descriptionSanitizeOptions()));
}
