# Tasks: Administrative Point-of-Sale Inventory UI

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 350–500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Contract → POS screen → verification/navigation |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | POS adjustment service contract | PR 1 | `npm test -- --run src/services/productosService.test.js` | Thunder Client PUT against local backend F08 | Revert service command/tests |
| 2 | POS page, cards, table, editor, route | PR 2 | `npm test -- --run src/Pages/Admin/PuntosVenta` | `npm run dev`; inspect `/admin/puntos-venta` | Revert page/components/route |
| 3 | States, regression, and navigation integration | PR 3 | `npm test` and `npm run build` | Desktop/mobile manual flow with authorized and unauthorized sessions | Revert verification and sidebar link only |

PR tracker branch: `feature/inventory-f09-pos-ui`, created from updated `development` after PR #31 and the teammate's PR merge.
PR 1: `feature/inventory-f09-pos-contract` → tracker branch.
PR 2: `feature/inventory-f09-pos-screen` → PR 1 branch.
PR 3: `feature/inventory-f09-pos-verification` → PR 2 branch.

## Phase 0: Dependency Gate

- [ ] 0.1 Verify PR #31 and the information-area PR are merged into `development`.
- [ ] 0.2 Confirm the F08 request/response and permission behavior with Thunder Client.
- [ ] 0.3 Create the tracker branch from the updated `development`; do not implement before this gate.

## Phase 1: Service Contract

- [ ] 1.1 Add `ajustarStockPorUbicacion` to `src/services/productosService.js` with strict client validation.
- [ ] 1.2 Add service tests for payload casing, invalid values, HTTP errors, and scoped cache invalidation.

## Phase 2: POS Screen

- [ ] 2.1 Create `PuntosVenta.jsx` using `AdminLayout`, catalog data, and existing location hooks.
- [ ] 2.2 Create cards/table/editor components with selected-location context and responsive states.
- [ ] 2.3 Register the lazy `/admin/puntos-venta` route without changing shared sidebar code.

## Phase 3: Verification and Integration

- [x] 3.1 Test permissions, loading, empty, error/retry, absent-versus-zero, and no cross-location leakage.
- [x] 3.2 Test that POS updates do not change central stock or ecommerce availability.
- [ ] 3.3 Run tests, build, focused lint, diff-check, and manual desktop/mobile checks.
- [ ] 3.4 Add the sidebar link only after the information-area branch is integrated and conflict-checked.
