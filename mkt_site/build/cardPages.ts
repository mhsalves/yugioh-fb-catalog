import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import type { ICard } from "@mhsalves/yugioh-fm-catalog";
// With its extension: Vite loads this file (through vite.config.ts) with Node's own TypeScript support.
import { ROUTES } from "../src/routes.ts";

// Per-card pages for search engines (spec 09 C-7). Each catalogued card gets dist/cards/<id>/index.html:
// the SPA shell with the card's own title, description, canonical and Open Graph tags, and a readable summary
// inside #root (for crawlers, and until the app starts). The app then renders its card page (src/pages/CardPage.tsx).

const SITE_NAME = "Yu-Gi-Oh! FM Catalog";

const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Thunder Dragon – Lv5 Thunder – 1600/1500" for monsters, "Mountain – Magic" for the rest (spec 06 U-5). */
export function cardHeadline(card: ICard): string {
    return card.cardType === "Monster"
        ? `${card.name} – Lv${card.level} ${card.monsterType} – ${card.attack}/${card.defense}`
        : `${card.name} – ${card.cardType}`;
}

function cardSummary(card: ICard): string {
    const rows: [string, string][] = [["Card type", card.cardType]];
    if (card.cardType === "Monster") {
        rows.push(
            ["Monster type", card.monsterType],
            ["Level", String(card.level)],
            ["ATK / DEF", `${card.attack} / ${card.defense}`],
            ["Guardian stars", card.guardianStars.join(", ")],
        );
    }
    if (card.password) rows.push(["Password", card.password.code], ["Cost", `${card.password.cost} starchips`]);
    else rows.push(["Password", "None"]);

    return [
        `<main class="static-card">`,
        `<h1>#${card.id} ${escapeHtml(card.name)}</h1>`,
        `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>`,
        `<p>${escapeHtml(card.description)}</p>`,
        `<p><a href="../">Browse all cards</a></p>`,
        `</main>`,
    ].join("");
}

function cardHead(card: ICard, url: string): string {
    const title = escapeHtml(`${cardHeadline(card)} – ${SITE_NAME}`);
    const description = escapeHtml(`#${card.id} ${cardHeadline(card)}. ${card.description}`);
    return [
        `<title>${title}</title>`,
        `<meta name="description" content="${description}" />`,
        `<link rel="canonical" href="${url}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:url" content="${url}" />`,
    ].join("\n        ");
}

/** The shell with its title and description swapped for `head`, and `body` inside #root. */
function page(shell: string, head: string, body = ""): string {
    return shell
        .replace(/<title>[\s\S]*?<\/title>/, "")
        .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
        .replace("</head>", `    ${head}\n    </head>`)
        .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function write(outDir: string, path: string[], html: string): void {
    mkdirSync(resolve(outDir, ...path), { recursive: true });
    writeFileSync(resolve(outDir, ...path, "index.html"), html);
}

/**
 * Writes cards/<id>/index.html for every catalogued card, a page for every other live route (spec 10 F-10: preview
 * routes get none, so they are never indexed) and a sitemap.xml, next to the built index.html.
 */
export function writeCardPages(outDir: string, siteUrl: string): number {
    // The catalog's built CommonJS output, through its public API (spec 06 S-4).
    const require = createRequire(import.meta.url);
    const { getCardList } = require("@mhsalves/yugioh-fm-catalog") as typeof import("@mhsalves/yugioh-fm-catalog");
    const shell = readFileSync(resolve(outDir, "index.html"), "utf8");
    const cards = getCardList();

    for (const card of cards) {
        const url = `${siteUrl}/cards/${card.id}/`;
        write(outDir, ["cards", String(card.id)], page(shell, cardHead(card, url), cardSummary(card)));
    }

    const routes = ROUTES.filter((route) => route.status === "live" && route.path !== "/");
    for (const route of routes) {
        const url = `${siteUrl}${route.path}/`;
        const title = escapeHtml(`${route.title} – ${SITE_NAME}`);
        const head = [
            `<title>${title}</title>`,
            `<meta name="description" content="${escapeHtml(route.description)}" />`,
            `<link rel="canonical" href="${url}" />`,
        ].join("\n        ");
        write(outDir, route.path.split("/").filter(Boolean), page(shell, head));
    }

    const urls = [
        `${siteUrl}/`,
        ...routes.map((route) => `${siteUrl}${route.path}/`),
        ...cards.map((card) => `${siteUrl}/cards/${card.id}/`),
    ];
    writeFileSync(
        resolve(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
            .map((url) => `  <url><loc>${url}</loc></url>`)
            .join("\n")}\n</urlset>\n`,
    );
    return cards.length;
}
