import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);
// The catalog the site is built against (the workspace copy, spec 07 P-2), shown in the header.
const catalog = require("@mhsalves/yugioh-fb-catalog/package.json") as { name: string; version: string };

/** Base path for GitHub Pages project sites (spec 07 P-3). `SITE_BASE_PATH` overrides it for forks or a custom domain. */
function basePath(production: boolean): string {
    const raw = process.env.SITE_BASE_PATH ?? (production ? "/yugioh-fb-catalog" : "/");
    const trimmed = raw.replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : "/";
}

/** GitHub Pages serves `404.html` for unknown paths, so a copy of the SPA shell lets deep links boot the router. */
function spaFallback(): Plugin {
    let outDir = "";
    return {
        name: "spa-fallback-404",
        apply: "build",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
        },
        writeBundle() {
            copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
        },
    };
}

// `vite preview` serves the build output, so it needs the build's base path too.
export default defineConfig(({ command, isPreview }) => ({
    base: basePath(command === "build" || isPreview === true),
    plugins: [react(), spaFallback()],
    define: {
        __CATALOG_NAME__: JSON.stringify(catalog.name),
        __CATALOG_VERSION__: JSON.stringify(catalog.version),
    },
}));
