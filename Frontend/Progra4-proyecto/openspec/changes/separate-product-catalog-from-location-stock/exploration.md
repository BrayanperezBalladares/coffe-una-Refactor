## Exploration: Separate Product Catalog from Location Stock

### Current State

The administrative product inventory is implemented as a single 799-line page at `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx`. It currently owns data loading, permissions, filtering, desktop and mobile rendering, modal composition, form state, validation, catalog mutations, deletion, enable/disable behavior, featured-product behavior, and a single global `stock` field.

Catalog and inventory concerns are coupled in several places:

- `stock` is edited in the product create/edit form and sent with the catalog payload.
- Product availability and featured-product eligibility depend directly on the global `stock` value.
- Desktop and mobile views duplicate product, stock, status, featured, and action rendering.
- Loading, error, empty-data, and no-filter-results states are embedded in the same page component.

The frontend service uses lower camel-case fields (`nombre`, `stock`, `esDestacado`), while the current NestJS controller declares PascalCase request properties (`Nombre`, `Stock`, `EsDestacado`) and the TypeORM entity is returned with PascalCase properties. The frontend normalizer only handles selected aliases and does not establish a complete bidirectional DTO boundary. This is a contract risk that must be resolved before location stock is integrated.

The backend currently exposes a global product stock model and no verified location-stock endpoint. Therefore, the frontend cannot truthfully implement stock per location until a backend contract is approved. Transfers, sales, and production assets are explicitly outside this change.

The generated inventory design system is useful for density, responsive behavior, visible focus, semantic statuses, and table guidance. Its Fira typography, green primary CTA, animated card elevation, and dashboard landing-page recommendations conflict with the project's neutral black/gray/white direction and existing administrative conventions, so those recommendations should not replace the established visual language.

### Affected Areas

- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` — currently combines catalog, stock, orchestration, form, and responsive presentation responsibilities.
- `proyecto-Cafe-UNA/src/services/productosService.js` — owns product normalization, caching, mutations, and the current global stock adjustment API.
- `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` — derives featured and availability rules from global stock and will require an explicit aggregate-stock rule.
- `proyecto-Cafe-UNA/src/lib/formLimits.js` — product validation currently assumes the existing combined form contract.
- `proyecto-Cafe-UNA/src/Components/Admin/ui/AdminModal.jsx` — existing accessible modal primitive should remain the dialog foundation.
- `proyecto-Cafe-UNA/src/Components/Admin/ui/AdminListaToolbar.jsx` — existing search and empty-filter conventions should be reused rather than replaced.
- `proyecto-Cafe-UNA/src/hooks/useAdminListaFiltros.js` — current client-side filtering can remain for the bounded catalog list, subject to later pagination needs.
- `proyecto-Cafe-UNA/src/router.jsx` — route impact should be avoided in the first slice unless a dedicated stock route is approved.
- `proyecto-Cafe-UNA/design-system/cafe-una-inventory/MASTER.md` — advisory density, accessibility, spacing, and semantic-state guidance.
- `proyecto-Cafe-UNA/design-system/cafe-una-inventory/pages/inventory.md` — advisory inventory-page guidance; neutral project conventions take precedence.
- Backend `src/controllers/productos.controller.ts` and `src/services/productos.service.ts` — external dependency because they currently accept PascalCase DTOs and persist one global `Stock` value.

### Approaches

1. **Big-bang inventory rewrite** — replace the page, service contract, stock model, and visual structure in one frontend change.
   - Pros: Reaches the target UI quickly in a single branch.
   - Cons: Mixes behavioral refactoring with contract changes, exceeds a healthy review budget, is difficult to roll back, and cannot be validated independently from backend work.
   - Effort: High

2. **Contract-first incremental separation** — characterize current behavior, extract bounded catalog components without behavior changes, then integrate an approved location-stock DTO and UI as a separate work unit.
   - Pros: Preserves current behavior, creates reviewable PRs, exposes API mismatches early, supports focused tests, and keeps catalog editing independent from stock operations.
   - Cons: Requires coordination with the backend and at least two implementation PRs after the SDD artifacts are approved.
   - Effort: Medium

3. **Frontend-first stock shell with temporary mock data** — build the location-stock panel before the backend contract exists.
   - Pros: Enables early visual review and usability feedback.
   - Cons: Encourages contract drift, creates throwaway adapters, and can make incomplete inventory data look authoritative.
   - Effort: Medium

### Recommendation

Use **contract-first incremental separation**. The first implementation must be behavior-preserving and must not add transfers, sales, assets, or speculative APIs.

Recommended component boundaries:

- `AdminProductsPage` — permissions, query state, dialog state, and mutation orchestration only.
- `ProductCatalogHeader` — title, featured count, and the single primary create action.
- `ProductCatalogToolbar` — existing search/filter composition.
- `ProductCatalogTable` — semantic desktop table and row composition.
- `ProductCatalogCards` — mobile presentation using the same view model and actions.
- `ProductFormDialog` / `ProductForm` — catalog fields only: name, description, image, price, weight/presentation, state, and featured status.
- `ProductActions` and `ProductStatusBadge` — shared action and status semantics across table and mobile layouts.
- `LocationStockPanel` — added only after the backend contract exists; reads stock by location and never edits catalog data.
- `useProductCatalog` and a future `useLocationStock` — separate remote-state lifecycles so a stock failure does not erase a successfully loaded catalog.

The catalog DTO boundary should normalize API data once in the service layer. Components should consume one camelCase frontend model and never handle PascalCase aliases. The backend and frontend must agree whether responses become camelCase or whether the frontend adapter temporarily maps the complete PascalCase contract. Silent mixed casing is not acceptable.

Featured-product eligibility must no longer depend on an editable catalog `stock` field. The proposal/specification phase must decide whether eligibility uses aggregate stock across active sales locations, central-warehouse stock, or another explicit business rule.

Accessibility and state requirements for the proposal:

- Keep visible labels, keyboard-operable actions, visible focus rings, and a minimum 44px interactive target where practical.
- Give table headers `scope="col"`, provide an accessible table name/caption, and preserve meaningful button text or `aria-label` values.
- Announce form and request failures with `role="alert"` or an appropriate live region; focus the first invalid field after submission.
- Preserve dialog focus trapping, Escape dismissal, focus return, and an unsaved-change warning if the form becomes dismissible with edits.
- Provide distinct states for initial loading, catalog load failure with retry, no products with a permitted create action, no search results with clear-filters action, stock loading, stock failure, and no stock rows.
- Do not block an available catalog behind a failed location-stock request.
- Preserve the neutral black/gray/white hierarchy; reserve green, amber, and red for semantic status and feedback rather than primary navigation or CTAs.
- Reuse Lucide icons and established modal/list primitives; do not introduce a second component language.

Testing and review boundaries:

1. **PR 0 — SDD artifacts only:** exploration, proposal, specs, design, and tasks after approval; no product code.
2. **PR 1 — Frontend test foundation and characterization:** add Vitest, React Testing Library, and user-event; characterize catalog loading, error, empty, filtering, permissions, and form validation. Keep the runner setup separate if the authored diff approaches 400 lines.
3. **PR 2 — Behavior-preserving decomposition:** extract the page components and hooks while retaining the current global-stock behavior and API contract. Tests stay with the extracted behavior.
4. **Backend PR — Location-stock contract and persistence:** reviewed independently in the backend repository, including migrations and DTO casing. This is a dependency, not part of the frontend PR.
5. **PR 3 — Catalog/stock UI separation:** remove stock from catalog editing, add the location-stock read experience, and update featured eligibility only after the backend contract is merged or available in a stable integration environment.

Each implementation branch should start from the latest approved target branch, use one repository only, and map to one reviewable work unit. The current broad `feature/inventory` branch should not accumulate frontend and backend implementation together. If a PR is forecast above 400 authored changed lines, use chained PRs with each child targeting the immediately previous branch.

### Risks

- The backend has no verified per-location stock contract, so frontend implementation can become speculative.
- Mixed camelCase/PascalCase request and response fields can silently drop or misread product values.
- Featured-product rules currently depend on global stock and need a Product Owner decision for distributed stock.
- Refactoring the 799-line page without characterization tests can introduce permission, filtering, modal, or responsive regressions.
- The frontend has no test runner, type checker, or CI workflow; the build passes, but the existing lint baseline already fails with 20 errors and 7 warnings.
- Product deletion remains visible in the current page even though the stated product direction favors inactivation; deletion policy should be resolved in the specification rather than changed incidentally.
- Introducing the generated design system literally would conflict with established neutral visual conventions and increase inconsistency.

### Ready for Proposal

**Yes**, with three explicit decisions required in the proposal/specification stage: the canonical camelCase API contract, the business rule for featured products under distributed stock, and the exact location-stock read model supplied by the backend. No implementation should begin until those decisions and the first PR boundary are approved.
