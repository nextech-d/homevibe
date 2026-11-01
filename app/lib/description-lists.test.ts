// Lists survive the shared description sanitiser (shared/description-sanitize.ts),
// which the storefront applies on render and the API on save.
import { test } from "node:test";
import assert from "node:assert/strict";
import sanitizeHtml from "sanitize-html";
import { parseFragment, serialize } from "parse5";
import { sanitizeDescription } from "../../shared/description-sanitize";

const sanitize = (html: string) =>
  sanitizeDescription(html, { sanitizeHtml, reparse: (h) => serialize(parseFragment(h)) });

test("ul, ol and li survive, with only the allowed attributes", () => {
  assert.equal(
    sanitize('<p>Intro</p><ul class="x" data-a="1" style="text-align: center"><li id="a">One</li><li>Two</li></ul><ol start="3" type="a"><li value="9">First</li></ol>'),
    '<p>Intro</p><ul style="text-align:center"><li>One</li><li>Two</li></ul><ol><li>First</li></ol>',
  );
});

test("a list item's font size is dropped, like any block's", () => {
  assert.equal(sanitize('<ul><li style="font-size: 18px">A</li></ul>'), "<ul><li>A</li></ul>");
});
