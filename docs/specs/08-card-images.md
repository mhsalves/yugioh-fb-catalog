# 08 – Card images

> **Status: Proposed.** Image source **I-1 is Agreed (interim): reference images from the Yu-Gi-Oh! Fandom wiki** (2026-10-20). This resolves TBD-X3 for now.

## 0. Status

Build status as of 2026-10-20, `main` @ `9a353ee`. Legend in the [index](./README.md#status-system).

**0 built · 0 partial · 7 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| I-1 | Source: Fandom wiki, linked not copied | Agreed | ❌ Not built | No images anywhere |
| I-2 | Image references in `data/images.json` | Agreed | ❌ Not built | No image field or mapping |
| I-3 | Image API in the catalog | Proposed | ❌ Not built | None |
| I-4 | Site usage, optimization and fallback | Proposed | ❌ Not built | Text-only cards |
| I-5 | Attribution and notice | Proposed | ❌ Not built | None |
| I-6 | Import script and health check | Proposed | ❌ Not built | None (wiki API access verified) |
| I-7 | Exit plan: self-hosting via jsDelivr | Proposed | ❌ Not built | None |

## 1. Why this spec exists

A card catalog is far more useful, and far closer to the *Forbidden Memories* experience ([06](./06-site-ux-forbidden-memories.md)), when each card shows its picture. Images raise three problems that the data does not:

- **Cost and weight:** 722 cards × several sizes is tens of MB. It must be free to host and fast to load, and it must not bloat the npm package ([05](./05-catalog-npm-distribution.md)).
- **Copyright:** card art belongs to Konami. Hosting it ourselves puts the repository (and with it the npm source and the GitHub Pages site) at risk of a takedown.
- **Changeability:** the source may change later (another host, or our own images), and that must not break the site or npm consumers.

The decision for now is to **link to images that the Yu-Gi-Oh! Fandom wiki already hosts**, not copy them. This spec defines how to do that safely and how to switch later without breaking anything.

Source: [Gallery of Yu-Gi-Oh! Forbidden Memories cards](https://yugioh.fandom.com/wiki/Gallery_of_Yu-Gi-Oh!_Forbidden_Memories_cards).

## 2. What exists today

| Item | Current state |
|---|---|
| Images in the catalog data | None. No image field or mapping |
| Images on the site | None. Cards are text-only MUI cards |
| Image plan in the specs | 06 U-1 proposed a styled placeholder frame and left artwork as TBD-X3 / TBD-U8 |

**Facts about the Fandom source** (checked on 2026-10-20 through the wiki's public MediaWiki API. The HTML page itself blocks automated clients with HTTP 402):

| Fact | Detail |
|---|---|
| How the gallery is built | A Semantic MediaWiki query on the properties **`FMR number`** and **`Card image`**, in sections 001–200, 201–400, 401–600 and 601–722 (which supports TBD-D10: 722 cards) |
| Number → file mapping | Available as data through `api.php?action=ask` (`[[FMR number::+]]\|?FMR number\|?Card image`) |
| File naming | `<NameWithoutSpaces>-FMR-EN-VG.png` (FMR = *Forbidden Memories*, EN = English, VG = video game). For example `ThunderDragon-FMR-EN-VG.png`. Names cannot be reliably derived from card names (`BlueeyesWhiteDragon`, `HitotsumeGiant`), so the mapping must be **stored**, not computed |
| Our 5 cards | All found, with matching numbers: 315 `DragonTreasure`, 332 `Mountain`, 425 `ThunderDragon`, 674 `BeastryMirrorRitual`, 690 `FakeTrap` |
| Coverage | The gallery page references **619** image files, fewer than 722. Some cards may have no image yet (TBD-I3) |
| Original size | About 300 × 423 px PNG |
| URL format | `https://static.wikia.nocookie.net/yugioh/images/<h>/<hh>/<file>/revision/latest?cb=<timestamp>`. For example `…/images/9/90/BlueeyesWhiteDragon-FMR-EN-VG.png/revision/latest?cb=20250723225546`. `<h>/<hh>` are the first 1 and 2 hex characters of `md5(<file>)` (standard MediaWiki layout). `cb` is the file revision's timestamp, a cache-buster |
| Resizing | Append `/scale-to-width-down/<px>`. For example, at 160 px Thumblr returns **WebP, about 12 KB** |
| Format negotiation | Serves `image/webp` (`vary: Accept`) |
| Caching | `cache-control: public, max-age=31536000` (1 year), behind Cloudflare |
| Hotlinking | Works when the request has a `Referer`: full path, origin-only (`https://mhsalves.github.io/`) and `http://localhost:3000/` all return HTTP 200, with `access-control-allow-origin: *`. **Requests with no `Referer` get HTTP 403** (an HTML error page), whatever the user agent. Browsers send the origin as `Referer` by default for cross-site images, so normal site visitors are fine |
| Side effect | The CDN sets a Cloudflare `__cf_bm` cookie on `nocookie.net` in the viewer's browser |

**Why this is a good interim choice:** it costs nothing, Fandom's CDN already does the optimization (WebP, resizing, long cache), the images stay off our repository and npm package, and the wiki already lists all the cards by number.

## 3. Gaps

| # | Gap |
|---|---|
| I-gap-1 | No place in the data model for an image reference ([02](./02-catalog-data-model.md) TBD-D6). |
| I-gap-2 | No API to get an image URL, so every consumer would have to rebuild Fandom URLs itself. |
| I-gap-3 | No fallback when an image is missing or the external host fails. |
| I-gap-4 | No attribution to the source. |
| I-gap-5 | No detection of broken image links. External files can be renamed or deleted. |
| I-gap-6 | No exit plan if hotlinking is blocked or the terms change. |

## 4. Proposed improvements

### I-1 Source: Yu-Gi-Oh! Fandom wiki, linked, not copied (**Agreed, interim**) · ❌ Not built
- Images are **not stored** in this repository or in the npm package. The site and consumers load them directly from Fandom's CDN (`static.wikia.nocookie.net`).
- Only the English video-game card images (`-FMR-EN-VG`) are used. Other regions are TBD-X2.
- This choice is **interim**. I-7 defines how to replace it, and every other item is designed so the switch needs no breaking change.

### I-2 Image references as a relation file (`catalog/data/images.json`) · ❌ Not built
Following [02](./02-catalog-data-model.md) D-1 (entities vs relations), image references live in **their own JSON file** ([03](./03-catalog-data-authoring.md) A-1), not inside each card:

Each entry stores the **image URL exactly as the wiki gives it**, so adding an image is a copy and paste:

```json
{
  "$schema": "../schema/images.schema.json",
  "sources": {
    "fandom": {
      "name": "Yu-Gi-Oh! Wiki (Fandom)",
      "filePageUrl": "https://yugioh.fandom.com/wiki/File:",
      "license": "TBD-I4"
    }
  },
  "images": [
    { "card": 1,   "source": "fandom", "url": "https://static.wikia.nocookie.net/yugioh/images/9/90/BlueeyesWhiteDragon-FMR-EN-VG.png/revision/latest?cb=20250723225546" },
    { "card": 425, "source": "fandom", "url": "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest?cb=20131221161931", "width": 300, "height": 423 }
  ]
}
```

- **`url` is the only required field besides `card` and `source`.** Paste the URL from the wiki (open the image on the gallery or card page and copy its address), including `?cb=`.
- **Keep `?cb=`.** Fandom caches images for 1 year. `cb` is the timestamp of the file's revision, so when the wiki uploads a new version, the new `cb` makes browsers fetch the new image instead of a year-old copy.
- **Validation** ([03](./03-catalog-data-authoring.md) A-2) checks every `url`:
  - it matches `^https://static\.wikia\.nocookie\.net/yugioh/images/[0-9a-f]/[0-9a-f]{2}/[^/?]+/revision/latest(\?cb=\d+)?$`;
  - its `<h>/<hh>` folder equals the first characters of `md5(<file name>)`, which catches typos and edited URLs;
  - the file name ends in `-FMR-EN-VG.png` (a warning, not an error, for exceptions);
  - each `card` exists and appears only once.
- **`width`/`height` are optional.** The import script fills them in; hand-added entries can leave them out. The site then reserves space using the standard FM card ratio (300 × 423), so the layout still does not shift.
- Cards without an entry simply have no image. That is valid while coverage is incomplete.
- Switching hosts later means rewriting this one file, with no card edits.
- Size: about 722 entries, roughly 100 KB of JSON (TBD-I5 covers whether this ships in the main package).

**Two ways to fill it, producing the same format:**

| Way | When | How |
|---|---|---|
| **Paste by hand** | Each time you add a new card to the data | Add one line to `images.json` with the card number and the copied URL, in the same PR as the card |
| **Import script** (I-6) | Bulk fill, or refresh the `cb` values | The script reads the wiki's API and writes every entry, with `width`/`height` |

Both are reviewed and validated the same way in the PR.

### I-3 Image API in the catalog · ❌ Not built
Added to the query API ([04](./04-catalog-query-api.md)):

```ts
type ImageSize = "thumb" | "full";            // thumb = 160 px wide, full = original (~300 px)

function getCardImage(id: CardId, size?: ImageSize): {
  url: string;                 // thumb: …/ThunderDragon-FMR-EN-VG.png/revision/latest/scale-to-width-down/160?cb=20131221161931
  width: number; height: number;               // stored values, or the 300 × 423 default
  source: { name: string; pageUrl: string };   // for attribution (I-5)
} | undefined;

function getCardImageSrcSet(id: CardId): string | undefined;   // "…/scale-to-width-down/160?cb=… 160w, …/revision/latest?cb=… 300w"
```

- `full` returns the stored `url` unchanged. `thumb` inserts `/scale-to-width-down/160` after `revision/latest` and keeps the `?cb=` query.
- Consumers never build Fandom URLs themselves, so the provider can change behind this API (I-7) without breaking anyone.

### I-4 Site usage and optimization · ❌ Not built
- `<img loading="lazy" decoding="async" width height srcset sizes alt="<card name>">` in the grid. The thumbnail (160 px, about 12 KB WebP) keeps a full grid light. The card detail page uses `full`.
- Images are **not** optimized at build time. Fandom's CDN already serves resized WebP with a 1-year cache. For a static export this also fits [07](./07-site-github-pages-delivery.md) P-4 (no image server).
- **Fallback:** if a card has no image, or the image fails to load (`onerror`), show the styled card frame from [06](./06-site-ux-forbidden-memories.md) U-1. That frame stays the default visual, so the site is complete without any external image.
- Use `<link rel="preconnect" href="https://static.wikia.nocookie.net">` on pages with images.
- **Never strip the referrer for these images.** The CDN returns 403 without a `Referer` (§2). So the site must **not** set `referrerpolicy="no-referrer"` on card images, nor a `<meta name="referrer" content="no-referrer">` or `Referrer-Policy: no-referrer` for the whole site. The browser default (`strict-origin-when-cross-origin`) sends only the origin, which is enough and leaks no page path. Visitors whose browser or extensions strip referrers get the styled-frame fallback through `onerror`.

### I-5 Attribution and notice · ❌ Not built
- A footer notice on every page: *"Card images are hosted by and linked from the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com) (Fandom). Yu-Gi-Oh! and its card artwork are © Kazuki Takahashi / Konami. This is an unofficial fan project."*
- The card detail page links to the image's file page (`filePageUrl + file`).
- The npm README states that the package ships **only URLs**, no images, and repeats the notice. It also warns that the image host rejects requests without a `Referer` (403). Web pages embedding the URLs work by default; servers, CLIs and apps that download images must send a `Referer` themselves, or show their own fallback.
- The site's privacy note mentions that images load from a third-party CDN, which may set cookies.

### I-6 Import and health check · ❌ Not built
- **Import script** (`catalog/tools/import-images`, part of [03](./03-catalog-data-authoring.md) A-5): queries the Semantic MediaWiki `ask` API (`[[FMR number::+]]|?FMR number|?Card image`, paged by `offset`), then `action=query&prop=imageinfo&iiprop=url|size` for each file. `imageinfo` returns the same `…/revision/latest?cb=…` URL you copy by hand. The script writes `images.json`. By default it **only adds missing entries and updates changed `cb` values**, so hand-pasted entries stay as they are unless the wiki's file changed. Verified on 2026-10-20: the API returns the correct file for each of our 5 cards. It is run by hand, and its output is committed and reviewed like any data PR. It sends an identifying `User-Agent` and throttles requests to be polite to the wiki.
- **Scripts and workflows that request images** (import size checks, the health check) send `Referer: https://mhsalves.github.io/` so they see what visitors see. Without it, every image would look broken (403).
- **Scheduled health check** (GitHub Actions, weekly, `schedule:`): sends a `HEAD` request for each `full` URL and opens or updates one issue listing any broken images. It is never a PR blocker, because an external outage must not block merges. Actions pinned by SHA ([01](./01-repository-and-workspaces.md) R-4).

### I-7 Exit plan: self-hosting (later, Proposed) · ❌ Not built
If hotlinking is blocked, the terms forbid it, or more control is needed, switch to **a separate images repository served through jsDelivr** (`cdn.jsdelivr.net/gh/mhsalves/<images-repo>@<tag>/cards/<id>-<size>.webp`). That option is free, uses a global CDN, and keeps any takedown risk away from this repository.
- Add a new `sources` entry and rewrite `images.json`. `getCardImage` keeps its signature, so this is a **patch or minor release, not breaking**.
- Images are pre-optimized once (WebP, 160 px and 320 px) with a script such as `sharp`.
- The switch must still respect copyright: decide what may be hosted before doing it (TBD-I4).

## 5. Acceptance criteria

- [ ] `catalog/data/images.json` exists, passes schema and MD5-path validation, and covers every card the wiki has an image for.
- [ ] Adding an image by hand needs only `card`, `source` and the pasted `url`. A mistyped URL fails validation with the card number in the error.
- [ ] `getCardImage(425, "thumb")` returns a URL that loads (HTTP 200, WebP) when requested with the site's `Referer`, plus width and height.
- [ ] The site sends no `no-referrer` policy for card images, and images load on the live GitHub Pages site and on `localhost`.
- [ ] No image binaries in the repository or in the npm tarball (`npm pack --dry-run`).
- [ ] The site grid loads thumbnails lazily with reserved dimensions (no layout shift), and the detail page shows the full image.
- [ ] Turning off the network to `static.wikia.nocookie.net` still leaves a complete-looking site (styled-frame fallback).
- [ ] The attribution notice is visible on every page, and each detail page links to the image's file page.
- [ ] The weekly health-check workflow runs and reports broken images as an issue.

## 6. TBD / open questions

| ID | Question | Notes |
|---|---|---|
| ~~**TBD-X3**~~ | Card artwork source | **Resolved (interim, 2026-10-20):** link to Yu-Gi-Oh! Fandom wiki images (I-1) |
| **TBD-I1** | Is hotlinking allowed under Fandom's Terms of Use for a public site, long-term? | It works technically today, but the CDN already enforces a `Referer` rule (403 without one), so Fandom controls this and could tighten it. The terms need reading. If they forbid it, or embedding from other sites starts failing, use I-7 |
| **TBD-I2** | Use the wiki's `Card image` data as a source for other fields too (names, numbers), which relates to TBD-X1? | The wiki's text is usually CC BY-SA, which requires attribution and share-alike. Images are usually non-free (fair use) |
| **TBD-I3** | Real image coverage: the gallery references 619 files for 722 cards. Which cards have no image? | Measure with the import script. Missing cards use the fallback frame |
| **TBD-I4** | Legal position on displaying Konami artwork, even linked: is the notice in I-5 enough for a non-commercial fan project? | Not legal advice. If in doubt, ship with the styled frame only |
| **TBD-I5** | Should `getCardImage` be in the main package, or a subpath (`@mhsalves/yugioh-fb-catalog/images`) so data-only users skip `images.json`? | Ties to TBD-N4 (size budget) |
