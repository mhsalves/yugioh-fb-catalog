# 09 – Site: single catalog page (filter, grid, card details)

> **Status: Built** (2026-10-20, with the §6 defaults). Requested by the project owner on 2026-10-20. Replaces the multi-page plan in [06](./06-site-ux-forbidden-memories.md) U-2 with **one page**: a filter over the catalog library, a grid of results and a details card. Visuals follow the style guide when it arrives (06 U-1, TBD-U3); this spec fixes structure and behaviour only.

## 0. Status

Build status as of 2026-10-20, branch `spec-09-catalog-filter-page` (based on `main` @ `d72f97e`). Legend in the [index](./README.md#status-system).

**7 built · 0 partial · 0 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| C-1 | One page, header without menu | Agreed | ✅ Built | Header: logo (back to the full catalog), copyable catalog package `name@version`, npm and GitHub links; no menu. `App.tsx` renders the catalog at `/` and the 404 view elsewhere |
| C-2 | Filter bound to the library (`searchCards`) | Agreed | ✅ Built | `searchCards` (catalog 0.3.0); "By type" row with "All types" above the grid; filter panel (desktop column, phone sheet) for the other fields |
| C-3 | Results grid | Agreed | ✅ Built | `CardTile` grid, 2 columns on phones; zero results show a placeholder with "Clear filters" |
| C-4 | Card details card | Agreed | ✅ Built | `CardDetails` as a side panel (like Google Drive's details pane): stats, stars, copyable password, ritual recipe, **Share**, previous/next |
| C-5 | Footer with owner links | Agreed | ✅ Built | `Footer`: "Made by Matheus Alves", Home page and GitHub links |
| C-6 | Filter and open card kept in the URL | Agreed | ✅ Built | `catalogUrl.ts` maps the query string to `CardQuery` and back; opening a card pushes history |
| C-7 | Shared card pages | Agreed | ✅ Built | `/cards/<id>/`: the link the Share button hands out; a standalone card page with "Back to the catalog" (`CardPage`). The build writes one per catalogued card plus `sitemap.xml` (TBD-C1 resolved 2026-10-20) |

## 1. Why this spec exists

Goal **G1** (a site that displays the catalog data) and **G5** (methods to search and read the data) meet here. Most visitors come to **look up cards**. One page that filters the whole catalog and shows any card's details answers that directly, with no navigation to learn.

The page is also the **reference consumer of the npm API** ([04](./04-catalog-query-api.md)): every filter maps to a library parameter, so the site and npm users get the same results from the same code. The site never filters or sorts cards by itself.

## 2. What exists today

`mkt_site/` (Vite + React + plain CSS, see `ARCHITECTURE.md` §5), deployed by `pages.yml` on merge ([07](./07-site-github-pages-delivery.md) P-1):

| Part | Today | File |
|---|---|---|
| Header | Logo (home link), menu built from `routes.ts` (one entry: Home), catalog version button (copies `@mhsalves/yugioh-fb-catalog@<version>`), npm link | `src/components/Header.tsx`, `CatalogVersion.tsx` |
| Pages | Placeholder Home at `/`, a 404 view for other paths | `src/pages/` |
| Router | Path-only router with base-path helpers | `src/router.tsx` |
| Footer | None | — |

Library functions available on `main` (`catalog/src/tools/`, exported from the package root):

| Function / constant | Use on this page |
|---|---|
| `getCardList()` | Every catalogued card (5 of 722 today) |
| `getCard(id)` | Load the card for the details card |
| `getCardsByType(cardType)`, `getCardsByMonsterType(monsterType)` | Single-field filters; superseded by `searchCards` for the page |
| `getRitual(ritualOrResultId)` | Ritual recipe in the details card |
| `CARD_TYPES`, `MONSTER_TYPES`, `GUARDIAN_STARS` | Option lists for the filter |
| `GUARDIAN_STAR_ADVANTAGE`, `TOTAL_CARDS` | Details card ("strong against"), coverage count |

## 3. Gaps

| # | Gap |
|---|---|
| C-gap-1 | There is no way to search or filter cards on the site. |
| C-gap-2 | The library has no multi-field query: combining name, card type, monster type, star and stat ranges needs `searchCards` (04 Q-4). |
| C-gap-3 | No page shows a card's full data (stats, guardian stars, password, ritual recipe). |
| C-gap-4 | A menu with a single entry adds nothing on a one-page site. |
| C-gap-5 | The site does not say who made it or link back to the owner. |

## 4. Proposed improvements

### Layout

```
Desktop (≥ 720px)                                    Phone (< 720px)
┌──────────────────────────────────────────────────┐  ┌──────────────────────┐
│ [logo] FM Catalog            v0.3.0 ⧉   npm ↗    │  │ [logo]  v0.3.0⧉ npm↗ │
├────────────┬─────────────────────────────────────┤  ├──────────────────────┤
│ Filters    │ Search ___________________________  │  │ Search ____ [Filters]│  Filters opens a sheet
│ ☐ descr.   │ By type (All types) Monster Magic … │  │ By type (All types)… │
│ Monster    │ 5 cards · 5 of 722 catalogued Sort▾ │  │ 5 cards        Sort▾ │
│ type …     │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │  │ ┌────────┐┌────────┐ │
│ Star …     │ │#315 │ │#332 │ │#425 │ │#674 │     │  │ │ #315   ││ #332   │ │
│ Level ▢–▢  │ └─────┘ └─────┘ └─────┘ └─────┘     │  │ └────────┘└────────┘ │
│ ATK ▢–▢    │                                     │  │                      │
│ [Clear]    │                                     │  │                      │
├────────────┴─────────────────────────────────────┤  ├──────────────────────┤
│ Made by Matheus Alves      Home page ↗  GitHub ↗ │  │ Home page ↗ GitHub ↗ │
└──────────────────────────────────────────────────┘  └──────────────────────┘
```

Clicking a grid item opens the **details card** over the page (C-4).

### C-1 One page, header without menu · ✅ Built
> **Changed 2026-10-23 by [10](./10-site-feature-shell-mobile-first.md) F-3:** with more than one visible page, the header gets navigation tabs (a bottom tab bar on phones). With only the catalog visible it stays as described here.

- The site has **one page**, the catalog, at the site root (`/yugioh-fb-catalog/`).
- The header keeps the **logo** (back to the full catalog: clears filters and the open card, scrolls to top), the **catalog package** button (shows and copies `@mhsalves/yugioh-fb-catalog@<version>`), the **npm** link and the **GitHub** repository link. The **menu is removed**, with its mobile toggle and `routes.ts`.
- Unknown paths keep showing the 404 view, with a link back to the catalog ([07](./07-site-github-pages-delivery.md) P-4).
- On phones the package button and the npm and GitHub links stay visible (they wrap when needed); below 400px the "FM Catalog" text next to the logo is hidden so they fit.

### C-2 Filter bound to the library · ✅ Built
**Rule:** the page calls **one library function**, `searchCards(query)` from [04](./04-catalog-query-api.md) Q-4, and renders what it returns. Every filter control maps to one `CardQuery` field. Option lists come from the library's exported enums, so a new monster type in the data appears in the filter with no site change.

**Prerequisite:** build 04 Q-4 first, in the catalog, with tests. The site uses the workspace catalog (07 P-2), so it does not wait for an npm release.

| Control | `CardQuery` field | Options / input | Notes |
|---|---|---|---|
| Search box | `text` | Free text | Case- and accent-insensitive substring on the name (Q-4). Debounced ~150 ms |
| "Also search descriptions" checkbox | `includeDescription` | On / off | Off by default |
| **By type** row, above the grid | `cardType[]` | "All types" + `CARD_TYPES` | Always visible (not inside the panel). Multi-select; "All types" clears the selection and is shown selected when none is chosen (owner request, 2026-10-20) |
| Monster type chips | `monsterType[]` | `MONSTER_TYPES` | Multi-select. Enabled only while "Monster" is selected in "By type" (owner request, 2026-10-23); disabled with a hint otherwise, "All types" included |
| Guardian star chips | `guardianStar[]` | `GUARDIAN_STARS` | Matches either of a monster's two stars |
| Level | `level { min, max }` | Two number inputs, 1–12 | Monster-only, like ATK and DEF |
| ATK / DEF | `attack`, `defense` `{ min, max }` | Two number inputs each | Empty = no limit |
| Cost | `cost { min, max }` | Two number inputs | Starchips |
| Sort | `sort { by, dir }` | ID, name, ATK, DEF, level, cost; ascending or descending | Default: ID ascending |
| Clear filters (panel) | — | Button | Resets the panel fields; keeps the search text, "By type" and the sort |

- Results update as the user types or clicks; there is no "Apply" button.
- The page shows the result count from `searchCards(...).total` and the catalogue coverage: "**N cards** · 5 of 722 catalogued" (`getCardList().length` of `TOTAL_CARDS`).
- **Zero results:** a placeholder in place of the grid: an empty dashed card frame, "No cards found", "No cards match these filters. Try another type or clear the filters." and a "Clear filters" button that resets everything except the sort (owner request, 2026-10-20).
- Monster-only filters (monster type, star, level, ATK, DEF) are **enabled only while "Monster" is selected** in "By type". Deselecting "Monster" (or choosing "All types") clears them, so a disabled filter never narrows the results. A URL with monster filters and no card type selects "Monster" (older links keep working); one with only other card types drops them. With "Monster" and other types selected, set monster filters leave the other types out (Q-4), as the hint says.
- Desktop: filters in a left column. Phones: a "Filters" button opens them in a full-screen sheet with "Show N cards" to close (TBD-C2).

### C-3 Results grid · ✅ Built
> **Changed 2026-10-23 (owner request):** results are **paged, 48 cards a page** (`?page=` in the URL; through `searchCards`'s `limit` and `offset`). A filter change goes back to page 1; page changes add a history entry; previous / next in the details card cross page edges and the grid follows. Phones show Previous / "Page N of M" / Next, wider screens numbered pages.

- A responsive grid: `repeat(auto-fill, minmax(~180px, 1fr))`, which gives 2 columns on phones and 4–6 on desktop.
- **Each grid item** shows: `#id`, name, card type badge (color per type, 06 U-1), and for monsters the monster type, level and ATK/DEF. The image area shows the styled placeholder frame until card images land ([08](./08-card-images.md) I-4).
- Each item is a **button** (keyboard focusable, `Enter`/`Space` opens the details card) with an accessible name such as "Thunder Dragon, #425, Monster".
- Only catalogued cards appear (TBD-C3). With at most 722 cards, the grid renders them all; virtualization is added only if it measurably helps (06 U-3).

### C-4 Card details card · ✅ Built
Opens when a grid item is clicked, as a **side panel** next to the grid, like a file manager's details pane (owner choice, 2026-10-20, replacing a modal `<dialog>`). The grid and the filters stay usable while it is open: clicking another card swaps the panel's content and highlights its tile.

| Screen width | Layout |
|---|---|
| ≥ 1200px | Docked to the window's right edge, **1.5rem** from it, from below the header to the bottom (380px wide). The page and footer keep their left edge and stop before it |
| 721–1199px | Same, 360px wide; while a card is open the filter column folds into the "Filters" button (the phone sheet) |
| ≤ 720px | Full screen |

**Motion:** the panel slides in from the right and fades in (220ms), slides out on close (180ms), and its content fades when switching cards; the grid narrows smoothly. All of it is off with `prefers-reduced-motion`.

Focus moves to the panel's title when it opens and back to the card's tile when it closes. `Esc` and the close button close it; ←/→ move through the results, except while typing in a field.

| Section | Content | Library source |
|---|---|---|
| Title | `#id` and name, card type badge | `getCard(id)` |
| Monster stats | Monster type, level, ATK / DEF | `getCard(id)` |
| Guardian stars | Both stars, each with "strong against <star>" | `GUARDIAN_STAR_ADVANTAGE` |
| Description | Card text | `getCard(id)` |
| Password | 8-digit code with a **copy** button, and the starchip cost | `getCard(id).password` |
| Ritual | For a ritual card: the monster it summons and its materials. For a monster made by a ritual: the ritual card and materials. Each entry opens that card's details | `getRitual(id)` |
| Image | Styled frame now; the linked image when 08 is built | 08 I-3 |

- **Share** (next to Close) hands out the card's own page, `/cards/<id>/` (C-7): the system share sheet where there is one (phones), otherwise it copies the link and shows "Link copied". The catalog stays as it is.
- **Previous / next** buttons (and ←/→ keys) move through the **current results**, in the current sort.
- Closing returns focus to the grid item that opened it.
- Fusions, equips, fields and drops are added to this card when their data and library functions exist (04 Q-5). The card shows nothing for relations that have no data, with no empty sections.

### C-5 Footer with owner links · ✅ Built
At the bottom of the page, on every view (including 404):

| Link | URL |
|---|---|
| Home page | https://matheusalves.dev |
| GitHub profile | https://github.com/mhsalves |

- Plain text links with an external-link icon, opening in a new tab (`rel="noopener"`), and visible on phones.
- Text: "Made by Matheus Alves", then the two links, then the notice "Unofficial fan project. Yu-Gi-Oh! is a trademark of Konami." (TBD-C4, resolved 2026-10-20).

### C-6 Filter and open card kept in the URL · ✅ Built
Shareable views, with no extra pages. The query string holds the filter and the open card:

```
/yugioh-fb-catalog/?q=dragon&type=Monster&mtype=Dragon,Thunder&star=Sun&atk=1000-&sort=attack-desc&card=425
```

- Empty fields are left out, so the plain catalog URL stays clean.
- Changing filters **replaces** the history entry (no history spam). Opening a card **pushes** one, so the browser Back button closes it.
- An unknown or uncatalogued `card` id shows a short "Card #N is not in the catalog yet." message in the details card.
- `?card=` is the in-app address while browsing. The address to **share** a card is its own page (C-7).

### C-7 Shared card pages · ✅ Built
A card's own page, `/cards/<id>/`, is **only reached through a shared link**: the Share button in the catalog's details card (C-4) hands it out, and nothing in the catalog links to it otherwise (owner request, 2026-10-20). Whoever opens it sees:

- a **"Back to the catalog"** link above the card and a **"Browse the full catalog"** button below it, both to the home catalog;
- the same card content as the details card (`CardInfo`): stats, guardian stars, copyable password, cost, description, ritual recipe (catalogued cards in the recipe link to their own pages);
- a Share button, to pass the link on;
- for an uncatalogued id (through `404.html`): "Card #N is not in the catalog yet." with the same way back.

The same address also serves search engines, since one page with `?card=` is not indexed per card. The build writes a static page per catalogued card (06 U-5, S-2):

| Output | Content |
|---|---|
| `cards/<id>/index.html` | The app shell with the card's own `<title>` and meta description ("Thunder Dragon – Lv5 Thunder – 1600/1500 – Yu-Gi-Oh! FM Catalog"), canonical link, Open Graph tags, and a readable summary (stats, password, description, "Open in the catalog") inside `#root` |
| `sitemap.xml` | The catalog and every card page |

- Generated in `mkt_site/build/cardPages.ts`, from the catalog's public API (`getCardList`), by the Vite build plugin. Only catalogued cards get a page; other `/cards/<id>` addresses go through `404.html`.
- When the app starts on `/cards/<id>/`, it renders the card page (`src/pages/CardPage.tsx`) in place of the static summary; the address stays `/cards/<id>/`.
- Absolute URLs come from `SITE_URL` (set by `pages.yml` from `actions/configure-pages`, upgraded to `https`), falling back to the github.io address.

## 5. Acceptance criteria

- [x] `searchCards` (04 Q-4) is built in the catalog with unit tests, and the page calls only `searchCards`, `getCard`, `getCardList`, `getRitual` and exported constants. No filtering or sorting code in `mkt_site/`.
- [x] Every filter control in C-2 changes the results, and its options come from the library enums.
- [x] Clicking or pressing `Enter` on a grid item opens its details card; `Esc`, the close button and Back all close it, and focus returns to the item.
- [x] Reloading a URL with filters and `card=` restores the same view.
- [x] The header has no menu; the footer links to https://matheusalves.dev and https://github.com/mhsalves and shows the fan-project notice.
- [x] The details card's Share button hands out `/cards/<id>/`; that page shows the card on its own with "Back to the catalog", has its own title, description and canonical link, and is listed in `sitemap.xml`.
- [x] Works at 375px width with no horizontal scroll; all controls are native buttons and inputs, reachable by keyboard. (A formal WCAG AA contrast audit waits for the style guide, TBD-C5.)
- [x] `yarn typecheck`, `yarn lint`, `yarn test` and the Pages deploy pass.

## 6. TBD / open questions

- ~~**TBD-C1:** Per-card pages for search engines.~~ **Resolved 2026-10-20:** a static page per catalogued card plus `sitemap.xml` (C-7).
- **TBD-C2:** Filter placement: left column on desktop and a sheet on phones (default), or a horizontal bar above the grid?
- **TBD-C3:** Show only catalogued cards (default), or also show placeholders for the 717 missing IDs (useful for contributors, noisy for players)?
- ~~**TBD-C4:** Footer fan-project notice.~~ **Resolved 2026-10-20:** "Unofficial fan project. Yu-Gi-Oh! is a trademark of Konami." in the footer (C-5).
- **TBD-C5:** Colors, fonts, card-type colors and the placeholder frame come from the style guide (06 U-1, TBD-U3, TBD-U4).

## Delivery

Built in one PR (#38) with the §6 defaults, then C-7 and the footer notice (TBD-C1, TBD-C4): `searchCards` in catalog 0.3.0 (spec 04 Q-4, 16 tests), then C-1 to C-6 in `mkt_site/`. No catalog data was added. Next: apply the style guide (TBD-C5).
