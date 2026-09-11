import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      // Vendored DuckDB-WASM worker bundles, shipped verbatim.
      "public/duckdb/**",
      "build/**",
      "api/dist/**",
      "output/**",
      ".playwright-cli/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
