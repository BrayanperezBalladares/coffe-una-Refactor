# Tasks: Separate Product Catalog from Location Stock

Repository: `C:\CAFE-UNA\Frontend\Progra4-proyecto`; tracker branch: `feature/inventory`; Feature Branch Chain approved.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1,200–1,700 authored lines |
| Suggested split | F01 → F02 → F03 → F04 → F05 |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Approved: **Feature Branch Chain**; each child targets its immediate predecessor and aims for ≤400 authored changed lines.

## Suggested Work Units

| Unit / branch / exact base | Goal and evidence | Rollback / commit |
|---|---|---|
| F01 `feature/inventory-f01-test-foundation`; base `feature/inventory` | Vitest/RTL plus characterization. Test: `npm --prefix proyecto-Cafe-UNA run test -- InventarioProducto.characterization`. Runtime: `npm --prefix proyecto-Cafe-UNA run dev -- --host 127.0.0.1`; verify current catalog/filter/form/permissions. | Revert test config/files only. `test(inventory): characterize product catalog` |
| F02 `feature/inventory-f02-catalog-views`; base `feature/inventory-f01-test-foundation` | Extract desktop/mobile catalog views without behavior changes. Test: same characterization command. Runtime: verify 375/1024px browsing and filtering. | Revert view components and page composition. `refactor(inventory): extract catalog views` |
| F03 `feature/inventory-f03-catalog-form`; base `feature/inventory-f02-catalog-views` | Extract catalog drawer/actions and remove destructive delete UI. Test: `npm --prefix proyecto-Cafe-UNA run test -- ProductCatalogFormDrawer ProductActions`. Runtime: create/edit keyboard flow at 375/1440px. | Revert form/action components and page wiring. `refactor(inventory): separate catalog form actions` |
| F04 `feature/inventory-f04-product-contract`; base `feature/inventory-f03-catalog-form` | Add canonical adapter and independent catalog/stock hooks. Test: `npm --prefix proyecto-Cafe-UNA run test -- productosService useProductCatalog useCentralStock`. Runtime: simulate stock failure while catalog remains usable. | Revert adapter/hooks; retain extracted UI. `feat(inventory): normalize product stock contract` |
| F05 `feature/inventory-f05-central-stock-ui`; base `feature/inventory-f04-product-contract` | Integrate central-stock editor and eligibility; backend deployed first. Test: `npm --prefix proyecto-Cafe-UNA run test -- CentralStockEditor productoDisponibilidad`. Runtime: update central stock, verify refresh, permissions, 375/768/1024/1440px, keyboard and reduced motion. | Revert stock UI/integration only. `feat(inventory): manage central warehouse stock` |

## F01 — Test Foundation

- [x] 1.1 Add Vitest, RTL, jsdom, `src/test/setup.js`, scripts, and Vite test configuration; run build and record existing lint baseline.
- [x] 1.2 Characterize loading, filtering, permissions, validation, request states, and desktop/mobile rendering before refactoring.

## F02 — Catalog Views

- [x] 2.1 Extract `ProductCatalogTable.jsx` and `ProductCatalogMobileList.jsx` with shared formatters/actions and no contract changes.
- [x] 2.2 Reduce `InventarioProducto.jsx` to orchestration while keeping characterization tests green.

## F03 — Catalog Form

- [x] 3.1 Test validation focus, announcements, duplicate-submit prevention, and permission rejection before extraction.
- [x] 3.2 Build `ProductCatalogFormDrawer.jsx` and `ProductActions.jsx`; exclude stock fields and deletion, preserve archive/deactivate.

## F04 — Contract and State

- [x] 4.1 Test alias precedence, malformed/unknown stock, catalog payload exclusion, endpoint/range validation, and independent retries.
- [x] 4.2 Implement canonical mapping in `productosService.js` plus `useProductCatalog.js` and `useCentralStock.js` state machines.

## F05 — Central Stock Integration

- [x] 5.1 Test central-only eligibility, authorization, accessible errors, and catalog refresh when stock reaches zero.
- [x] 5.2 Implement `CentralStockEditor.jsx`, update `productoDisponibilidad.js`, wire independent states, and complete responsive/accessibility/build verification.

Out of scope: assets, transfers, sales, history, other POS screens, and broad redesign.
