# 09 – Site: single catalog page (filter, grid, card details)

> **Status: Agreed.** Requested by the project owner on 2026-10-20 (open details in §6). Replaces the multi-page plan in [06](./06-site-ux-forbidden-memories.md) U-2 with **one page**: a filter over the catalog library, a grid of results and a details card. Visuals follow the style guide when it arrives (06 U-1, TBD-U3); this spec fixes structure and behaviour only.

## 0. Status

Build status as of 2026-10-20, `main` @ `d72f97e`. Legend in the [index](./README.md#status-system).

**0 built · 1 partial · 5 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| C-1 | One page, header without menu | Agreed | 🟡 Partial | Header has logo, copyable catalog version and npm link, plus a one-item menu ("Home") to remove |
| C-2 | Filter bound to the library (`searchCards`) | Agreed | ❌ Not built | No filter; `searchCards` (04 Q-4) not built |
| C-3 | Results grid | Agreed | ❌ Not built | Placeholder "Hello, duelist!" page |
| C-4 | Card details card | Agreed | ❌ Not built | None |
| C-5 | Footer with owner links | Agreed | ❌ Not built | No footer |
| C-6 | Filter and open card kept in the URL | Agreed | ❌ Not built | Router handles paths only |

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
Desktop (≥ 1024px)                                   Phone (< 720px)
┌──────────────────────────────────────────────────┐  ┌──────────────────────┐
│ [logo] FM Catalog            v0.2.0 ⧉   npm ↗    │  │ [logo] FM Catalog  ⋯ │  ⋯ = version + npm
├────────────┬─────────────────────────────────────┤  ├──────────────────────┤
│ Search ___ │ 5 cards · 5 of 722 catalogued  Sort▾│  │ Search ____ [Filters]│  Filters opens a sheet
│ Card type  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │  │ 5 cards        Sort▾ │
│ □ Monster… │ │#315 │ │#332 │ │#425 │ │#674 │     │  │ ┌────────┐┌────────┐ │
│ Monster    │ │name │ │name │ │name │ │name │     │  │ │ #315   ││ #332   │ │
│ type …     │ │type │ │type │ │type │ │type │     │  │ └────────┘└────────┘ │
│ Star …     │ └─────┘ └─────┘ └─────┘ └─────┘     │  │ ┌────────┐┌────────┐ │
│ Level ▢–▢  │                                     │  │ │ #425   ││ #674   │ │
│ ATK ▢–▢    │                                     │  │ └────────┘└────────┘ │
│ [Clear]    │                                     │  │                      │
├────────────┴─────────────────────────────────────┤  ├──────────────────────┤
│ Matheus Alves · Home page ↗ · GitHub ↗           │  │ Home page ↗ GitHub ↗ │
└──────────────────────────────────────────────────┘  └──────────────────────┘
```

Clicking a grid item opens the **details card** over the page (C-4).

### C-1 One page, header without menu · 🟡 Partial
- The site has **one page**, the catalog, at the site root (`/yugioh-fb-catalog/`).
- The header keeps the **logo** (scrolls back to top and clears the open card), the **catalog version** button (copy) and the **npm** link. The **menu is removed**, with its mobile toggle and the `label` field of `routes.ts`.
- Unknown paths keep showing the 404 view, with a link back to the catalog ([07](./07-site-github-pages-delivery.md) P-4).
- On phones the version and npm link stay visible if they fit; otherwise they go behind a small "⋯" button. That is the only collapsible part of the header.

### C-2 Filter bound to the library · ❌ Not built
**Rule:** the page calls **one library function**, `searchCards(query)` from [04](./04-catalog-query-api.md) Q-4, and renders what it returns. Every filter control maps to one `CardQuery` field. Option lists come from the library's exported enums, so a new monster type in the data appears in the filter with no site change.

**Prerequisite:** build 04 Q-4 first, in the catalog, with tests. The site uses the workspace catalog (07 P-2), so it does not wait for an npm release.

| Control | `CardQuery` field | Options / input | Notes |
|---|---|---|---|
| Search box | `text` | Free text | Case- and accent-insensitive substring on the name (Q-4). Debounced ~150 ms |
| "Also search descriptions" checkbox | `includeDescription` | On / off | Off by default |
| Card type chips | `cardType[]` | `CARD_TYPES` | Multi-select; none selected = all |
| Monster type chips | `monsterType[]` | `MONSTER_TYPES` | Multi-select. Disabled, with a hint, when card types are selected and "Monster" is not one of them |
| Guardian star chips | `guardianStar[]` | `GUARDIAN_STARS` | Matches either of a monster's two stars |
| Level | `level { min, max }` | Two number inputs, 1–12 | Monster-only, like ATK and DEF |
| ATK / DEF | `attack`, `defense` `{ min, max }` | Two number inputs each | Empty = no limit |
| Cost | `cost { min, max }` | Two number inputs | Starchips |
| Sort | `sort { by, dir }` | ID, name, ATK, DEF, level, cost; ascending or descending | Default: ID ascending |
| Clear filters | — | Button | Resets every field, keeps the sort |

- Results update as the user types or clicks; there is no "Apply" button.
- The page shows the result count from `searchCards(...).total` and the catalogue coverage: "**N cards** · 5 of 722 catalogued" (`getCardList().length` of `TOTAL_CARDS`).
- **Empty state:** "No cards match these filters." with a "Clear filters" button.
- Monster-only filters (monster type, star, level, ATK, DEF) leave non-monster cards out of the results while they are set. That follows Q-4 and is said in a hint under the group.
- Desktop: filters in a left column. Phones: a "Filters" button opens them in a full-screen sheet with "Show N cards" to close (TBD-C2).

### C-3 Results grid · ❌ Not built
- A responsive grid: `repeat(auto-fill, minmax(~180px, 1fr))`, which gives 2 columns on phones and 4–6 on desktop.
- **Each grid item** shows: `#id`, name, card type badge (color per type, 06 U-1), and for monsters the monster type, level and ATK/DEF. The image area shows the styled placeholder frame until card images land ([08](./08-card-images.md) I-4).
- Each item is a **button** (keyboard focusable, `Enter`/`Space` opens the details card) with an accessible name such as "Thunder Dragon, #425, Monster".
- Only catalogued cards appear (TBD-C3). With at most 722 cards, the grid renders them all; virtualization is added only if it measurably helps (06 U-3).

### C-4 Card details card · ❌ Not built
Opens when a grid item is clicked. A modal **details card** built on the native `<dialog>` element (focus trap, `Esc` to close, backdrop click closes). Full-screen on phones.

| Section | Content | Library source |
|---|---|---|
| Title | `#id` and name, card type badge | `getCard(id)` |
| Monster stats | Monster type, level, ATK / DEF | `getCard(id)` |
| Guardian stars | Both stars, each with "strong against <star>" | `GUARDIAN_STAR_ADVANTAGE` |
| Description | Card text | `getCard(id)` |
| Password | 8-digit code with a **copy** button, and the starchip cost | `getCard(id).password` |
| Ritual | For a ritual card: the monster it summons and its materials. For a monster made by a ritual: the ritual card and materials. Each entry opens that card's details | `getRitual(id)` |
| Image | Styled frame now; the linked image when 08 is built | 08 I-3 |

- **Previous / next** buttons (and ←/→ keys) move through the **current results**, in the current sort.
- Closing returns focus to the grid item that opened it.
- Fusions, equips, fields and drops are added to this card when their data and library functions exist (04 Q-5). The card shows nothing for relations that have no data, with no empty sections.

### C-5 Footer with owner links · ❌ Not built
At the bottom of the page, on every view (including 404):

| Link | URL |
|---|---|
| Home page | https://matheusalves.dev |
| GitHub profile | https://github.com/mhsalves |

- Plain text links with an external-link icon, opening in a new tab (`rel="noopener"`), and visible on phones.
- Text: "Made by Matheus Alves", then the two links. A fan-project notice is optional (TBD-C4).

### C-6 Filter and open card kept in the URL · ❌ Not built
Shareable views, with no extra pages. The query string holds the filter and the open card:

```
/yugioh-fb-catalog/?q=dragon&type=Monster&mtype=Dragon,Thunder&star=Sun&atk=1000-&sort=attack-desc&card=425
```

- Empty fields are left out, so the plain catalog URL stays clean.
- Changing filters **replaces** the history entry (no history spam). Opening a card **pushes** one, so the browser Back button closes it.
- An unknown or uncatalogued `card` id shows a short "Card #N is not in the catalog yet." message in the details card.
- This replaces the `/cards/[id]` pages of 06 U-2 for now (see TBD-C1 for SEO).

## 5. Acceptance criteria

- [ ] `searchCards` (04 Q-4) is built in the catalog with unit tests, and the page calls only `searchCards`, `getCard`, `getCardList`, `getRitual` and exported constants. No filtering or sorting code in `mkt_site/`.
- [ ] Every filter control in C-2 changes the results, and its options come from the library enums.
- [ ] Clicking or pressing `Enter` on a grid item opens its details card; `Esc`, the close button and Back all close it, and focus returns to the item.
- [ ] Reloading a URL with filters and `card=` restores the same view.
- [ ] The header has no menu; the footer links to https://matheusalves.dev and https://github.com/mhsalves.
- [ ] Works at 360px width with no horizontal scroll; all controls reachable by keyboard; WCAG AA contrast.
- [ ] `yarn typecheck`, `yarn lint`, `yarn test` and the Pages deploy pass.

## 6. TBD / open questions

- **TBD-C1:** Per-card pages for search engines. One page with `?card=` is not indexed per card. Keep it like this, or later pre-render a small `/cards/<id>` HTML page per card that redirects into the catalog with `?card=<id>` (06 S-2)?
- **TBD-C2:** Filter placement: left column on desktop and a sheet on phones (default), or a horizontal bar above the grid?
- **TBD-C3:** Show only catalogued cards (default), or also show placeholders for the 717 missing IDs (useful for contributors, noisy for players)?
- **TBD-C4:** Add a footer notice such as "Unofficial fan project. Yu-Gi-Oh! is a trademark of Konami." (pairs with 08 I-5 attribution)?
- **TBD-C5:** Colors, fonts, card-type colors and the placeholder frame come from the style guide (06 U-1, TBD-U3, TBD-U4).

## Delivery plan

1. **Catalog:** build 04 Q-4 `searchCards` with tests (minor version bump, changelog).
2. **Site:** C-1 header change and C-5 footer (small, can ship first).
3. **Site:** C-2 filter, C-3 grid, C-4 details card and C-6 URL state, in one PR.
4. **Style:** apply the style guide when it arrives.
