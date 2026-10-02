function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 hover:underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-100 px-1 py-0.5 text-sm">$1</code>');
}

/** A table's second line: |---|:--:|---:| with optional colons for alignment. */
const TABLE_DELIMITER = /^\|?[\s:-]*-[\s:|-]*\|?$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Column alignment from the delimiter row; left is the default and needs no style. */
function columnAlignments(delimiter: string): (string | null)[] {
  return splitRow(delimiter).map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return null;
  });
}

function cell(tag: "th" | "td", text: string, align: string | null | undefined): string {
  const classes =
    tag === "th"
      ? "border-b border-neutral-300 px-3 py-2 font-semibold text-neutral-900"
      : "border-b border-neutral-200 px-3 py-2 align-top";
  const style = align ? ` style="text-align:${align}"` : "";
  return `<${tag} class="${classes}"${style}>${inlineMarkdown(escapeHtml(text))}</${tag}>`;
}

/**
 * Minimal markdown → HTML for content posts and product long-form copy
 * (headings, lists, paragraphs, links, tables).
 */
export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    // A pipe row followed by a delimiter row starts a table. Everything else
    // containing a pipe is left alone and renders as an ordinary paragraph.
    const next = lines[index + 1]?.trim();
    if (trimmed.includes("|") && next && TABLE_DELIMITER.test(next) && next.includes("-")) {
      closeList();
      const headers = splitRow(trimmed);
      const aligns = columnAlignments(next);
      index += 2;

      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitRow(lines[index].trim()));
        index++;
      }
      index--; // the loop's own increment takes us past the last row

      const headerCells = headers.map((text, i) => cell("th", text, aligns[i])).join("");
      const bodyRows = rows
        .map((row) => {
          const cells = headers
            // Ragged rows are padded or trimmed to the header, so the markup
            // stays valid whatever was pasted in.
            .map((_, i) => cell("td", row[i] ?? "", aligns[i]))
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      // Scrolls in its own box: a wide table must not make the page scroll.
      html.push(
        `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse text-left text-sm text-neutral-700"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3 class="mt-8 text-lg font-semibold text-neutral-900">${inlineMarkdown(escapeHtml(trimmed.slice(4)))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2 class="mt-10 text-xl font-semibold text-neutral-900">${inlineMarkdown(escapeHtml(trimmed.slice(3)))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1 class="mt-10 text-2xl font-bold text-neutral-900">${inlineMarkdown(escapeHtml(trimmed.slice(2)))}</h1>`);
      continue;
    }
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push('<ul class="my-4 list-disc space-y-2 pl-6 text-neutral-700">');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(escapeHtml(trimmed.slice(2)))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="my-4 leading-relaxed text-neutral-700">${inlineMarkdown(escapeHtml(trimmed))}</p>`);
  }

  closeList();
  return html.join("\n");
}

export function formatContentDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
