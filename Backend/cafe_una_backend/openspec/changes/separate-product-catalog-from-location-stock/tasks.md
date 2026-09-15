# Tasks: Separate Product Catalog from Location Stock

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1,350–1,750; target 250–400 per PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain; approved by user |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Branch / exact base | Goal; conventional commit | Focused test | Runtime harness | Rollback |
|---|---|---|---|---|---|
| B01 | `feature/inventory-b01-pg-test-foundation` / `feature/inventory` | Isolated PostgreSQL harness; `test(inventory): add isolated postgres harness` | `npm run test:integration -- --runInBand test/support/postgres-test-data-source.spec.ts` | Local `TEST_DATABASE_URL`: `npm run migration:show:test` | Test support, data source, scripts. |
| B02 | `feature/inventory-b02-location-schema` / `feature/inventory-b01-pg-test-foundation` | Schema/backfill; `feat(inventory): add location stock schema` | `npm run test:integration -- --runInBand test/database/separate-product-stock.migration-spec.ts` | `npm run migration:run:test; npm run migration:revert:test` | Entities/registration/migration, while reconciled. |
| B03 | `feature/inventory-b03-atomic-central-stock` / `feature/inventory-b02-location-schema` | Locked writes; `feat(inventory): make central stock atomic` | `npm run test:integration -- --runInBand test/inventory/central-stock.integration-spec.ts` | `npm run test:e2e -- --runInBand test/central-stock-concurrency.e2e-spec.ts` | Transaction service; schema remains. |
| B04 | `feature/inventory-b04-stock-contract` / `feature/inventory-b03-atomic-central-stock` | API/permissions; `feat(products): enforce stock field permissions` | `npm test -- --runInBand src/guards/producto-campos.guard.spec.ts src/controllers/productos.controller.spec.ts` | `npm run test:e2e -- --runInBand test/productos-stock-contract.e2e-spec.ts` | DTO, guard, permissions, route. |
| B05 | `feature/inventory-b05-central-availability` / `feature/inventory-b04-stock-contract` | Availability/reconciliation; `feat(products): derive availability from central stock` | `npm test -- --runInBand src/services/inventory-reconciliation.service.spec.ts src/services/productos.service.spec.ts` | `npm run test:e2e -- --runInBand test/productos-availability.e2e-spec.ts` | Read mapping, featured rules, reconciliation. |

## Phase 1: B01 — Isolated Test Foundation

- [x] 1.1 RED: prove the harness rejects Supabase hosts and missing URLs.
- [x] 1.2 GREEN: add PostgreSQL test support, migration data source, Jest config, and scripts.
- [x] 1.3 REFACTOR: centralize test connection validation; run focused test, typecheck, and build.

## Phase 2: B02 — Persistence Expansion

- [ ] 2.1 RED: test constraints, seed, idempotent backfill/resume, reconciliation, and guarded rollback.
- [ ] 2.2 GREEN: add location/balance entities, exports, module registration, and versioned migration.
- [ ] 2.3 REFACTOR: name constraints/indexes consistently and verify migrate/revert on isolated PostgreSQL.

## Phase 3: B03 — Atomic Central Stock

- [ ] 3.1 RED: test missing balance, duplicate aggregation, ordered locks, oversell, rollback, and drift.
- [ ] 3.2 GREEN: implement locked set/decrement/create-zero transactions and atomic legacy mirroring.
- [ ] 3.3 REFACTOR: share transaction helpers without exposing arbitrary-location writes.

## Phase 4: B04 — Contract and Authorization

- [ ] 4.1 RED: test bounds/casing, mixed-field 403, stock-only rights, 404, 409, and atomic denial.
- [ ] 4.2 GREEN: add DTO, field classifier guard, permissions, dedicated endpoint, and legacy compatibility.
- [ ] 4.3 REFACTOR: centralize error/status mapping and run contract harness.

## Phase 5: B05 — Availability and Reconciliation

- [ ] 5.1 RED: test zero/missing central stock, non-central exclusion, featured clearing, limits, and drift reporting.
- [ ] 5.2 GREEN: map reads from central stock and add read-only reconciliation service.
- [ ] 5.3 REFACTOR: run focused, E2E, build, and typecheck; confirm no Supabase access.

Excluded: assets, transfers, sales, history, POS balance APIs, and legacy `Stock` removal.
