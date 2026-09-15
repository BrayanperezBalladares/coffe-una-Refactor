# Proposal: Administrative Point-of-Sale Inventory UI

## Intent

Provide a dedicated administrative surface for inspecting and adjusting product stock at each point of sale without mixing POS quantities with the catalog or Bodega Central.

## Scope

### In Scope
- Add a `/admin/puntos-venta` route using the existing admin layout and permission boundary.
- Show the three POS locations and a selected-location product stock table.
- Allow authorized users to adjust POS stock with an explicit integer quantity and reason.
- Provide loading, empty, error, unauthorized, validation, success, and responsive states.

### Out of Scope
- Sales registration, transfers, movement history, production assets, POS metadata CRUD, and ecommerce availability changes.
- Sidebar redesign or navigation ownership while the information-area work is still in progress.

## Capabilities

### New Capabilities
- `point-of-sale-inventory-ui`: Dedicated POS inventory view and authorized stock adjustment flow.

### Modified Capabilities
- None. The existing catalog/location-stock foundation remains the source for read DTOs.

## Approach

Reuse `useInventoryLocations`, `useLocationStock`, `productosService.js`, `AdminLayout`, and existing accessible UI primitives. Add a POS-specific page and components; send adjustments to the F08 backend endpoint only after PR #31 is integrated into `development`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/productosService.js` | Modified | Add the POS adjustment command and cache refresh. |
| `src/Pages/Admin/PuntosVenta/` | New | POS list, detail, stock table, and editor. |
| `src/router.jsx` | Modified | Register the lazy admin route. |
| `src/Components/Admin/AppSidebar.jsx` | Deferred | Navigation integration follows the teammate's sidebar/information work. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend/backend contract drift | Med | Gate implementation on PR #31 and test the real endpoint. |
| POS stock leaks into ecommerce | High | Keep location DTOs separate; never write `product.stock`. |
| Navigation merge conflict | Med | Defer sidebar wiring to a separate integration unit. |

## Rollback Plan

Revert the POS route, page/components, service command, and related tests. No data rollback is required because the page only consumes the existing backend contract.

## Dependencies

- Backend PR #31 merged into `development`.
- Teammate's information-area changes integrated before touching shared navigation files.

## Success Criteria

- [ ] An authorized administrator can inspect each POS independently.
- [ ] An authorized adjustment updates only the selected POS and shows the saved result.
- [ ] Central stock and ecommerce availability remain unchanged.
- [ ] All specified UI states are accessible and the production build passes.
