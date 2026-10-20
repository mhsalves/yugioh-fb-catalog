import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/node_modules/",
            "catalog/lib/",
            "mkt_site/.next/",
            "mkt_site/out/",
            "mkt_site/next-env.d.ts",
            "catalog/src/data/catalog.generated.ts",
        ],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["scripts/**/*.mjs"],
        languageOptions: { globals: globals.node },
    },
    {
        files: ["catalog/**/*.{ts,mts}"],
        languageOptions: { globals: globals.node },
    },
    {
        files: ["mkt_site/**/*.{ts,tsx,js}"],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        plugins: { "react-hooks": reactHooks },
        rules: reactHooks.configs.recommended.rules,
    },
    prettier,
);
