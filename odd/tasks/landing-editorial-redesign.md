# Landing editorial redesign

## Objective
Adapt the approved light editorial coffee landing structure and hierarchy to Café UNA while preserving the existing CMS-driven, bilingual, accessible behavior.

## Problem
The current landing uses a visually heavy full-bleed hero and inconsistent section treatments. Product, institutional, community, location, and FAQ content all exist, but the page does not yet express one coherent editorial hierarchy.

## Why
The redesign should make Café UNA feel warm, premium, and credible while balancing commerce with its university and community mission.

## Authorized scope
- Redesign the public landing page and its existing home-specific visual components.
- Reorder existing home sections to: hero → featured coffees → story → initiatives → location → FAQ.
- Preserve CMS data contracts, bilingual content, routes, cart/auth behavior, map embed, product links, and existing interactions.
- Align the existing navbar and footer visually only where necessary; do not restructure their behavior.

## Constraints
- Keep the existing React/Vite architecture and CMS-backed content.
- Use warm cream, espresso, and restrained UNA red; do not copy Pinterest literally.
- Do not invent claims, metrics, products, navigation, or backend data.
- Dynamic images must tolerate varied aspect ratios and crops.
- Preserve accessibility, responsive behavior, and reduced-motion support.
- Existing unrelated untracked backend work must remain untouched.

## Design references
- `design/landing-editorial/hero-products.png`
- `design/landing-editorial/story-initiatives.png`
- `design/landing-editorial/location-faq.png`

## TDD and checks
- TDD mode: not explicitly configured; source: repository and prior ODD task inspection.
- Test runner: `npm test` (Vitest).
- Required checks: focused tests where applicable, `npm run lint`, `npm test`, `npm run build`, desktop/mobile browser QA, concept-to-render visual comparison.
- Receipt-driven development: disabled/unmanaged; do not enable automatically.

## Tasks
- [x] **LER-01 — Establish the editorial hierarchy and design tokens**
  - Reorder the existing home sections without changing their data contracts.
  - Add the cream/espresso/UNA-red token system and shared section rhythm.
  - Acceptance: page order is hero → products → story → initiatives → location → FAQ; all CMS content still renders.
  - Checks: focused component render test or existing tests; build.

- [x] **LER-02 — Implement the light split hero and aligned navigation treatment**
  - Convert the hero from a dark full-bleed overlay to an editorial copy/media composition.
  - Preserve both CTAs, CMS image loading, translation, and mobile navigation behavior.
  - Acceptance: first viewport matches the approved hero reference in hierarchy, palette, typography, and media treatment at desktop and mobile sizes.
  - Checks: hero behavior test; keyboard/focus inspection; browser screenshots.

- [x] **LER-03 — Restyle products, story, initiatives, location, FAQ, and footer transition**
  - Make featured coffees product-led and editorial.
  - Use varied open layouts for the institutional story and three initiatives.
  - Present location as a strong visit/map band and FAQ as a quiet editorial close.
  - Acceptance: every existing section remains functional and visually follows the approved references without repetitive generic cards.
  - Checks: carousel controls, links, map embed, accordion behavior, desktop/mobile screenshots.

- [x] **LER-04 — Verify responsiveness, accessibility, and fidelity**
  - Add or update focused tests for changed behavior.
  - Run lint, tests, build, and browser QA at desktop and mobile widths.
  - Compare the final screenshots to all three concept references with a fidelity ledger.
  - Acceptance: no clipped content, horizontal overflow, unreadable contrast, broken focus states, or material concept drift.
  - Checks: `npm run lint`; `npm test`; `npm run build`; browser interaction pass; `view_image` comparison.

## Progress
- Exploration complete: current contracts, components, risks, and checks identified.
- Three coordinated concept references generated from the accepted Pinterest direction.
- LER-01 complete: Home now follows hero → products → story → initiatives → location → FAQ, with shared cream/espresso/UNA-red tokens and section rhythm.
- LER-02 complete: Hero uses the CMS image and both existing actions in a responsive light split composition; the home navbar now uses its solid, dark-on-light treatment.
- LER-03 complete: Products, story, initiatives, location, and FAQ use distinct editorial layouts while retaining links, carousel controls, map embedding, and accordion behavior.

## Verification evidence
- `npm run build` — passed after LER-01 through LER-03; Vite reported only the existing large-chunk advisory.
- Focused Vitest run for Hero and FeaturedCafesCarousel — 2 files and 2 tests passed.
- Desktop and 390 px mobile browser QA completed with local CMS-shaped fixture responses; mobile measured `scrollWidth === clientWidth` (375 px), and carousel/FAQ interactions passed.
- Full `npm test` — 116 passed and 15 failed in unrelated existing suites (missing router wrappers/session mock export, missing ResizeObserver, and one timeout).
- Full `npm run lint` — remains blocked by 207 existing repository errors; changed Hero imports were cleaned, while Home/Navbar still surface their pre-existing `set-state-in-effect` findings.
- Parent verification reran the focused Hero/carousel tests (2/2 passed) and production build (passed with only the existing large-chunk advisory).
- Parent browser QA used the Browser integration first, then Playwright only to save full-page evidence for native `view_image` comparison. Desktop was checked at 1440×1000 and mobile at 390×844; both measured `scrollWidth === clientWidth`.
- Focused lint on changed JavaScript remains blocked only by the two pre-existing `react-hooks/set-state-in-effect` findings in `Home.jsx:100` and `Navbar.jsx:406`.

## Fidelity ledger
- **Hierarchy** — concept: hero → products → story → initiatives → location → FAQ; render: exact order observed; no fix required.
- **Typography** — concept: editorial serif display with restrained sans-serif UI; initial render used sans-serif headings; fixed with the shared Georgia/system-serif display stack and reverified.
- **Palette** — concept: warm cream, espresso, and UNA red; render matches across desktop and mobile; no material mismatch remains.
- **Media treatment** — concept: split hero and large editorial story media; render preserves those frames using dynamic CMS images; QA fixtures used placeholder imagery, so production content remains the only data-dependent visual variable.
- **Container rhythm** — concept: open product rail, asymmetric story, three-column initiatives, dark location band, quiet FAQ close; render matches without repetitive generic card stacks.
- **Responsive behavior** — concept: hierarchy must survive narrow screens; 390 px render stacks sections cleanly with no horizontal overflow or clipped primary actions.
- **Above-the-fold copy** — no new hero/nav claims were introduced; existing CMS hero title, subtitle, and both CTAs are preserved.

## Next step
Review with live production CMS imagery after deployment; no implementation task remains in this feature.
