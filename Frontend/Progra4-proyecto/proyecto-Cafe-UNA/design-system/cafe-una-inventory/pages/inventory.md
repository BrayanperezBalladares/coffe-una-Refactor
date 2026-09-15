# Inventory Operations — Page Overrides

> **Project:** Cafe UNA Inventory  
> **Surface:** Administrative operations dashboard  
> **Status:** Human-reviewed override of the generated UI/UX Pro Max baseline

These rules override `../MASTER.md` whenever the inventory area is designed or implemented.

## Product Direction

- This is an operational application, not a marketing page: do not add a hero, conversion CTA, promotional copy, or decorative charts.
- Product catalog, stock by location, transfers, sales, and production assets MUST remain distinct workflows.
- Each screen MUST expose one primary task and preserve context through breadcrumbs, page titles, and scoped filters.
- Use progressive disclosure: show the common fields first and reveal advanced settings only when requested.

## Visual System

- **Typography:** Inter or the existing project sans-serif stack. Do not use Fira Code for headings.
- **Palette:** neutral black, white, and gray for surfaces and actions.
- **Semantic colors:** green, amber, red, and blue MAY be used only for status, feedback, and validation—not branding or primary actions.
- **Radius:** use one consistent control radius and one consistent container radius from shared tokens.
- **Elevation:** prefer borders and subtle shadows; avoid floating nested cards.
- **Icons:** use the existing Lucide family with consistent stroke weight and optical size.

## Layout and Density

- Use a stable administrative shell with a maximum readable content width of 1440px.
- Prefer tables for desktop operational data and purpose-built list rows for mobile; do not convert dense data into decorative card grids.
- Keep filters in a single scoped toolbar with search first, then the most-used filters, then secondary filters.
- Separate summary metrics by domain. Product stock metrics MUST NOT include production assets.
- Keep row actions in a compact menu when more than two actions exist.

## Forms

- Use a side drawer on desktop and a full-screen dialog on small screens for create/edit workflows.
- Keep the footer actions visible while the form scrolls.
- Order actions left-to-right by consequence: secondary action first, primary action last.
- Use explicit labels, examples, character counters where limits exist, and validation on blur.
- Announce submit errors with `role="alert"` or `aria-live` and focus the first invalid field.
- Replace image URL entry with file upload, preview, replace, and remove controls.
- Catalog fields and stock-per-location fields MUST be separate sections and separate save operations when practical.

## Interaction and Accessibility

- Interactive targets MUST be at least 44×44 CSS pixels.
- Keyboard focus MUST be visible and follow visual order.
- Loading, empty, error, permission-denied, and success states MUST be designed explicitly.
- Motion MUST be subtle (150–250ms) and respect `prefers-reduced-motion`.
- Color MUST NOT be the only status indicator; pair color with text or an icon.
- Destructive deletion is prohibited for products, locations, and assets; use deactivate/archive flows with confirmation and audit context.

## Responsive Verification

- Verify at 375px, 768px, 1024px, and 1440px.
- Prevent horizontal page overflow; tables MAY scroll only inside their own container.
- On mobile, filters collapse into an accessible sheet and row actions remain reachable without hover.
