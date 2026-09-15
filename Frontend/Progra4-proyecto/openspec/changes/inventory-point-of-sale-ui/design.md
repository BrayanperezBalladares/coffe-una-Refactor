# Design: Administrative Point-of-Sale Inventory UI

## Technical Approach

Create a focused POS page that composes the existing location directory and scoped-stock hooks. Keep the catalog page as the source of product metadata, but keep POS operations in dedicated components. The mutation is added to the existing service boundary and invalidates only location-stock caches after success.

## Architecture Decisions

### Decision: Dedicated route, shared admin shell

**Choice**: Add `/admin/puntos-venta` with `AdminLayout` and lazy loading.
**Alternatives considered**: Expand `/admin/producto` or add a second shell.
**Rationale**: POS operations are a separate workflow and must not turn the product catalog into a mixed inventory screen.

### Decision: Reuse location contracts and hooks

**Choice**: Reuse `obtenerUbicaciones`, `obtenerStockPorUbicacion`, `useInventoryLocations`, and `useLocationStock`.
**Alternatives considered**: New POS-specific read endpoints or client-side aggregation of all locations.
**Rationale**: The existing contract already isolates `locationCode`; duplicating it would increase drift and cross-location risk.

### Decision: Defer sidebar wiring

**Choice**: Keep navigation wiring as a follow-up integration unit after the information-area work lands.
**Alternatives considered**: Modify `AppSidebar.jsx` now.
**Rationale**: Avoid a predictable merge conflict in a shared file while preserving the route and page implementation.

## Data Flow

```text
PuntosVenta
  ├─ useInventoryLocations() ─→ POS locations
  ├─ useLocationStock(code) ──→ selected POS balances
  └─ obtenerCatalogoProductos() → product metadata
             │
             └─ PointOfSaleStockTable → PointOfSaleStockEditor
                                      └─ PUT F08 adjustment endpoint
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/productosService.js` | Modify | Add `ajustarStockPorUbicacion` and invalidate scoped stock after success. |
| `src/Pages/Admin/PuntosVenta/PuntosVenta.jsx` | Create | Compose POS selection, catalog, stock, permissions, and refresh behavior. |
| `src/Pages/Admin/PuntosVenta/components/PointOfSaleCards.jsx` | Create | Render the three POS locations and selected state. |
| `src/Pages/Admin/PuntosVenta/components/PointOfSaleStockTable.jsx` | Create | Render selected-location products and operational states. |
| `src/Pages/Admin/PuntosVenta/components/PointOfSaleStockEditor.jsx` | Create | Accessible quantity/reason form with validation and pending state. |
| `src/router.jsx` | Modify | Add lazy route registration. |
| `src/Components/Admin/AppSidebar.jsx` | Deferred | Add link only in a later integration unit. |

## Interfaces / Contracts

```js
ajustarStockPorUbicacion(locationCode, productId, stock, reason)
// PUT /api/inventario/ubicaciones/{locationCode}/productos/{productId}/stock
// body: { stock: number, reason: string }
// response: { productId, locationCode, previousStock, stock, reason }
```

The service must reject invalid canonical codes, stock values, or reasons before making a request.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Payload, validation, cache invalidation | Service tests with mocked `apiRequest`. |
| Component | POS selection, isolated rows, editor states, permissions | React Testing Library tests for page/components. |
| Regression | Central stock/ecommerce unchanged | Extend location/catalog characterization tests. |
| Build | Route and production bundle | `npm --prefix proyecto-Cafe-UNA run build`. |

## Threat Matrix

N/A — no shell, subprocess, VCS automation, or executable classification boundary is introduced.

## Migration / Rollout

No frontend data migration. Start implementation only after backend PR #31 and the teammate's information-area work are integrated into `development`.

## Open Questions

- [ ] Should the sidebar link be included in the teammate's PR or a separate navigation PR?
- [ ] Should the POS detail later show a responsible person or POS metadata? Deferred until a backend contract exists.
