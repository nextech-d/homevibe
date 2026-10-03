export type ParsedFaq = {
  question: string;
  answer: string;
  /** Set when a pair looks wrong, so the preview can say why rather than saving it silently. */
  warning?: string;
};

/** **Bold**, "Q:", "1." and list markers all get stripped off a question line. */
function cleanQuestion(line: string): string {
  return line
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/^\s*(?:\*\*|__)?\s*q(?:uestion)?\s*[:.]\s*/i, "")
    .replace(/^\s*(?:\*\*|__)/, "")
    .replace(/(?:\*\*|__)\s*$/, "")
    .trim();
}

function cleanAnswer(lines: string[]): string {
  return lines
    .map((line) =>
      line
        .replace(/^\s*(?:\*\*|__)?\s*a(?:nswer)?\s*[:.]\s*/i, "")
        .replace(/^\s*[-*+]\s+/, "")
        .trim()
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Turns a pasted block into question and answer rows.
 *
 * Forgiving on purpose: pairs are separated by blank lines, the first line of a
 * pair is the question and the rest is the answer, and "Q:"/"A:" prefixes, bold
 * markers, list bullets and numbering are all stripped. A pair that arrives
 * without an answer still comes back, carrying a warning, so a bad paste is
 * visible in the preview instead of saving as an empty row.
 */
export function parseFaqBlock(input: string): ParsedFaq[] {
  const blocks = input
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsed: ParsedFaq[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim());
    if (lines.length === 0) continue;

    // A single line that ends in a question mark is a question with no answer
    // yet; a single line that doesn't is most likely a stray heading.
    const question = cleanQuestion(lines[0]);
    const answer = cleanAnswer(lines.slice(1));

    if (!question) continue;
    if (!answer) {
      parsed.push({ question, answer: "", warning: "No answer found in this block" });
      continue;
    }
    parsed.push({ question, answer });
  }

  return parsed;
}
