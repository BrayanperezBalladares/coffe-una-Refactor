# Design: Separate Product Catalog from Location Stock

## Technical Approach

Use an expand-and-contract model: `Producto` remains the catalog aggregate and retains `Stock` temporarily, while `ExistenciaProductoUbicacion` becomes authoritative. This slice creates only `BODEGA_CENTRAL`; every product read maps compatibility `stock` from that balance (missing means zero). Central writes update the balance and legacy column atomically. Existing routes remain compatible; new frontend stock writes use a dedicated endpoint.

```text
HTTP -> guards/DTO -> ProductosService -> transaction
                                      -> lock Producto + central balance
                                      -> validate -> update both -> commit
                                      -> CamelCaseInterceptor -> response
```

## Architecture Decisions

| Decision | Alternatives / tradeoff | Rationale |
|---|---|---|
| Dedicated `PUT /api/productos/:id/stock-central` with `{ stock }`; keep legacy `Stock` handling temporarily | Only extend generic `PUT` (ambiguous permissions); immediately break legacy writes | Gives new clients one stock-only contract while preserving migration compatibility. |
| Application transaction plus PostgreSQL `pessimistic_write` locks | Optimistic retries; database trigger | Fits current TypeORM service pattern and makes authorization and errors explicit. |
| Versioned TypeORM migration and isolated PostgreSQL tests | `synchronize`; shared Supabase | Production has `synchronize: false`; repeatable tests must not mutate team data. |
| Field-category guard requiring every applicable permission | Current `PermisosGuard` OR semantics; service-only checks | Mixed legacy updates must fail before any mutation and cannot inherit stock rights for catalog fields. |

## Persistence and Contracts

`UbicacionInventario` maps `ubicaciones_inventario`: `Id bigint` PK, `Codigo varchar(50)` unique/non-empty, `Nombre varchar(120)`, `Activo boolean default true`. `BODEGA_CENTRAL` is seeded active and cannot be renamed, deactivated, or deleted by ordinary operations.

`ExistenciaProductoUbicacion` maps `existencias_producto_ubicacion`: `Id bigint` PK, `IdProducto bigint` FK `productos(Id)` RESTRICT, `IdUbicacion bigint` FK RESTRICT, `Cantidad int`; constraints are unique `(IdProducto, IdUbicacion)` and `Cantidad BETWEEN 0 AND 2147483647`; index `(IdUbicacion, IdProducto)` supports central joins.

`UpdateCentralStockDto.Stock` uses `@IsDefined`, `@IsInt`, `@Min(0)`, and `@Max(2147483647)`. The public body is camelCase `{ "stock": 12 }`; the existing `PascalBodyInterceptor` also supplies `Stock`, so legacy PascalCase remains accepted. The global `CamelCaseInterceptor` proves responses are recursively emitted as camelCase. New response: `{ productId, locationCode: "BODEGA_CENTRAL", stock }`.

Legacy `POST /productos`, `PUT /productos/:id`, `POST /productos/ajustar-stock`, and product response shapes remain. Their `Stock/stock` always means central stock. A catalog-only create MAY omit stock and initializes both central balance and the legacy mirror to zero; a legacy create that supplies stock requires stock permission in addition to create permission. Invalid/overflow/fractional quantities return 400; missing product returns 404; insufficient stock or detected drift returns 409; permission failures return 403.

`ProductoCamposGuard` normalizes body keys case-insensitively and requires: `crear_productos` for creation, `actualizar_stock_productos` for stock, `actualizar_productos` for catalog fields, and `inactivar_productos` for disabling. Mixed payloads require all relevant permissions. Existing maximum-three-featured and disabled-product rules remain; featuring additionally requires central stock greater than zero.

## Transaction Boundary

Central set/adjust and checkout decrement use one `QueryRunner` transaction. Aggregate duplicate checkout items, order product IDs deterministically, then lock each `Producto` and central balance `FOR UPDATE`. Validate all rows before writes; update `Cantidad`, mirror `Producto.Stock`, and clear `EsDestacado` when quantity reaches zero. Any failure rolls back the whole request. A missing balance reads as zero; a stock write establishes it while the product row is locked.

## File Changes

| Action | Files |
|---|---|
| Create | `src/entities/ubicacion-inventario.entity.ts`, `src/entities/existencia-producto-ubicacion.entity.ts`, `src/dto/update-central-stock.dto.ts`, `src/guards/producto-campos.guard.ts`, `src/services/inventory-reconciliation.service.ts`, `src/database/data-source.ts`, `src/database/migrations/202608230001-SeparateProductStockByLocation.ts`, focused `*.spec.ts`, `test/support/postgres-test-data-source.ts` |
| Modify | `src/entities/index.ts`, `src/modules/productos.module.ts`, `src/controllers/productos.controller.ts`, `src/services/productos.service.ts`, `src/common/permisos.ts`, `package.json` |
| Delete | None |

## Migration / Rollout

Migration creates tables/constraints, inserts `BODEGA_CENTRAL` with conflict-safe SQL, and inserts only missing central balances from `productos.Stock`; reruns never add quantities. A reconciliation query reports missing or unequal pairs without repair. Deploy migration before application, then monitor drift. `down` refuses if any product is missing/mismatched or any non-central balance exists; otherwise it drops expanded tables and the previous application can continue from legacy stock.

## Testing Strategy

Unit tests cover validation, field authorization, featured rules, and mapping. Integration tests run migrations and concurrent transactions against a dedicated PostgreSQL URL/schema that explicitly rejects Supabase hosts. Contract tests boot Nest with that database and assert casing, legacy compatibility, statuses, atomic rollback, and central-only availability. No shared Supabase data is used.

## Threat Matrix

N/A — this change does not alter routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundaries.

## Open Questions

None.
