import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled output of the admin and API packages. Gitignored and rebuilt
    // on every build; linting it only counts the bundler's code, not ours.
    "admin/dist/**",
    "api/dist/**",
  ]),
]);

export default eslintConfig;
