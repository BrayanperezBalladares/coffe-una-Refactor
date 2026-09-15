# Proposal: Separate Product Catalog from Location Stock

## Intent

Replace global product stock with authoritative per-location balances without breaking the current API. Ecommerce visibility and featured eligibility must use `BODEGA_CENTRAL` available stock exclusively; sales-point stock must never enable either behavior.

## Scope

### In Scope

- Add locations and product-location balances with non-negative and uniqueness constraints.
- Seed `BODEGA_CENTRAL`; idempotently backfill `Producto.Stock` into central balances.
- Preserve legacy `stock` through an atomic compatibility mirror.
- Lock stock writes and enforce field-aware catalog versus stock permissions.
- Preserve current response and request casing compatibility.

### Out of Scope

- Assets, transfers, sales, movement history, and additional sales-point balances.
- Removing `Producto.Stock`, changing casing interceptors, or exposing arbitrary location writes.

## Capabilities

### New Capabilities

- `inventory-locations`: Stable location identities and central ecommerce source.
- `location-product-balances`: Authoritative quantities, locking, constraints, and legacy synchronization.
- `product-catalog-availability`: Central-stock availability, featured eligibility, compatibility, and authorization.

### Modified Capabilities

None; no main OpenSpec capabilities currently exist.

## Approach

Use expand-and-contract. Versioned TypeORM migrations create, seed, and backfill balances while retaining `Producto.Stock`. Transactions treat the central balance as authoritative, lock before decrements, and mirror the legacy column. Removal waits for reconciliation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/entities/`, `src/modules/productos.module.ts` | New/Modified | Location and balance persistence |
| `src/services/productos.service.ts` | Modified | Central rules and atomic mirror |
| `src/controllers/productos.controller.ts` | Modified | Contract and field authorization |
| `src/database/` | New | Migration infrastructure and guards |
| `src/**/*.spec.ts` | New | Focused behavioral evidence |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unsafe backfill | Medium | Idempotency and reconciliation |
| Concurrent overselling | High | Row lock and transaction |
| Broad update permission | High | Field-aware authorization |
| Casing regression | Medium | Contract tests |
| Mirror drift | Medium | Single write service |

## Rollback Plan

Redeploy the previous backend while `Producto.Stock` remains. Down migration refuses destructive rollback when balances diverge or non-central data exists.

## Dependencies

- TypeORM migration infrastructure and isolated PostgreSQL tests.

## Success Criteria

- [ ] Backfill preserves every existing stock value.
- [ ] Legacy `stock` represents only `BODEGA_CENTRAL`.
- [ ] Concurrent decrements cannot oversell or go negative.
- [ ] Sales-point stock never enables ecommerce or featured products.
- [ ] Stock-only permissions cannot modify catalog fields.
- [ ] Migration, rollback, unit, and contract tests pass without Supabase.
