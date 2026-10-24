import fs from "fs";
import path from "path";
import { format, resolveConfig } from "prettier";

import type { ICard } from "../src/data/card-types";
import type { ICardImageRef, IRitual } from "../src/data/relation-types";
import { DATA_DIR, type DataFile, expectedSchemaRef, formatIssue, readDataDir, validateData } from "./lib/data";
import {
    IMAGE_SOURCES,
    WIKI_PROPERTIES,
    type WikiResult,
    buildRitual,
    cardFiles,
    convertCard,
    imageFile,
    merge,
    mergeImages,
    nameIndex,
    normalizeFileName,
    text,
    wikiName,
    yugipediaFiles,
    yugipediaImage,
} from "./lib/wiki";

/**
 * Fills catalog/data from the Yu-Gi-Oh! Wiki (spec 03 A-5): cards from the "(FMR)" card pages,
 * ritual recipes from the ritual result pages and image links (spec 08 I-6) from each card's
 * "Card image" file. Records already in catalog/data are kept and their
 * differences from the wiki are listed; --overwrite replaces them. Nothing is written when the
 * merged data does not pass validation. Wiki text is CC BY-SA, see the attribution in catalog/README.md.
 * Usage: tsx scripts/sync-wiki.ts [--dry-run] [--overwrite]
 */

const API = "https://yugioh.fandom.com/api.php";
/** Images only: the cards the Fandom wiki has no picture of. */
const YUGIPEDIA_API = "https://yugipedia.com/api.php";
const USER_AGENT = "yugioh-fb-catalog data sync (https://github.com/mhsalves/yugioh-fb-catalog)";
const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const api = async (params: Record<string, string>, endpoint = API) => {
    const url = `${endpoint}?${new URLSearchParams({ ...params, format: "json", formatversion: "2" })}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    await sleep(1000); // one request per second, to be gentle with the wiki
    return response.json();
};

/** Every page with an FMR number, through the SMW ask API (500 per request). */
const fetchCards = async () => {
    const results: WikiResult[] = [];
    let offset = 0;
    for (;;) {
        const query = ["[[FMR number::+]]", ...WIKI_PROPERTIES.map((p) => `?${p}`), "limit=500", `offset=${offset}`];
        const data = await api({ action: "ask", query: query.join("|") });
        const page: Record<string, WikiResult> | WikiResult[] = data.query.results;
        results.push(...(Array.isArray(page) ? page : Object.keys(page).map((title) => page[title])));
        if (data["query-continue-offset"] === undefined) return results;
        offset = data["query-continue-offset"];
    }
};

/** Wikitext of the given pages (50 titles per request). */
const fetchWikitext = async (titles: string[]) => {
    const pages = new Map<string, string>();
    for (let i = 0; i < titles.length; i += 50) {
        const data = await api({
            action: "query",
            prop: "revisions",
            rvprop: "content",
            rvslots: "main",
            titles: titles.slice(i, i + 50).join("|"),
        });
        for (const page of data.query.pages) {
            const content = page.revisions?.[0]?.slots?.main?.content;
            if (content !== undefined) pages.set(page.title, content);
        }
    }
    return pages;
};

/** URL and size of the given image files (50 per request), keyed by file name; missing files are left out. */
const fetchImageInfo = async (files: string[], endpoint = API) => {
    const info = new Map<string, { url: string; width: number; height: number }>();
    for (let i = 0; i < files.length; i += 50) {
        const params = {
            action: "query",
            prop: "imageinfo",
            iiprop: "url|size",
            titles: files
                .slice(i, i + 50)
                .map((file) => `File:${file}`)
                .join("|"),
        };
        const data = await api(params, endpoint);
        for (const page of data.query.pages) {
            const image = page.imageinfo?.[0];
            if (image) info.set(normalizeFileName(page.title.replace(/^File:/, "")), image);
        }
    }
    return info;
};

const fieldDiff = (current: object, wiki: object) => {
    const a = current as Record<string, unknown>;
    const b = wiki as Record<string, unknown>;
    return Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
        .filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
        .map((key) => `${key}: ${JSON.stringify(a[key])} → wiki ${JSON.stringify(b[key])}`);
};

const main = async () => {
    console.log("sync-wiki: fetching cards…");
    const results = await fetchCards();
    const skipped: string[] = [];
    const wikiCards: ICard[] = [];
    for (const converted of results.map(convertCard)) {
        if ("skip" in converted) skipped.push(converted.skip);
        else wikiCards.push(converted.card);
    }
    const files = readDataDir();
    const currentCards = files
        .filter((file) => file.path.startsWith("cards/"))
        .reduce<ICard[]>((all, file) => all.concat((file.json as { cards: ICard[] }).cards), []);
    const cards = merge(currentCards, wikiCards, (card) => card.id, overwrite);

    // Only a monster page says which ritual summons it, so every monster page is read.
    const monsters = results.filter((result) => text(result.printouts["Card type"]?.[0]) === "Monster Card");
    console.log(`sync-wiki: fetching ${monsters.length} monster pages for ritual recipes…`);
    const wikitext = await fetchWikitext(monsters.map((result) => result.fulltext));
    // Skipped cards are still named by recipes, so names resolve over every wiki card.
    const idOf = nameIndex(results.map(wikiName));
    const wikiRituals: IRitual[] = [];
    for (const result of monsters) {
        const content = wikitext.get(result.fulltext);
        const recipe =
            content === undefined ? `${result.fulltext}: page not found` : buildRitual(wikiName(result), content, idOf);
        if (typeof recipe === "string") skipped.push(recipe);
        else if (recipe) wikiRituals.push(recipe);
    }
    const recipeIds = new Set(wikiRituals.map((ritual) => ritual.ritual));
    for (const card of wikiCards) {
        if (card.cardType === "Ritual" && !recipeIds.has(card.id)) {
            skipped.push(`ritual ${card.id} ${card.name}: no monster page names it as its ritual_card`);
        }
    }
    const ritualsFile = files.find((file) => file.path === "rituals.json");
    const currentRituals = (ritualsFile?.json as { rituals: IRitual[] } | undefined)?.rituals ?? [];
    const rituals = merge(currentRituals, wikiRituals, (ritual) => ritual.ritual, overwrite);

    const cardImages = new Map<number, string>();
    for (const result of results) {
        const file = imageFile(result);
        if (file) cardImages.set(wikiName(result).id, file);
    }
    console.log(`sync-wiki: fetching ${cardImages.size} image files…`);
    const imageInfo = await fetchImageInfo(Array.from(new Set(cardImages.values())));
    const wikiImages: ICardImageRef[] = [];
    for (const [card, file] of cardImages) {
        const info = imageInfo.get(file);
        if (!info) skipped.push(`image of card ${card}: file "${file}" not found on the wiki`);
        else wikiImages.push({ card, source: "fandom", url: info.url, width: info.width, height: info.height });
    }
    // Fandom only has the card back for some cards: Yugipedia has the game's card screen for them.
    const withoutImage = results.map(wikiName).filter(({ id }) => !cardImages.has(id));
    const candidates = withoutImage.map(({ id, name }) => ({ id, files: yugipediaFiles(name) }));
    console.log(`sync-wiki: looking up ${candidates.length} images on Yugipedia…`);
    const fileList = candidates.reduce<string[]>((all, { files }) => all.concat(files), []);
    const yugipediaInfo = await fetchImageInfo(fileList, YUGIPEDIA_API);
    let noImage = 0;
    for (const { id, files } of candidates) {
        const info = files.map((file) => yugipediaInfo.get(file)).find(Boolean);
        const image = info && yugipediaImage(id, info);
        if (!image) noImage++;
        else if (typeof image === "string") skipped.push(image);
        else wikiImages.push(image);
    }
    wikiImages.sort((a, b) => a.card - b.card);
    const imagesFile = files.find((file) => file.path === "images.json");
    const currentImages = (imagesFile?.json as { images: ICardImageRef[] } | undefined)?.images ?? [];
    const images = mergeImages(currentImages, wikiImages, overwrite);

    // Validate the merged data set before touching any file.
    const output = new Map<string, unknown>(cardFiles(cards.records));
    output.set("rituals.json", { $schema: expectedSchemaRef("rituals.json", "rituals"), rituals: rituals.records });
    output.set("images.json", {
        $schema: expectedSchemaRef("images.json", "images"),
        sources: IMAGE_SOURCES,
        images: images.records,
    });
    const merged: DataFile[] = files
        .filter((file) => !file.path.startsWith("cards/") && !output.has(file.path))
        .concat(Array.from(output, ([file, json]) => ({ path: file, json })));
    const { issues, catalog } = validateData(merged);

    for (const [label, report] of [
        ["cards", cards.report],
        ["rituals", rituals.report],
        ["images", images.report],
    ] as const) {
        console.log(
            `${label}: ${report.added.length} added, ${report.changed.length} differ, ${report.unchanged} same`,
        );
        for (const { current, wiki } of report.changed as { current: object; wiki: object }[]) {
            const record = current as { id?: number; ritual?: number; card?: number };
            const id = record.id ?? record.ritual ?? record.card;
            const refreshed = label === "images" && images.records.includes(wiki as ICardImageRef);
            const action = overwrite || refreshed ? "(updated)" : "(kept)";
            console.log(`  ${id} ${action}: ${fieldDiff(current, wiki).join("; ")}`);
        }
    }
    console.log(`images: ${noImage} cards have no image on Fandom or Yugipedia`);
    console.log(`skipped: ${skipped.length}`);
    for (const reason of skipped) console.log(`  ${reason}`);
    for (const issue of issues) console.error(formatIssue(issue));
    if (!catalog) {
        console.error("sync-wiki: the merged data does not validate, nothing written");
        process.exit(1);
    }
    if (dryRun) return console.log("sync-wiki: dry run, nothing written");

    for (const [file, json] of output) {
        const full = path.join(DATA_DIR, file);
        const content = await format(JSON.stringify(json), { ...(await resolveConfig(full)), filepath: full });
        fs.mkdirSync(path.dirname(full), { recursive: true });
        if (!fs.existsSync(full) || fs.readFileSync(full, "utf8") !== content) fs.writeFileSync(full, content);
    }
    console.log(
        `sync-wiki: wrote ${output.size} files, ${catalog.cards.length} cards, ${catalog.rituals.length} rituals, ${catalog.images.length} images`,
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
