import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findClaimProblems, validateProductClaims } from "./claims";

/** The guard's verdict on copy, before and after the "promises checked" tick. */
function verdict(copy: string) {
  return {
    severities: findClaimProblems([copy]).map((p) => p.severity),
    unticked: validateProductClaims([copy], { claimsChecked: false }),
    ticked: validateProductClaims([copy], { claimsChecked: true }),
  };
}

// The spec table from the Hisense WF3S1043BT long-form. A markdown table has
// no full stops, so the guard reads all of it as one sentence.
const SPEC_TABLE = `### What you're getting

| Feature | Specification |
|---|---|
| Capacity | 10.5kg (washer only, no dryer) |
| Max spin | 1400 RPM |
| Warranty | 2 years, Hisense manufacturer warranty (card in the box) |`;

const WARRANTY_FAQ =
  "2 years from Hisense, parts and labour, with the Hisense warranty card in the box. It runs alongside our own 12-month service cover: if anything goes wrong, call us first and our technicians will check it at your home and sort out the claim with you.";

test("a manufacturer warranty in a spec table needs the tick, and passes with it", () => {
  const v = verdict(SPEC_TABLE);
  assert.ok(!v.severities.includes("contradiction"));
  assert.ok(v.severities.includes("unverified"));
  assert.match(v.unticked ?? "", /promises something nobody has checked/);
  assert.equal(v.ticked, null);
});

test("a warranty-card FAQ answer needs the tick, and passes with it", () => {
  const v = verdict(`What's the warranty? . ${WARRANTY_FAQ}`);
  assert.ok(!v.severities.includes("contradiction"));
  assert.ok(v.unticked);
  assert.equal(v.ticked, null);
});

test("a longer warranty with no attribution is still refused, tick or not", () => {
  const v = verdict("Comes with a 2-year warranty.");
  assert.ok(v.severities.includes("contradiction"));
  assert.match(v.ticked ?? "", /contradicts what we offer/);
});

test("a longer warranty promised by us is still refused, tick or not", () => {
  const v = verdict("Includes a 24 months warranty from HomeVibe.");
  assert.ok(v.severities.includes("contradiction"));
  assert.match(v.ticked ?? "", /contradicts what we offer/);
});

test("our own 12 months is not a warranty problem", () => {
  assert.deepEqual(verdict("Every machine has a 12-month warranty on parts and labour.").severities, []);
});

test("the API's copy of the rules matches this one", () => {
  // Only the header comments differ: each says where the other copy lives.
  const code = (path: string) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    return source.slice(source.indexOf(" */\n") + 4);
  };
  assert.equal(code("../../api/src/lib/claims.ts"), code("./claims.ts"));
});
