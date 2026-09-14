import { useEffect, useRef } from "react";
import {
  descriptionLooksLikeHtml,
  plainTextToDescriptionHtml,
  sanitizeDescriptionHtml,
} from "../lib/descriptionHtml";
import { storefrontLabelClass } from "./StorefrontPanel";

const FONT_SIZES = ["11", "12", "14", "16", "18", "24", "36"];

const toolBtn =
  "inline-flex h-7 min-w-7 items-center justify-center rounded border border-[#333] bg-[#0a0a0a] px-1.5 text-[11px] text-neutral-300 hover:border-[#00e599]/50 hover:text-white";

type DescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export default function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const sizeSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* unsupported in some browsers */
    }
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    const html = descriptionLooksLikeHtml(value)
      ? sanitizeDescriptionHtml(value)
      : plainTextToDescriptionHtml(value);
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value]);

  function saveSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    const range = savedRange.current;
    if (!sel || !range) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function emit() {
    const html = sanitizeDescriptionHtml(editorRef.current?.innerHTML ?? "");
    onChange(html);
  }

  function run(command: string, arg?: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    emit();
  }

  function stripFontSizeFromNode(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;

    if (el.tagName === "FONT") {
      const parent = el.parentNode;
      if (!parent) return;
      const children = [...el.childNodes];
      children.forEach((child) => parent.insertBefore(child, el));
      parent.removeChild(el);
      children.forEach((child) => stripFontSizeFromNode(child));
      return;
    }

    el.style.removeProperty("font-size");
    if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");

    [...el.childNodes].forEach((child) => stripFontSizeFromNode(child));
  }

  function applyFontSize(px: string) {
    const size = `${px}px`;
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = size;
      span.appendChild(document.createTextNode("\u200B"));
      range.insertNode(span);
      const cursor = document.createRange();
      cursor.setStart(span.firstChild!, 1);
      cursor.collapse(true);
      sel.removeAllRanges();
      sel.addRange(cursor);
      savedRange.current = cursor.cloneRange();
      emit();
      if (sizeSelectRef.current) sizeSelectRef.current.value = px;
      return;
    }

    const extracted = range.extractContents();
    const holder = document.createElement("div");
    holder.appendChild(extracted);
    stripFontSizeFromNode(holder);

    const span = document.createElement("span");
    span.style.fontSize = size;
    while (holder.firstChild) span.appendChild(holder.firstChild);

    range.insertNode(span);

    const next = document.createRange();
    next.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(next);
    savedRange.current = next.cloneRange();
    emit();

    if (sizeSelectRef.current) sizeSelectRef.current.value = px;
  }

  function currentBlock(): HTMLElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    return (node as HTMLElement | null)?.closest("p, div") ?? null;
  }

  function splitBlockAtCursor(range: Range): HTMLElement | null {
    const block = currentBlock();
    if (!block || !editorRef.current?.contains(block)) return null;

    const trailing = range.cloneRange();
    trailing.setEnd(block, block.childNodes.length);
    const after = trailing.extractContents();

    const newBlock = document.createElement("p");
    if (after.textContent?.replace(/\u200B/g, "").trim() || after.querySelector("br")) {
      newBlock.appendChild(after);
    } else {
      newBlock.appendChild(document.createElement("br"));
    }

    if (isEmptyBlock(block)) {
      block.innerHTML = "";
      block.appendChild(document.createElement("br"));
    }

    block.parentNode?.insertBefore(newBlock, block.nextSibling);
    return newBlock;
  }

  function isEmptyBlock(el: HTMLElement): boolean {
    return !(el.textContent ?? "").replace(/\u200B/g, "").trim();
  }

  function applyParagraphFormat() {
    editorRef.current?.focus();
    restoreSelection();
    const block = currentBlock();
    if (block && editorRef.current?.contains(block) && block.tagName !== "P") {
      const p = document.createElement("p");
      while (block.firstChild) p.appendChild(block.firstChild);
      if (isEmptyBlock(p)) p.appendChild(document.createElement("br"));
      block.replaceWith(p);
      const sel = window.getSelection();
      if (sel) {
        const cursor = document.createRange();
        cursor.selectNodeContents(p);
        cursor.collapse(false);
        sel.removeAllRanges();
        sel.addRange(cursor);
        savedRange.current = cursor.cloneRange();
      }
    } else {
      document.execCommand("formatBlock", false, "p");
    }
    saveSelection();
    emit();
  }

  function insertNewParagraph() {
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const block = currentBlock();
    if (block && block.tagName !== "P") {
      const p = document.createElement("p");
      while (block.firstChild) p.appendChild(block.firstChild);
      block.replaceWith(p);
    }

    const newBlock = splitBlockAtCursor(range);
    if (newBlock) {
      const cursor = document.createRange();
      cursor.setStart(newBlock, 0);
      cursor.collapse(true);
      sel.removeAllRanges();
      sel.addRange(cursor);
      savedRange.current = cursor.cloneRange();
    } else {
      document.execCommand("insertParagraph");
    }
    saveSelection();
    emit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertNewParagraph();
    }
  }

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className={`${storefrontLabelClass} mb-0`}>Description</label>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            title="Bold"
            className={`${toolBtn} font-bold`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("bold")}
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            className={`${toolBtn} italic`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("italic")}
          >
            I
          </button>
          <button
            type="button"
            title="Underline"
            className={`${toolBtn} underline`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("underline")}
          >
            U
          </button>
          <button
            type="button"
            title="New paragraph"
            className={toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertNewParagraph}
          >
            ¶
          </button>
          <button
            type="button"
            title="Format as paragraph"
            className={`${toolBtn} text-[9px]`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyParagraphFormat}
          >
            P
          </button>
          <select
            ref={sizeSelectRef}
            title="Font size"
            defaultValue="14"
            className="h-7 rounded border border-[#333] bg-[#0a0a0a] px-1 text-[11px] text-neutral-300"
            onMouseDown={() => saveSelection()}
            onChange={(e) => applyFontSize(e.target.value)}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Align left"
            className={toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("justifyLeft")}
          >
            L
          </button>
          <button
            type="button"
            title="Align center"
            className={toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("justifyCenter")}
          >
            C
          </button>
          <button
            type="button"
            title="Align right"
            className={toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run("justifyRight")}
          >
            R
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Description"
        className="min-h-[180px] w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm leading-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#00e599]/40 focus:outline-none focus:ring-1 focus:ring-[#00e599]/20 [&_div]:mb-3 [&_div]:min-h-[1.25em] [&_div:last-child]:mb-0 [&_p]:mb-3 [&_p]:min-h-[1.25em] [&_p:last-child]:mb-0"
        onInput={emit}
        onBlur={emit}
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onSelect={saveSelection}
      />
    </div>
  );
}
