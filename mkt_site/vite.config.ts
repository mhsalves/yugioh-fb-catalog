import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { writeCardPages } from "./build/cardPages";

const require = createRequire(import.meta.url);
// The catalog the site is built against (the workspace copy, spec 07 P-2), shown in the header.
const catalog = require("@mhsalves/yugioh-fb-catalog/package.json") as { name: string; version: string };

/** Base path for GitHub Pages project sites (spec 07 P-3). `SITE_BASE_PATH` overrides it for forks or a custom domain. */
function basePath(production: boolean): string {
    const raw = process.env.SITE_BASE_PATH ?? (production ? "/yugioh-fb-catalog" : "/");
    const trimmed = raw.replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : "/";
}

/**
 * Absolute site URL for canonical links and the sitemap (spec 09 C-7). pages.yml sets `SITE_URL` from
 * actions/configure-pages, so it follows the real domain; local builds fall back to the github.io address.
 */
function siteUrl(base: string): string {
    // Pages reports http:// while "Enforce HTTPS" is off; canonical links should still be https.
    return (process.env.SITE_URL || `https://mhsalves.github.io${base}`)
        .replace(/^http:\/\//, "https://")
        .replace(/\/+$/, "");
}

/**
 * Static output for GitHub Pages: `404.html` (a copy of the SPA shell, so deep links boot the router),
 * one page per catalogued card and `sitemap.xml`.
 */
function staticPages(): Plugin {
    let outDir = "";
    let base = "/";
    return {
        name: "static-pages",
        apply: "build",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
            base = config.base;
        },
        writeBundle() {
            copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
            const count = writeCardPages(outDir, siteUrl(base));
            this.info(`wrote ${count} card pages and sitemap.xml`);
        },
    };
}

// `vite preview` serves the build output, so it needs the build's base path too.
export default defineConfig(({ command, isPreview }) => ({
    base: basePath(command === "build" || isPreview === true),
    plugins: [react(), staticPages()],
    define: {
        __CATALOG_NAME__: JSON.stringify(catalog.name),
        __CATALOG_VERSION__: JSON.stringify(catalog.version),
    },
}));
