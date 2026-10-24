# 10 – Site: mobile-first shell for Search, Fusion and Duelists

> **Status: Built with the §6 defaults** (2026-10-23, branch `site-feature-shell`). Requested by the project owner: prepare the site's UI for three features (**card search**, a **duelist list** and a **fusion tool**) before the catalog supports all of them, **mobile-first**, with the catalog methods that do not exist yet **mocked in the site and listed to be added to the catalog** (F-6). Builds on [09](./09-site-catalog-page.md) and reopens its C-1 "no menu" (TBD-F1, built with the default "yes"). Visuals still follow the style guide when it lands ([06](./06-site-ux-forbidden-memories.md) U-1).

## 0. Status

Checked against branch `site-feature-shell` (based on `main` @ `5443e78`, 2026-10-23). Legend in the [index](./README.md#status-system).

**9 built · 1 partial · 0 not built**

Live in production: **Cards** (with the search look-ups of F-7) and **Duelists** (since catalog 0.7.0). **Fusion** is `preview` (sample data): they show in `yarn dev`, or with `?preview=1` on any page, and go `live` when the catalog ships the methods in [§ Catalog methods the site mocks](#catalog-methods-the-site-mocks).

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| F-1 | Mobile-first CSS: base = phone, `min-width` breakpoints, split stylesheet | Agreed | ✅ Built | `src/styles/{tokens,base,layout,catalog,card-panel,features,motion}.css`; phone is the base, `md` 721px and `sm` 401px are `min-width`; only the 721–1199px panel range stays a bounded query. Split by import order, without `@layer` (same cascade as before) |
| F-2 | Route table and feature flags | Agreed | ✅ Built | `src/routes.ts` (pure data, also read by the build), `src/features.ts` (`?preview=1`), lazy Fusion and Duelists pages, scroll restoration in `router.tsx` |
| F-3 | App shell: bottom tab bar on phones, header tabs on desktop | Agreed (F1, F2 defaults) | ✅ Built | `components/Nav.tsx`; hidden while only one page is visible |
| F-4 | Shared UI primitives (Sheet, CardRow, CardPicker, EmptyState, Tabs) | Agreed | 🟡 Partial | `Sheet` (`<dialog>`), `CardRow`, `CardPicker`, `EmptyState`, `SearchBox`, `Tabs`, `PercentBar`, `PreviewBanner`, `DuelistPortrait`, `useUrlParams`. Not done: `Filters` and `CardDetails` still have their own phone sheets, and Back does not close a `Sheet` |
| F-5 | Card details on every page (`?card=`) | Agreed | ✅ Built | `useCardParam` + `PageCardDetails` on Fusion and Duelist pages; `CardInfo` shows "Fusions" and "Dropped by" while those features are visible |
| F-6 | Data adapters and sample data for features without catalog data | Agreed | ✅ Built | `src/data/{fusions,duelists,cards}.ts` (mocks with the catalog's planned signatures), `src/data/sample.ts` (seeded sample data from the real card list), `src/data/pending.ts` (the list of methods owed to the catalog) |
| F-7 | **Search card** | Agreed (changed 2026-10-23) | ✅ Built | Folded into the Cards search box: name, `#425` (card number), 8-digit password (mocked `getCardByPassword`); `/` focuses it from any page. The separate `/search` page was built, then removed (see As built) |
| F-8 | **Fusion tool** UI | Agreed (F4 default) | ✅ Built (preview) | `/fusion`: Combine, Uses, Recipes on sample data |
| F-9 | **Duelists** list and duelist page UI | Agreed | ✅ Built (live) | `/duelists`, `/duelists/<id>`: the 39 duelists with Yugipedia portraits, drops by rank with the game's rates, deck; static pages and sitemap entries per duelist |
| F-10 | Static pages and sitemap for the new routes | Agreed | ✅ Built | `build/cardPages.ts` writes a page and a sitemap entry for every `live` route besides `/` (none today); preview routes get nothing |

**Home page (2026-10-23, owner request):** `/` is a home page (`pages/HomePage.tsx`): intro, a card search, tiles to Cards, Fusion and Duelists ("Coming soon" without a link while a feature is not visible), special thanks, how to use the data, and the author. The catalog moved to `/cards`; `/` with catalog parameters and the short-lived `/about` redirect. With Home and Cards live, production shows the tab bar (Home, Cards).

### Catalog methods the site mocks

Registered in `mkt_site/src/data/pending.ts` (the source of truth; the preview banner reads it) and in [04](./04-catalog-query-api.md) Q-5. When the catalog ships one, its adapter in `src/data/` re-exports it and the mock and its entry are deleted.

| Method (signature the site codes against) | Spec | Mock answers with | Used by |
|---|---|---|---|
| `getFusion(a, b): ICard \| undefined` | 04 Q-5 | Sample data | Fusion |
| `getFusionsWith(id): IFusion[]` | 04 Q-5 | Sample data | Fusion, card details |
| `getFusionsFor(resultId): IFusion[]` | 04 Q-5 | Sample data | Fusion, card details |
| `getCardByPassword(code): ICard \| undefined` | New (F-7) | Real data, computed in the site | Cards search |

### As built: differences from the plan below

- **F-1:** no `@layer`; the files are imported in the old cascade order, so specificity behaves exactly as before.
- **F-2:** previews also need `?preview=1` under `yarn preview` (it serves the production build).
- **F-6:** sample data is generated from the real card list with a seeded random function (`src/data/sample.ts`), not hand-written fixtures. It is a few lines of code in the main bundle, and only runs when a preview feature asks for it.
- **F-7 (owner review, 2026-10-23):** the separate Search page duplicated the Cards search box (same `searchCards`, a second box, fewer options), so it was **removed**. What it added moved into the Cards box: `#425` looks up a card number and 8 digits a password; `/` focuses the box from any page. Recent searches were dropped. With Cards the only live page, production shows no navigation until Fusion or Duelists go live.
- **F-8:** the look-up card is `?of=` (not `?card=`, which opens the details panel). The material picker is limited to monsters.

## 1. Why this spec exists

Goal **G1**: a site players use for the look-ups they did on old fan pages, which spec 06 lists as *card stats, passwords, fusions, drops*. The card catalog (09) covers stats and passwords. Fusions and duelist drops are the other half, and search should work wherever the player is.

The catalog does not have the data for two of the three features yet (fusions: 04 Q-5; duelists: 02 TBD-D9). Building the **shell first** lets the UI be designed, reviewed on a phone and merged now, so each feature goes live as soon as its catalog functions land, with no layout rework. The rule from 06 still holds: **no empty screens ship to production** (F-2 flags).

**Mobile-first**, because most players look things up on a phone next to the console or emulator: the phone layout is the base design, and wider screens add to it.

## 2. What exists today

| Part | Today | File |
|---|---|---|
| Routing | `/` catalog, `/cards/<id>` card page, anything else 404; matched by regex in `App` | `src/App.tsx`, `src/router.tsx` |
| Header | Logo, catalog version, npm and GitHub links; no menu (09 C-1) | `components/Header.tsx` |
| Catalog search | Debounced search box bound to `CardQuery.text` | `pages/CatalogPage.tsx` (`SearchBox`) |
| Card details | Side panel on desktop, full screen on phones, `?card=` in the URL, Back closes it | `components/CardDetails.tsx`, `catalogUrl.ts` |
| Phone sheets | `Filters` and `CardDetails` each have their own full-screen phone CSS, Esc handling and focus code | `components/Filters.tsx`, `components/CardDetails.tsx`, `styles.css` |
| CSS | One file. Desktop is the base; phones are `@media (max-width: 720px)` and `(max-width: 400px)`; tablets `721–1199px` | `src/styles.css` |
| Catalog API used | `searchCards`, `getCard`, `getCardList`, `getRitual`, `getCardImage*`, enums | `@mhsalves/yugioh-fm-catalog` |

## 3. Gaps

| # | Gap |
|---|---|
| F-gap-1 | No place to put more than one page: no navigation, and the router has no route table. |
| F-gap-2 | Phone styles are overrides of desktop styles, so every new screen has to be written twice and undone once. |
| F-gap-3 | Phone sheets, card lists and the empty state are not reusable; the fusion tool and duelist pages need all of them. |
| F-gap-4 | A card can only be opened from the catalog grid; fusion results and duelist drops need the same details panel. |
| F-gap-5 | Search lives inside the catalog page; from another page there is no way to look up a card. |
| F-gap-6 | No fusion or duelist data, types or functions in the catalog, so their UI cannot be built against real data. |

## 4. Proposed improvements

### Target layout

```
Phone (base, < 721px)                 Desktop (≥ 721px)
┌──────────────────────┐              ┌───────────────────────────────────────────────────┐
│ [logo]      v0.5 npm │              │ [logo] FM Catalog  Cards Fusion Duelists  [🔍 /] v│
├──────────────────────┤              ├───────────────────────────────────────────────────┤
│                      │              │                                                   │
│   current page       │              │   current page (+ details panel on the right)     │
│                      │              │                                                   │
├──────────────────────┤              ├───────────────────────────────────────────────────┤
│ Cards Search Fusion  │ ← tab bar,   │ footer                                            │
│        Duelists      │   fixed,     └───────────────────────────────────────────────────┘
└──────────────────────┘   safe-area
```

### F-1 Mobile-first CSS · ❌ Not built
A refactor with **no visual change**, done first so every later screen is written once.

- **Base styles are the phone layout.** Wider layouts are added with `min-width` queries only. The current `max-width: 720px` / `400px` blocks become the base, and today's desktop rules move under `@media (min-width: 721px)` and `(min-width: 1200px)`.
- **Breakpoints as one list**, documented next to the tokens: `sm` 401px (brand text appears), `md` 721px (filter column, side panel, header tabs), `lg` 1200px (wide panel). CSS custom properties cannot be used inside media queries, so the values are kept in a comment block and a `breakpoints.ts` for the rare JS check (`matchMedia`).
- **Phone details:** `100dvh` instead of `100vh` for sheets (mobile browser bars); `env(safe-area-inset-*)` for the tab bar and sheet footers (`viewport-fit=cover` in `index.html`); touch targets at least 44 × 44px (06 §4); `overscroll-behavior: contain` on sheets; inputs at 16px or more so iOS does not zoom on focus.
- **Split the stylesheet** by concern, imported from `main.tsx` in this order: `tokens.css`, `base.css`, `layout.css` (shell, page, footer), `components/*.css` (one per shared component), `pages/*.css`. Use `@layer tokens, base, layout, components, pages;` so order, not specificity, decides conflicts. Vite bundles them into one file.
- Keep plain CSS (06 U-4). No CSS framework.

### F-2 Route table and feature flags · ❌ Not built
`src/routes.ts` lists every page once; `App`, the navigation (F-3), page titles and the static-page build (F-10) all read it.

```ts
type FeatureStatus = "live" | "preview" | "hidden";

interface RouteDef {
    id: "cards" | "search" | "fusion" | "duelists";
    path: string;                 // "/", "/search", "/fusion", "/duelists"
    match: RegExp;                // also covers "/duelists/<id>"
    label: string;                // tab label
    icon: () => JSX.Element;      // from components/icons.tsx
    status: FeatureStatus;
    page: React.LazyExoticComponent<() => JSX.Element>;
}
```

- **`live`**: in the navigation, in the sitemap. **`preview`**: reachable and shown in the navigation only in `yarn dev`, `yarn preview` and when the URL has `?preview=1` (remembered for the session); production users never see it. **`hidden`**: 404 everywhere.
- Default statuses: Cards `live`, Search `live` (it works with today's catalog, F-7), Fusion `preview`, Duelists `preview`. A feature goes `live` in the PR that brings its catalog data.
- Pages are **lazy-loaded** (`React.lazy` + `Suspense`), so the catalog page does not pay for the fusion tool's code.
- The router stays our own (`router.tsx`, 09). Additions: path params from `match`, and **scroll restoration** per history entry (store `scrollY` in `history.state` before navigating, restore on `popstate`), which phones need when Back returns to a long list.

### F-3 App shell and navigation · ❌ Not built · TBD-F1, TBD-F2
Reverses 09 C-1 ("header without menu"), so it needs the owner's agreement.

- **Phones: a bottom tab bar**, fixed, one tab per `live` route (plus `preview` ones where previews show): icon above a short label, 56px tall plus the bottom safe area, active tab marked with `aria-current="page"` and the accent color. Thumb-reachable, always visible, and one tap to each feature; a hamburger menu hides features that players need to discover.
- **Desktop (`md`+): the same entries as tabs in the header**, between the brand and the catalog version; the bottom bar is not shown.
- **With only one `live` route the navigation is not rendered**, so the site looks exactly like 09 until a second feature goes live.
- The tab bar hides while a full-screen sheet (filters, card details on phones) is open, and the page gets `padding-bottom` for the bar so the footer is not covered.
- Re-tapping the active tab scrolls the page to the top (and on Cards, like the logo, clears the filters: 09 C-1).
- Built as a `<nav aria-label="Main">` list of `<Link>`s, not a JS tab widget: these are pages.

### F-4 Shared UI primitives · ❌ Not built
Extracted from today's code (with no behaviour change for the catalog), then reused by F-7 to F-9. Each lives in `components/` with its own CSS file.

| Primitive | What it is | Extracted from | Used by |
|---|---|---|---|
| `Sheet` | Full-screen dialog on phones, side panel or centered dialog on `md`+. Focus moves in and back, Esc closes, Back closes it when it was opened with a history entry, body scroll locked, slide motion off with `prefers-reduced-motion` | `Filters`, `CardDetails` | Filters, card details, card picker, search on phones |
| `CardRow` | Compact one-line card: thumbnail, `#id`, name, type badge, ATK/DEF or cost. 56px tall, the whole row is one button | new (phone density) | Search results, fusion lists, deck and drop lists |
| `CardPicker` | A search field plus `CardRow` results (`searchCards({ text, limit })`) in a `Sheet`; returns the picked `CardId`. Can be limited by a `CardQuery` (for example monsters only) | `SearchBox` | Fusion material slots, F-7 |
| `EmptyState` | Dashed frame, title, text, one action | `CatalogPage` zero results | Every list; also the "Coming soon" screen of `preview` features |
| `Tabs` / segmented control | Accessible `role="tablist"` for sections inside a page | new | Duelist page (Deck / Drops), fusion modes |
| `useUrlState` | Generic query-string ⇄ state hook (parse, build, replace vs push), the pattern of `catalogUrl.ts` | `catalogUrl.ts` | Fusion (`?a=&b=`), duelists (`?q=&tab=`) |
| `PercentBar` | Inline bar with a number, for drop and deck rates | new | Duelist drops |

### F-5 Card details on every page · ❌ Not built
Lift `CardDetails` from `CatalogPage` to `App`, keyed by a `?card=<id>` param that works on **any** route (`/fusion?a=1&b=2&card=425`). Tapping a card anywhere (fusion result, a drop, a search result) opens the same panel, and Back closes it, as in 09 C-6.

- Previous / next stay available only where there is an ordered list (the catalog results); elsewhere the panel shows the card alone.
- `CardInfo` gets **relation sections** as plug-ins: "Fusions" (made from / used in, from F-8's adapter) and "Dropped by" (from F-9's adapter). A section renders only when its feature is `live` and has data, which keeps 09 C-4's "no empty sections" rule.

### F-6 Data adapters and dev fixtures · ❌ Not built
The site never filters, sorts or resolves game data itself (09 C-2). For features whose catalog functions do not exist yet, the UI is written against a **thin adapter with the exact signatures planned in 04 Q-5**:

```ts
// src/data/fusions.ts
export interface FusionView { materials: [ICard, ICard]; result: ICard }
export function getFusion(a: CardId, b: CardId): ICard | undefined;
export function getFusionsWith(id: CardId): FusionView[];
export function getFusionsFor(resultId: CardId): FusionView[];

// src/data/duelists.ts (shapes follow 02 D-3's draft: IDuelist, IDeckEntry, IDrop)
export function getDuelistList(): DuelistView[];
export function getDuelist(id: string): DuelistView | undefined;
export function getDropsFrom(id: string): DropView[];
export function getDroppedBy(cardId: CardId): DropView[];
```

- **Production:** each function calls the catalog export once it exists, and returns empty results until then (the feature is `preview`, so nobody sees it).
- **Dev and preview:** small hand-written **fixtures** in `src/data/fixtures/` (a dozen fusions, three duelists), clearly fake ("Fixture duelist"), so the screens can be designed and reviewed on a phone with realistic list lengths, long names and empty cases. Fixtures are tree-shaken out of production builds (`import.meta.env.DEV` or the preview flag).
- When the catalog ships the real functions, the adapter becomes a re-export and the fixtures are deleted. The view types are the site's, so a different final catalog shape changes one file.

### F-7 Search card · ❌ Not built · TBD-F3
A **quick look-up from anywhere**, separate from the catalog's filters. Works with today's catalog (`searchCards`), so it can go `live` first.

- **Phones:** the "Search" tab opens a full-screen search (`/search?q=`): autofocused 16px input, results as `CardRow`s (`searchCards({ text, limit: 30 })`, "Show all N in the catalog" link to `/?q=`), **recent searches** and recently opened cards (in `localStorage`, best effort, with a "Clear" button) when the field is empty.
- **Desktop:** a search field in the header; `/` focuses it from any page (06 §4); results in a dropdown (`role="combobox"` + `listbox`, arrow keys, `Enter` opens the card's details).
- **Matches** by name today. An `#id` or a number (`425`) jumps to that card (`searchCards({ ids: [425] })`). Searching by **password** (8 digits) needs a catalog field in `CardQuery` (04 follow-up), not site code.
- Picking a result opens the card's details on the current page (F-5), so search does not lose the player's place.
- **No filters here.** The filter panel (09 C-2) stays on the Cards page only (owner request, 2026-10-23); quick search is text only, with "Show all N in the catalog" handing over to the Cards page and its filters. Fusion and Duelists pages do not get the panel either; their `CardPicker` may be limited by a fixed `CardQuery` (for example monsters only), not a user-facing filter.

### F-8 Fusion tool · ❌ Not built · TBD-F4
Route `/fusion`, `preview` until the catalog has fusion data and the Q-5 functions. Three modes in a segmented control, each kept in the URL (`useUrlState`):

| Mode | Question | URL | Adapter |
|---|---|---|---|
| **Combine** (default) | What do these two cards fuse into? | `/fusion?a=1&b=2` | `getFusion(a, b)` |
| **Uses** | What can this card fuse with? | `/fusion?mode=with&card=…` | `getFusionsWith(id)` |
| **Recipes** | How do I make this card? | `/fusion?mode=for&card=…` | `getFusionsFor(id)` |

Phone layout of **Combine**, top to bottom: two large **material slots** (tap opens the `CardPicker`; a filled slot shows the card art and name with a clear button), a "swap" button between them, then the **result card** (art, name, ATK/DEF; tap opens details) or "These cards don't fuse". Slots stack vertically on phones and sit side by side with the result on `md`+. Order does not matter in FM (02 TBD-D2, resolved), so swapping never changes the result; it is there for comfort.

**Uses** and **Recipes** show one picked card and a list of `CardRow` pairs ("+ Material → Result"), sortable by result ATK, which is what players compare.

### F-9 Duelists · ✅ Built (live)
Routes `/duelists` and `/duelists/<id>`, `live` since 02 TBD-D9 was resolved and the data landed (catalog 0.7.0). As built: no stage grouping (the game has no stages); rows show the portrait, the game's number, and the drop and deck counts.

**Duelist page layout (owner request, 2026-10-24):** the Duelists pages use the full page width (`--page-width`, as Home and Cards; the 760px column is gone), and keep room for the docked card panel like the catalog. A hero with the portrait over a blurred copy, stat tiles and previous / next duelist links. Phones show one rank at a time (chips); md shows one rank as a grid of rows; from lg the three ranks sit side by side, with sticky column heads. The deck is a grid. Motion: the hero pops in and its numbers count up, rows come in one after another and their rate bars grow, lists replay on tab, rank or sort changes, rows lift on hover; all of it is off with `prefers-reduced-motion` (`styles/motion.css`).

- **List** (`/duelists`): a search box and `CardRow`-like duelist rows (portrait placeholder, name, campaign stage), grouped by stage when the data has stages (TBD-D9); phones get one column, `md`+ a grid.
- **Duelist page** (`/duelists/<id>`): header with name and stage; `Tabs` for **Drops** (default, the most looked-up) and **Deck**. Drops are split by rank (S/A-POW, B/C/D, S/A-TEC, per 02's draft; final list TBD-D9) with a segmented control, each card as a `CardRow` with a `PercentBar`. Sort by rate or ATK.
- The card details panel gains **"Dropped by"** (F-5): duelists and rates, each linking to the duelist page.

### F-10 Static pages and sitemap · ❌ Not built
`build/cardPages.ts` also writes `search/`, `fusion/` and `duelists/<id>/index.html` for `live` routes only (own title and description, as in 09 C-7), and lists them in `sitemap.xml`. `preview` routes get no static page and go through `404.html`, so they are never indexed.

## 5. Acceptance criteria

- [ ] F-1 lands with no visual change: screenshots at 375px, 768px and 1280px match before and after; no `max-width` media query remains for layout.
- [ ] At 360–430px every page has no horizontal scroll, every tap target is at least 44 × 44px, and the tab bar clears the home indicator on iOS.
- [ ] With only Cards `live`, production looks and behaves exactly like 09 (no navigation rendered).
- [ ] `preview` routes are absent from production navigation, static pages and the sitemap, and 404 without `?preview=1`; fixtures are not in the production bundle.
- [ ] A card opened from search, a fusion result or a drop opens the same details panel, and Back closes it.
- [ ] The site still filters and resolves nothing itself: fusion and duelist screens call only the adapters (F-6), which call only catalog exports in production.
- [ ] Keyboard: `/` focuses search, the tab bar and header tabs are reachable, sheets trap and return focus.
- [ ] Lighthouse on a phone profile: Performance ≥ 90, Accessibility ≥ 95 on Cards, Search and Fusion (06 §5).
- [ ] `yarn typecheck`, `yarn lint`, `yarn test` and the Pages deploy pass.

## 6. TBD / open questions

- **TBD-F1:** Reopen 09 C-1 and the one-page decision: add navigation once a second feature goes live? (This spec assumes **yes**.)
- **TBD-F2:** Phone navigation pattern: **bottom tab bar** (default, recommended) or a hamburger menu / drawer.
- **TBD-F3:** What "Search card" should do: a quick look-up from any page (default, F-7), or something more: search by password, by description, or a "find cards like this" search?
- **TBD-F4:** Fusion tool scope: two-card look-up plus the "uses" and "recipes" lists (default), or also a **hand simulator** (up to 5 cards, fused in order, as the game does)? The simulator needs the catalog to define how chained fusions resolve (02 TBD-D2 covers pairs only).
- **TBD-F5:** Unfinished features in production: hidden behind the preview flag (default, keeps 06's "no empty screens"), or a visible "Coming soon" tab?
- ~~**TBD-F6:**~~ Duelist portraits: none (default, initials in a frame) or linked from the wiki like card images (would extend 08)? **Resolved (owner, 2026-10-24): linked from the wiki**, Yugipedia's `Portal:Yu-Gi-Oh! Forbidden Memories characters` (every duelist has one; rematches reuse the first portrait), never from fan sites. Stored in each duelist file and checked like card images; initials remain the fallback when an image fails to load.

## Delivery

Suggested PRs, each small and shippable on its own:

1. **F-1** mobile-first CSS refactor and stylesheet split (no visual change).
2. **F-2 + F-4 + F-5**: route table, flags, shared primitives, app-level card details (no visual change; Cards still the only `live` route).
3. **F-3 + F-7**: navigation and quick search; the first PR that changes what users see.
4. **F-6 + F-8**: fusion adapter, fixtures and tool, as `preview`. Goes `live` with the catalog's fusion data and 04 Q-5.
5. **F-9**: duelist screens as `preview`. Goes `live` after 02 TBD-D9 and the duelist data.
6. **F-10** grows with each feature that goes `live`.
