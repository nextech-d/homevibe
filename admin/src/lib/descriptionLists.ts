/**
 * Bulleted and numbered lists in the description editor: the toolbar toggle,
 * Enter inside a list, and turning pasted lists - Word, Google Docs, or
 * "• " / "- " / "1. " lines from WhatsApp and the like - into real <ul>/<ol>.
 *
 * Done by hand rather than with execCommand("insertUnorderedList"): browsers
 * disagree about what that writes (Chrome can put the list inside the <p>),
 * and the editor's own Enter handling has to know about lists anyway.
 * Lists are flat - no nesting, no Tab/Shift+Tab.
 */

export type ListKind = "ul" | "ol";

const BULLET_MARK = /^[\s\u00a0]*[•·●▪◦‣∙■□➤►✓✔\-–—*][\s\u00a0]+/;
const NUMBER_MARK = /^[\s\u00a0]*\d{1,3}[.)][\s\u00a0]+/;

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE"]);
const LIST_TAGS = new Set(["UL", "OL"]);

/** The kind of list a line of text looks like an item of, by its leading marker. */
export function lineListKind(text: string): ListKind | null {
  if (BULLET_MARK.test(text)) return "ul";
  if (NUMBER_MARK.test(text)) return "ol";
  return null;
}

function markerFor(kind: ListKind): RegExp {
  return kind === "ul" ? BULLET_MARK : NUMBER_MARK;
}

function isEmpty(el: Node): boolean {
  return !(el.textContent ?? "").replace(/[\u00a0\u200B]/g, " ").trim();
}

function emptyBlock(tag: "p" | "li"): HTMLElement {
  const el = document.createElement(tag);
  el.appendChild(document.createElement("br"));
  return el;
}

/** Removes a leading list marker from the first text inside el. */
function stripLeadingMarker(el: HTMLElement, marker: RegExp) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    if (!text.replace(/\u00a0/g, " ").trim()) continue;
    node.textContent = text.replace(marker, "");
    return;
  }
}

/** A block's contents moved into a new <li>, keeping its alignment. */
function blockToItem(block: HTMLElement): HTMLLIElement {
  const li = document.createElement("li");
  const style = block.getAttribute("style");
  if (style) li.setAttribute("style", style);
  while (block.firstChild) li.appendChild(block.firstChild);
  if (isEmpty(li) && !li.querySelector("br")) li.appendChild(document.createElement("br"));
  return li;
}

function itemToParagraph(li: HTMLElement): HTMLParagraphElement {
  const p = document.createElement("p");
  const style = li.getAttribute("style");
  if (style) p.setAttribute("style", style);
  while (li.firstChild) p.appendChild(li.firstChild);
  if (isEmpty(p) && !p.querySelector("br")) p.appendChild(document.createElement("br"));
  return p;
}

/** Joins a list with same-kind lists directly before and after it. */
function mergeAdjacent(list: HTMLElement) {
  const prev = list.previousElementSibling;
  if (prev && prev.tagName === list.tagName) {
    while (list.firstChild) prev.appendChild(list.firstChild);
    list.remove();
    list = prev as HTMLElement;
  }
  const next = list.nextElementSibling;
  if (next && next.tagName === list.tagName) {
    while (next.firstChild) list.appendChild(next.firstChild);
    next.remove();
  }
}

function setCursor(sel: Selection, node: Node, atEnd: boolean) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(!atEnd);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** The nearest ancestor matching selector that is inside the editor (not the editor itself). */
export function closestInEditor(editor: HTMLElement, node: Node | null, selector: string): HTMLElement | null {
  const start = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement | null);
  const found = start?.closest?.(selector) as HTMLElement | null | undefined;
  return found && found !== editor && editor.contains(found) ? found : null;
}

/** Everything in block after the range's start, as a new sibling of the same kind. */
function splitAfter(block: HTMLElement, range: Range): HTMLElement {
  const tail = range.cloneRange();
  tail.setEnd(block, block.childNodes.length);
  const after = block.cloneNode(false) as HTMLElement;
  after.appendChild(tail.extractContents());
  return after;
}

/** Loose text and inline nodes at the editor's top level, wrapped in paragraphs. */
function wrapLooseInline(editor: HTMLElement) {
  let run: Node[] = [];
  const flush = () => {
    if (run.some((n) => !isEmpty(n) || n.nodeName === "BR")) {
      const p = document.createElement("p");
      run[0].parentNode?.insertBefore(p, run[0]);
      run.forEach((n) => p.appendChild(n));
    }
    run = [];
  };
  [...editor.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((node as Element).tagName)) flush();
    else run.push(node);
  });
  flush();
}

/**
 * wrapLooseInline, keeping the selection where it was: moving nodes resets
 * live ranges, so the boundaries are noted first and put back after.
 */
function wrapLooseInlineKeepingSelection(editor: HTMLElement, sel: Selection): Range {
  const r = sel.getRangeAt(0);
  const b = { sc: r.startContainer, so: r.startOffset, ec: r.endContainer, eo: r.endOffset };
  wrapLooseInline(editor);
  const next = document.createRange();
  try {
    next.setStart(b.sc, b.so);
    next.setEnd(b.ec, b.eo);
  } catch {
    next.selectNodeContents(editor);
    next.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(next);
  return next;
}

/**
 * The toolbar's list button. Paragraphs in the selection become items of a
 * list of this kind (joining a neighbouring one); if the selection is
 * already all items of this kind, they go back to being paragraphs; items
 * of the other kind switch kind.
 */
export function toggleList(editor: HTMLElement, kind: ListKind) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  if (!editor.contains(sel.getRangeAt(0).commonAncestorContainer)) return;
  const range = wrapLooseInlineKeepingSelection(editor, sel);

  // Text nodes survive the moves below; element boundaries are mapped as
  // the elements they sit in are replaced.
  const bounds = { sc: range.startContainer, so: range.startOffset, ec: range.endContainer, eo: range.endOffset };
  const replaced = new Map<Node, Node>();

  const touched = [...editor.children].filter(
    (el) => range.intersectsNode(el) && el.tagName !== "TABLE",
  ) as HTMLElement[];

  if (touched.length === 0) {
    const list = document.createElement(kind);
    const li = emptyBlock("li");
    list.appendChild(li);
    editor.appendChild(list);
    setCursor(sel, li, false);
    return;
  }

  // Split partly-selected lists so the selected items have a list of their own.
  const units: HTMLElement[] = touched.flatMap((el) => {
    if (!LIST_TAGS.has(el.tagName)) return [el];
    const items = [...el.children] as HTMLElement[];
    const chosen = items.filter((li) => range.intersectsNode(li));
    if (chosen.length === 0 || chosen.length === items.length) return [el];
    const first = items.indexOf(chosen[0]);
    const last = items.indexOf(chosen[chosen.length - 1]);
    if (first > 0) {
      const before = el.cloneNode(false) as HTMLElement;
      items.slice(0, first).forEach((li) => before.appendChild(li));
      el.before(before);
    }
    if (last < items.length - 1) {
      const after = el.cloneNode(false) as HTMLElement;
      items.slice(last + 1).forEach((li) => after.appendChild(li));
      el.after(after);
    }
    return [el];
  });

  const unlisting = units.every((el) => el.tagName.toLowerCase() === kind);
  let lastNode: Node;

  if (unlisting) {
    const paragraphs: HTMLElement[] = [];
    units.forEach((list) => {
      const ps = ([...list.children] as HTMLElement[]).map((li) => {
        const p = itemToParagraph(li);
        replaced.set(li, p);
        return p;
      });
      list.replaceWith(...ps);
      replaced.set(list, ps[ps.length - 1] ?? editor);
      paragraphs.push(...ps);
    });
    lastNode = paragraphs[paragraphs.length - 1];
  } else {
    const list = document.createElement(kind);
    units[0].before(list);
    units.forEach((unit) => {
      if (LIST_TAGS.has(unit.tagName)) {
        while (unit.firstChild) list.appendChild(unit.firstChild);
        replaced.set(unit, list);
      } else {
        const li = blockToItem(unit);
        replaced.set(unit, li);
        list.appendChild(li);
      }
      unit.remove();
    });
    lastNode = list.lastElementChild ?? list;
    mergeAdjacent(list);
  }

  const map = (node: Node) => (editor.contains(node) ? node : replaced.get(node));
  const sc = map(bounds.sc);
  const ec = map(bounds.ec);
  const next = document.createRange();
  try {
    if (!sc || !ec || sc !== bounds.sc || ec !== bounds.ec) throw new Error("moved");
    next.setStart(sc, bounds.so);
    next.setEnd(ec, bounds.eo);
    sel.removeAllRanges();
    sel.addRange(next);
  } catch {
    setCursor(sel, (ec && editor.contains(ec) ? ec : lastNode) ?? editor, true);
  }
}

/**
 * Enter inside a list item. On an item with text it starts a new item with
 * whatever followed the cursor; on an empty item it ends the list there,
 * leaving a paragraph (and the items after it, if any, in a list of their
 * own). Returns false when the cursor isn't in a list item.
 */
export function handleListEnter(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  const li = closestInEditor(editor, range.startContainer, "li");
  const list = li?.parentElement;
  if (!li || !list || !LIST_TAGS.has(list.tagName)) return false;

  range.deleteContents();

  if (isEmpty(li)) {
    const rest: Element[] = [];
    for (let n = li.nextElementSibling; n; n = n.nextElementSibling) rest.push(n);
    if (rest.length) {
      const tailList = list.cloneNode(false) as HTMLElement;
      rest.forEach((n) => tailList.appendChild(n));
      list.after(tailList);
    }
    const p = emptyBlock("p");
    list.after(p);
    li.remove();
    if (!list.querySelector("li")) list.remove();
    setCursor(sel, p, false);
    return true;
  }

  const after = splitAfter(li, range);
  if (isEmpty(after) && !after.querySelector("br")) {
    after.innerHTML = "";
    after.appendChild(document.createElement("br"));
  }
  if (isEmpty(li) && !li.querySelector("br")) li.appendChild(document.createElement("br"));
  li.after(after);
  setCursor(sel, after, false);
  return true;
}

// ---------------------------------------------------------------- paste

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Word marks list paragraphs with a class or an mso-list style, and writes the marker in a span. */
function wordListKind(el: HTMLElement): ListKind | null | undefined {
  const isWordItem =
    /MsoListParagraph/i.test(el.className) || /mso-list\s*:\s*l\d/i.test(el.getAttribute("style") ?? "");
  if (!isWordItem) return undefined;
  const marker = [...el.querySelectorAll("span")].find((s) =>
    /mso-list\s*:\s*ignore/i.test(s.getAttribute("style") ?? ""),
  );
  if (!marker) {
    const kind = lineListKind(el.textContent ?? "") ?? "ul";
    stripLeadingMarker(el, markerFor(kind));
    return kind;
  }
  const text = (marker.textContent ?? "").replace(/[\s\u00a0]/g, "");
  marker.remove();
  return /^(?:\d+|[a-z]{1,4})[.)]$/i.test(text) ? "ol" : "ul";
}

/**
 * Pasted HTML with its lists made real, or null if there are none (so the
 * browser's own paste is left alone). Google Docs already sends <ul>/<li>;
 * Word sends paragraphs with markers; anything else may send "- " lines.
 */
export function listifyPastedHtml(html: string): string | null {
  const body = new DOMParser().parseFromString(html, "text/html").body;

  // Google Docs wraps the whole fragment in one <b id="docs-internal-guid-…">.
  body.querySelectorAll('b[id^="docs-internal-guid"]').forEach((b) => b.replaceWith(...b.childNodes));
  // Google Docs puts a paragraph inside each item.
  body.querySelectorAll("li > p").forEach((p) => p.replaceWith(...p.childNodes));

  // Word may wrap its paragraphs in a section <div>: group inside divs too,
  // innermost first.
  const containers = [...body.querySelectorAll("div")].reverse() as HTMLElement[];
  [...containers, body].forEach(groupListItems);

  return body.querySelector("ul, ol") ? body.innerHTML : null;
}

/** Turns runs of list-like paragraphs directly inside container into lists. */
function groupListItems(container: HTMLElement) {
  let current: HTMLElement | null = null;
  ([...container.children] as HTMLElement[]).forEach((el) => {
    let kind: ListKind | null | undefined = null;
    if (el.tagName === "P" || el.tagName === "DIV") {
      kind = wordListKind(el);
      if (kind === undefined) {
        kind = lineListKind(el.textContent ?? "");
        if (kind) stripLeadingMarker(el, markerFor(kind));
      }
    }
    if (!kind) {
      current = null;
      return;
    }
    const li = blockToItem(el);
    if (!current || current.tagName.toLowerCase() !== kind || el.previousElementSibling !== current) {
      current = document.createElement(kind);
      el.before(current);
    }
    current.appendChild(li);
    el.remove();
  });
}

/** Pasted plain text with "• " / "- " / "1. " lines as real lists, or null if it has none. */
export function listifyPastedText(text: string): string | null {
  const lines = text.split(/\r?\n/);
  if (!lines.some((line) => lineListKind(line))) return null;

  const out: string[] = [];
  let open: ListKind | null = null;
  const close = () => {
    if (open) out.push(`</${open}>`);
    open = null;
  };
  lines.forEach((line) => {
    const kind = lineListKind(line);
    if (kind) {
      if (open !== kind) {
        close();
        out.push(`<${kind}>`);
        open = kind;
      }
      out.push(`<li>${escapeHtml(line.replace(markerFor(kind), "").trim())}</li>`);
    } else {
      close();
      if (line.trim()) out.push(`<p>${escapeHtml(line.trim())}</p>`);
    }
  });
  close();
  return out.join("");
}

/**
 * Puts pasted blocks (some of them lists) at the cursor: the block the
 * cursor is in is split around them, and an empty one is replaced. Inside a
 * list, everything pasted joins the list as items.
 */
export function insertBlocksAtCursor(editor: HTMLElement, html: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;
  range.deleteContents();

  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes = [...template.content.childNodes].filter((n) => !isEmpty(n) || n.nodeName !== "#text");
  if (nodes.length === 0) return;

  const li = closestInEditor(editor, range.startContainer, "li");
  if (li) {
    const items = nodes.flatMap((n): HTMLElement[] => {
      if (n.nodeType !== Node.ELEMENT_NODE) {
        const item = document.createElement("li");
        item.appendChild(n);
        return [item];
      }
      const el = n as HTMLElement;
      if (LIST_TAGS.has(el.tagName)) return [...el.children] as HTMLElement[];
      if (el.tagName === "LI") return [el];
      return [blockToItem(el)];
    });
    const after = splitAfter(li, range);
    li.after(...items, ...(isEmpty(after) ? [] : [after]));
    if (isEmpty(li)) li.remove();
    setCursor(sel, items[items.length - 1], true);
    return;
  }

  const stable = wrapLooseInlineKeepingSelection(editor, sel);
  const start = stable.startContainer;
  const top = [...editor.children].find((el) => el === start || el.contains(start)) as HTMLElement | undefined;

  if (!top) {
    // The cursor sits directly in the editor (it's empty, or between blocks).
    const marker = document.createTextNode("");
    stable.insertNode(marker);
    marker.replaceWith(...nodes);
  } else {
    const after = splitAfter(top, stable);
    top.after(...nodes, ...(isEmpty(after) ? [] : [after]));
    if (isEmpty(top) && !LIST_TAGS.has(top.tagName)) top.remove();
  }
  const last = nodes[nodes.length - 1];
  setCursor(sel, last.nodeType === Node.ELEMENT_NODE && LIST_TAGS.has(last.nodeName) ? (last as Element).lastElementChild ?? last : last, true);
}
