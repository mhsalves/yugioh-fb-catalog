# 06 – Site UI/UX inspired by Yu-Gi-Oh! Forbidden Memories

> **Status: Proposed.** Visual direction and page list. Final visuals need a design pass (mock-ups) before they are built.

## 1. Why this spec exists

Goal **G1**: the project keeps a **site that displays the catalog data** with **a good UI/UX based on *Yu-Gi-Oh! Forbidden Memories***. The site is how most people will meet the project. Players of a 1999 PS1 game come for:

- **look-ups** they used to do on old fan pages: card stats, passwords, fusions, drops;
- **nostalgia**: the game's dark-blue menus, gold-framed windows and Egyptian motifs.

A generic Material UI grid (what exists today) serves neither well. A themed, search-first site does. It also acts as the **reference consumer** of the npm API ([04](./04-catalog-query-api.md)): every screen is built from public functions only.

## 2. What exists today

`server/` (Next.js 15, static export, MUI 6 + Toolpad; see `ARCHITECTURE.md` §5):

- One page, `pages/index.tsx`, titled "Cards registered".
- It renders `TOTAL_CARDS = 721` slots and calls `getCard(id)` for each one.
- Each slot is an MUI `Card` showing `#id`, name, description, card type, password code and cost. Missing cards show "Not available yet" in red, or are hidden by the **Only Available** switch (on by default).
- MUI's default light theme. No search, no filters, no detail page, no navigation.
- Monster stats, guardian stars and ritual recipes exist in the data but **are not shown**.

**Why it is like this** *(inferred)*: the page was built as a **coverage report** to track data entry, not as an end-user product. MUI gave a decent look without writing CSS.

## 3. Gaps

| # | Gap |
|---|---|
| U-gap-1 | No visual identity. It does not feel like FM. |
| U-gap-2 | No search or filters (name, type, monster type, stars, level, ATK/DEF, cost). |
| U-gap-3 | No card detail view, and no shareable URL per card. |
| U-gap-4 | Most fields are not shown (level, ATK/DEF, guardian stars, ritual recipe). |
| U-gap-5 | Renders 721 DOM cards at once, with an O(n) lookup each time. |
| U-gap-6 | Coverage (the page's real purpose today) is not summarized. There is no "5 / 722" progress figure. |
| U-gap-7 | No fusion, equip or duelist screens (they depend on the data in [02](./02-catalog-data-model.md)). |
| U-gap-8 | The README promises a dark/light theme, stats and responsive search that do not exist. |

## 4. Proposed improvements

### U-1 Visual language: "inspired by", not copied
Recreate the **mood** of FM with original CSS and assets:

| FM element | Site treatment |
|---|---|
| Deep navy/indigo menu backgrounds with subtle gradients | Dark-first theme. Background is navy `#0b1630`-ish with a radial vignette (TBD-U3) |
| Gold/bronze bevelled window frames | Bordered panels: a 2px gold border, an inner shadow, rounded corners |
| Card frame colors per card type | A color token per `cardType` (monster = amber/brown, magic = green, trap = magenta, ritual = blue, equip = **TBD-U4**) |
| Pixel/bitmap UI text | Pixel display font for headings and numbers only (for example "Press Start 2P" or "Silkscreen" via Google Fonts). Body text stays in a readable sans-serif |
| Guardian-star symbols | Original SVG icons, one per star, with the name in a tooltip |
| Egyptian / Millennium motifs | Light ornaments (eye-of-Horus-style divider, hieroglyph pattern at low opacity), all original |
| Card "library" list with ID numbers | The main Library page (U-2) mirrors this browse-by-number feel |
| Menu cursor and selection | Keyboard focus ring styled as the game's selection cursor |

**No Konami artwork, logos, sprites or ripped fonts** unless TBD-X3 decides otherwise. Card images are a styled **placeholder frame** that shows the type color, name, level stars, ATK/DEF and guardian-star icons. This renders well and avoids copyright problems.

Accessibility: WCAG AA contrast on the dark theme, `prefers-reduced-motion` respected, all actions keyboard-reachable. Optional light theme (**TBD-U5**).

### U-2 Information architecture (pages)

```mermaid
flowchart TD
    Home["/ Library<br/>search + filters + grid"] --> Card["/cards/[id]<br/>card detail"]
    Home --> Fusion["/fusions<br/>fusion lookup"]
    Home --> Duelists["/duelists, /duelists/[id]<br/>deck + drops"]
    Home --> Password["/passwords<br/>password + starchip list"]
    Home --> Progress["/progress<br/>data coverage"]
    Home --> Api["/docs/api<br/>TypeDoc (05/07)"]
    Card --> Fusion
    Card --> Duelists
```

| Page | Content | Depends on |
|---|---|---|
| **Library** `/` | A search box (name), filter chips (card type, monster type, guardian star, level range, ATK/DEF range, cost range), sorting (ID, name, ATK, DEF, level, cost) and a grid or list toggle. Filter state lives in the URL query string so views are shareable | `searchCards` (04 Q-4) |
| **Card detail** `/cards/[id]` | Large styled card frame, all fields, copy-password button, previous/next by ID, and related data: fusions it makes or is made from, equips, ritual recipe, which duelists drop it. **Statically generated for every ID 1..722** (missing cards render a "not catalogued yet, contribute" page) | 04 Q-1, Q-5 |
| **Fusion lookup** `/fusions` | Pick two cards and see the result. Pick a card and see every fusion it is in | 02 D-3, 04 Q-5 |
| **Duelists** `/duelists` | List of duelists and their deck pools and drop tables | 02 D-3 |
| **Passwords** `/passwords` | A sortable table of ID, name, password and cost. A quick-reference "password machine" view | existing data |
| **Progress** `/progress` | Today's coverage report, upgraded: an overall bar (`5 / 722`), per-type bars, a grid of IDs (filled or missing) linking to the contribute guide | 04 Q-6 |

Pages whose data does not exist yet (fusions, duelists) are hidden from navigation until the data lands. No empty screens ship.

### U-3 Interaction details
- **Instant search:** client-side, debounced. The whole dataset is in the bundle, so there are no requests.
- **Virtualized grid** (for example, `@tanstack/react-virtual`) so only visible cards render (fixes U-gap-5).
- **Keyboard:** `/` focuses search, arrow keys move the selection in the grid, `Enter` opens the card, `Esc` closes. This nods to controller navigation.
- **Mobile:** single-column list, a filter drawer, and 44px touch targets.
- **Empty and loading states** in the FM style ("No cards match.").
- **Optional sound effects** (menu blip), **off by default**, using original sounds only (**TBD-U6**).

### U-4 Component and theming approach (**TBD-U1**)

| Option | Pros | Cons |
|---|---|---|
| **a) Keep MUI**, with a full custom theme *(lowest effort)* | Accessible components (dialogs, sliders, chips), already installed | Hard to escape the "Material" look. Heavy bundle |
| b) Replace MUI with CSS Modules or vanilla-extract plus a few headless primitives (Radix) | Full visual control, smaller bundle, fits the FM look | More code to write |

Recommendation: **b)** if the FM look is a priority, otherwise **a)**. In either case, define design tokens (colors per card type, star colors, spacing, fonts) in one theme file, and drop `@toolpad/core` (only `PageContainer` is used).

### U-5 Static generation and SEO
- `getStaticPaths` / `generateStaticParams` for `/cards/[id]` and `/duelists/[id]`, which works with `output: 'export'` ([07](./07-site-github-pages-delivery.md)).
- A `<title>` and meta description per card ("Thunder Dragon – Lv5 Thunder – 1600/1500 – Yu-Gi-Oh! FM Catalog"), plus Open Graph tags.
- `sitemap.xml` generated at build time.

### U-6 Migration of the current page
The current "Cards registered" page becomes **/progress** (U-2), so the coverage use case is kept.

## 5. Acceptance criteria

- [ ] Every page uses the public catalog API only, with no imports from `catalog/src/data`.
- [ ] Lighthouse: Performance ≥ 90 and Accessibility ≥ 95 on Library and Card detail (mobile).
- [ ] Filter and search state round-trips through the URL.
- [ ] `/cards/1` … `/cards/722` all exist in the static export.
- [ ] No third-party copyrighted asset is shipped (see the TBD-X3 decision).
- [ ] Design mock-ups for Library and Card detail are approved before implementation (TBD-U2).

## 6. TBD / open questions

- **TBD-U1:** Keep MUI with a theme, or move to custom CSS and headless primitives?
- **TBD-U2:** Who produces the mock-ups, and in what tool? Could start as a static HTML prototype.
- **TBD-U3:** Exact palette and fonts (pixel font licence must allow web use: OFL fonts are fine).
- **TBD-U4:** Frame color for Equip cards (and whether FM visually separates Equip from Magic).
- **TBD-U5:** Dark only, or dark plus light?
- **TBD-U6:** Sound effects at all?
- **TBD-U7:** Internationalization of the UI (PT-BR / EN), linked to TBD-X2 and TBD-X4.
- **TBD-U8:** Card artwork. See TBD-X3. Options: none (styled frame), user-supplied, or external links.
