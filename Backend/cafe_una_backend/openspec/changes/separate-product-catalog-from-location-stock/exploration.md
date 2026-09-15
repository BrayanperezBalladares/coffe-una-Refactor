## Exploration: Separate Product Catalog from Location Stock

### Current State

`Producto` currently mixes catalog data and the mutable `Stock` balance in the `productos` table. `ProductosService` creates, validates, updates, and decrements that single balance; `POST /productos/ajustar-stock` wraps multiple decrements in one TypeORM transaction but does not lock rows, so concurrent requests can oversell. Featured-product validation is also coupled to this global stock value.

The external API is effectively camelCase even though controllers and entities use PascalCase: `PascalBodyInterceptor` enriches incoming camelCase payloads with PascalCase aliases, while `CamelCaseInterceptor` converts responses. Product controllers use inline types rather than validated DTO classes. `GET /productos` is public; create, update, stock adjustment, and delete operations use JWT and permission guards. The current `PUT /productos/:id` guard accepts any one of three permissions and then allows every field in the body, so a stock-only permission can currently reach catalog fields.

PostgreSQL runs with `synchronize: false`, but the repository has no versioned migration files, migration `DataSource`, or migration scripts. The only E2E test is an obsolete scaffold that requires the real Supabase-backed `AppModule`; there are no product unit or integration tests.

### Affected Areas

- `src/entities/producto.entity.ts` — currently owns the global `Stock` column that must become transitional rather than authoritative.
- `src/entities/index.ts` — must eventually register location and location-balance entities.
- `src/services/productos.service.ts` — contains catalog validation, stock mutation, featured-product rules, and the existing transaction boundary.
- `src/controllers/productos.controller.ts` — exposes the legacy stock contract and has field-level authorization ambiguity.
- `src/modules/productos.module.ts` — currently registers only the product repository.
- `src/common/pascal-body.interceptor.ts` — explains why both camelCase and PascalCase request keys work today.
- `src/common/camel-case.interceptor.ts` — defines the current camelCase response contract that must remain stable during rollout.
- `src/common/permisos.ts` and `src/guards/permisos.guard.ts` — define role permissions and OR-based route authorization.
- `src/config/postgres.config.ts` — disables synchronization and currently has no migration configuration.
- `package.json` — has TypeORM and `ts-node`, but no migration commands.
- `test/app.e2e-spec.ts` — cannot validate this slice reliably because it is stale and coupled to Supabase.
- Likely new paths: `src/entities/ubicacion.entity.ts`, `src/entities/existencia-producto.entity.ts`, `src/database/data-source.ts`, `src/database/migrations/*`, and focused product/inventory test files.

### Approaches

1. **Immediate hard cutover** — remove `productos.Stock`, require a location on every inventory operation, and change product responses immediately.
   - Pros: One source of truth from the first deployment; no transitional duplication.
   - Cons: Breaks the current frontend and any ecommerce callers; rollback is difficult; migration and application deployment must be perfectly synchronized.
   - Effort: High

2. **Expand-and-contract with an application-managed compatibility mirror** — add locations and per-location balances, backfill the current stock into an immutable default location code such as `BODEGA_CENTRAL`, make the balance row authoritative for application logic, and temporarily keep `productos.Stock` synchronized only for rollback and legacy compatibility.
   - Pros: Supports incremental deployment; preserves the current `stock` field and stock endpoints; enables safe code rollback; avoids database triggers and duplicated business logic outside NestJS.
   - Cons: Temporarily maintains two representations; every stock write must update both values in the same transaction; drift detection is required.
   - Effort: Medium

3. **Database-managed compatibility using triggers or a view** — move balances to location rows and make PostgreSQL maintain or expose the legacy stock value.
   - Pros: Centralizes compatibility for writers outside the backend; can enforce synchronization at database level.
   - Cons: Hides business behavior from TypeORM, duplicates application rules, complicates testing and rollback, and is unnecessary while this backend is the controlled writer.
   - Effort: High

### Recommendation

Use **Approach 2: expand-and-contract**, restricted to the default central location in this first slice. Do not expose transfers, point-of-sale balances, asset inventory, or arbitrary location writes yet.

The forward migration should:

1. Add a location catalog with an immutable unique code, status, and display name.
2. Add a product-location balance table with foreign keys, a unique `(product_id, location_id)` constraint, and a database check that quantity is non-negative.
3. Insert the `BODEGA_CENTRAL` location idempotently.
4. Backfill one central balance per existing product from `productos.Stock` idempotently.
5. Keep `productos.Stock` intact for the compatibility window.

For the transitional API, legacy `stock` must mean **the balance at `BODEGA_CENTRAL`**, not the sum of every location. That keeps reads and legacy mutations internally consistent and prevents point-of-sale stock from being accidentally advertised as central ecommerce availability. Existing camelCase responses and camelCase/PascalCase request tolerance should remain unchanged. New internal DTOs should use camelCase and map explicitly to the existing PascalCase persistence model; changing global casing interceptors is outside this slice.

Product creation with initial stock must create the catalog row and central balance in one transaction. Stock adjustments must lock the central balance row with a PostgreSQL/TypeORM pessimistic write lock, validate the entire request, and update the authoritative balance plus transitional `Producto.Stock` within the same transaction. A unique constraint prevents duplicate balance rows. Repeated product IDs in one request should be rejected or aggregated before locking; the proposal should choose one observable behavior.

Featured-product validation should temporarily use the central balance because that preserves current behavior. Decoupling merchandising from inventory availability belongs to a later change.

Authorization should be tightened incrementally. Catalog mutations require `crear_productos` or `actualizar_productos`; balance mutations require `actualizar_stock_productos` or the existing purchase permission where applicable. The legacy `PUT /productos/:id` may remain during rollout, but mixed bodies must not let a stock-only role modify catalog fields. A later contract change can remove stock from that endpoint after the frontend migrates.

Testing should follow strict TDD without depending on real Supabase:

- Unit tests for product creation, compatibility projection, negative/insufficient stock, featured validation, transaction commit/rollback, and authorization-sensitive field dispatch.
- A PostgreSQL integration harness for the forward migration, idempotent backfill, constraints, row locking, and rollback preconditions.
- Contract tests proving camelCase output and both accepted request casings during the compatibility window.
- The stale global E2E scaffold should not be treated as evidence for this slice; repairing the shared E2E foundation should be a separate work unit unless a minimal isolated inventory harness is added here.

Likely review boundaries, performed sequentially and merged before branching the next unit:

1. **SDD documentation PR** — exploration, proposal, specs, design, and tasks only.
2. **Migration foundation PR** — TypeORM migration runner/configuration, forward and guarded down migration, schema constraints, backfill, and migration integration tests.
3. **Compatibility cutover PR** — entities, transactional central-balance persistence, legacy response mapping, field-aware authorization, and focused unit/contract tests.
4. **Later contraction PR (outside this change)** — migrate all clients, stop dual writes, and remove `productos.Stock` only after telemetry/reconciliation confirms no drift.

Each implementation PR should target `main` only after its predecessor is approved and merged, rather than accumulating unrelated work on a long-lived shared branch. If `sdd-tasks` forecasts more than 400 authored changed lines for a boundary, it should split that boundary into a chained PR with an independently verifiable migration or behavior outcome.

Rollback should be code-first: redeploy the previous backend while `productos.Stock` still exists. The down migration must refuse to drop location data if any non-central balance or post-backfill divergence exists; otherwise rollback could destroy inventory information. During this first slice, no non-central write API should exist, which keeps rollback bounded. Before contraction, a reconciliation query must prove central balances and the compatibility column match.

### Risks

- Dual-write drift if any stock mutation bypasses the new transaction service.
- Overselling remains possible unless balance rows are locked during decrements.
- The current OR-based update permission can expose catalog fields to stock-only roles if not made field-aware.
- A destructive down migration could lose location inventory unless guarded by explicit preconditions.
- Featured-product behavior remains temporarily coupled to central stock.
- Migration testing requires an isolated PostgreSQL instance; the current Supabase-coupled E2E setup is not sufficient.
- Introducing point-of-sale or transfer writes before removing rollback dependence on `productos.Stock` would make the compatibility model ambiguous.

### Ready for Proposal

Yes. The proposal should lock the expand-and-contract strategy, `BODEGA_CENTRAL` as the default-location identity, central-balance semantics for legacy `stock`, field-aware authorization, pessimistic locking, guarded rollback, and the sequential PR boundaries above. No implementation should begin until those decisions are represented as observable requirements and approved.
