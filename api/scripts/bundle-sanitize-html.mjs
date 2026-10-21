/**
 * Bundles sanitize-html, htmlparser2 included, into one ES module at
 * src/vendor/sanitize-html.js, which description-html.ts imports.
 *
 * sanitize-html 2.17.7 is CommonJS and require()s htmlparser2 12, which is
 * ES-module only. Vercel's runtime refuses that require() (ERR_REQUIRE_ESM),
 * and the gateway function crashed on load: every route through it,
 * preflights included, got a bare 500 with no CORS headers, which the admin
 * reported as "Failed to fetch". Bundled here, nothing is require()d at
 * runtime, and the patched sanitize-html stays. The storefront needs none of
 * this: Next bundles sanitize-html itself.
 *
 * Run by postinstall and build, so the file exists before tsx or Vercel
 * loads the API. The output is generated, and not committed.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["sanitize-html"],
  outfile: "src/vendor/sanitize-html.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  // postcss require()s Node built-ins, which an ES module bundle can only
  // reach through a real require.
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "warning",
});
