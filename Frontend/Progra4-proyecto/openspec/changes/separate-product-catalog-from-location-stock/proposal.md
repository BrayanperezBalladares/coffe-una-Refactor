# Proposal: Separate Product Catalog from Bodega Central Stock

## Intent

Remove global-stock coupling from the admin product workflow. Catalog editing remains independent from location inventory. Ecommerce availability and featured eligibility use only available stock at **Bodega Central**; sales-point stock never enables either state.

## Scope

### In Scope
- Characterize catalog loading, permissions, filtering, validation, and request states before decomposition.
- Separate catalog fields from Bodega Central stock presentation/input in the admin inventory UI.
- Add a frontend DTO adapter for the backend compatibility contract and identify the ecommerce stock source accessibly.
- Preserve the reviewed accessible inventory model.

### Out of Scope
- Assets, transfers, sales, movement history, sales-point screens, and broad admin redesign.
- Removing backend compatibility fields or implementing inventory persistence.

## Capabilities

### New Capabilities
- `admin-product-catalog`: Catalog list, form, permissions, filters, and responsive states without editable global stock.
- `central-warehouse-stock`: Bodega Central stock presentation/input and its explicit relationship to ecommerce availability.
- `frontend-product-contract`: Canonical camelCase model mapped at the service boundary during transition.

### Modified Capabilities
- None; no main frontend specifications exist yet.

## Approach

Add Vitest and React Testing Library characterization coverage first. Then decompose the 799-line page into catalog orchestration, shared desktop/mobile views, form, actions, and independent stock state. Components consume one camelCase model; `productosService.js` owns temporary PascalCase compatibility. Stock failures do not block catalog content.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/` | Modified | Split catalog and stock. |
| `proyecto-Cafe-UNA/src/services/productosService.js` | Modified | Normalize the compatibility contract. |
| `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` | Modified | Use Bodega Central availability. |
| `proyecto-Cafe-UNA/src/Components/Admin/` | Modified | Reuse accessible primitives. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| camelCase/PascalCase data loss | High | Centralize and test bidirectional mapping. |
| Regression from coupled page | High | Characterize behavior before extraction. |
| Backend transition mismatch | Medium | Integrate only an approved compatibility DTO. |
| Missing test infrastructure | High | Deliver runner setup as the first reviewable slice. |

## Rollback Plan

Revert frontend slices independently to restore the combined page/service behavior. Retain backend compatibility fields until verification; this repository performs no data migration.

## Dependencies

- Approved backend Bodega Central stock DTO, authorization, and compatibility period.
- Confirmed Bodega Central-only ecommerce rule.

## Success Criteria

- [ ] Catalog forms cannot edit global or sales-point stock.
- [ ] Ecommerce availability and featured eligibility use only Bodega Central available stock.
- [ ] Catalog remains usable during stock loading and errors.
- [ ] Characterization tests cover critical states; build passes with no new lint regressions.
- [ ] UI passes reviewed accessibility and 375/768/1024/1440px checks.
