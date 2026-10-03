/**
 * Converts pasted HTML to the markdown the long-form field stores.
 *
 * Word, Docs and web pages all put an HTML flavour on the clipboard alongside
 * the plain text; without this, that flavour is thrown away and the writer
 * retypes every # and ** by hand. Only the constructs the storefront's renderer
 * understands are produced - headings, bold, italic, links, lists, tables -
 * and anything else degrades to its text.
 */
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
      // Word wraps whole paragraphs in <b>; bolding an empty string produces "****".
      return text ? `**${text}**` : "";
    case "EM":
    case "I":
      return text ? `*${text}*` : "";
    case "CODE":
      return text ? `\`${text}\`` : "";
    case "A": {
      const href = el.getAttribute("href");
      return href && text ? `[${text}](${href})` : text;
    }
    default:
      return inner;
  }
}

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

  if (tag === "P" || tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "BODY") {
    // A container holding block children is walked rather than flattened.
    const hasBlockChildren = Array.from(el.children).some((c) =>
      /^(H[1-6]|UL|OL|TABLE|P|DIV|SECTION|ARTICLE|BLOCKQUOTE)$/.test(c.tagName)
    );
    if (hasBlockChildren) {
      Array.from(el.children).forEach((child) => block(child, out));
      return;
    }
    const text = inline(el).trim();
    if (text) out.push(text);
    return;
  }

  if (tag === "BLOCKQUOTE") {
    const text = inline(el).trim();
    if (text) out.push("> " + text);
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
