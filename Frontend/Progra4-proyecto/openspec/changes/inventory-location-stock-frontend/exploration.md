# Exploration: Frontend Stock by Location Integration (F07)

## Current State

The frontend repository is clean on `feature/inventory-f06-location-stock-foundation` at `cdab618`; its application code is currently based on `origin/development` (`a078e2d`), which contains the F05 central-stock integration. The only files in this new change are SDD artifacts; no production code was modified.

The current frontend model is intentionally central-only:

- `proyecto-Cafe-UNA/src/services/productosService.js` reads `/productos`, keeps catalog fields separate from stock, and hardcodes every normalized stock record to `BODEGA_CENTRAL`.
- `proyecto-Cafe-UNA/src/hooks/useCentralStock.js` loads one list of central-stock records and exposes retryable loading/error state.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` joins catalog products with central stock by product ID. `ProductCatalogTable.jsx`, `ProductCatalogMobileList.jsx`, and `CentralStockEditor.jsx` show or edit only Bodega Central.
- `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` uses central stock for ecommerce availability and featured-product eligibility. This invariant must not change when a POS is selected in the administrative UI.
- Existing tests cover catalog/central-stock normalization, independent loading, central stock updates, permissions, and characterization of the product page. There are no frontend location-directory, multi-location, or cross-location isolation tests.

The backend F06 contract is available in the local backend repository:

- `GET /api/inventario/ubicaciones` returns the authorized canonical locations: `BODEGA_CENTRAL`, `POS_FUNA_UNA`, `POS_EDITORIAL`, and `POS_STAND_FERIAS`, with public `code` and `name` fields.
- `GET /api/inventario/productos/:id/stock?locationCode=...` returns `{ productId, locationCode, stock, provisioned }`. An absent balance is returned as `stock: 0, provisioned: false`; a persisted zero is `stock: 0, provisioned: true`.
- Location reads require `ver_inventario`; invalid location codes return `400`; unsupported location CRUD is not exposed.
- There is no endpoint that returns all product balances for one location. Fetching the current catalog and then issuing one request per product would create an N+1 request pattern.
- The only stock mutation endpoint is the central-only `PUT /api/productos/:id/stock-central`; there is no POS stock write contract.

## Affected Areas

- `proyecto-Cafe-UNA/src/services/productosService.js` — add location DTO normalization and location-scoped read methods without allowing location data into catalog payloads or `product.stock`.
- `proyecto-Cafe-UNA/src/hooks/useCentralStock.js` — preserve as the ecommerce/central compatibility boundary; do not silently repurpose it for arbitrary locations.
- `proyecto-Cafe-UNA/src/hooks/useInventoryLocations.js` — new hook for the canonical location directory and its loading/error/403/retry states.
- `proyecto-Cafe-UNA/src/hooks/useLocationStock.js` — new selected-location state boundary, including cache/request identity by `locationCode` and explicit absent-versus-zero handling.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` — compose catalog, central eligibility state, location directory, and selected-location stock without mixing their records.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/InventoryLocationSelector.jsx` — new accessible selector that displays the server-provided location identity.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductCatalogTable.jsx` and `ProductCatalogMobileList.jsx` — render the selected location as an explicit scope; never combine central and POS quantities into one value.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductActions.jsx` — keep editing available only for the existing central-stock contract; POS locations are read-only until a backend write contract exists.
- `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` and its tests — prove that selecting a POS does not change ecommerce availability or featured eligibility.
- `proyecto-Cafe-UNA/src/services/productosService.test.js`, `useCentralStock.test.js`, and inventory characterization tests — extend coverage for canonical location identity, cache isolation, missing rows, persisted zero, loading, retry, and unauthorized states.

## Approaches

1. **Frontend read model over the current per-product endpoint** — add the location directory and issue one stock request per product when a location is selected.
   - Pros: Uses the backend contract that already exists; can produce a visible POS view without backend changes.
   - Cons: N+1 requests, slow first render for a catalog, partial failures are difficult to explain, and repeated requests defeat the existing independent-state design.
   - Effort: Medium initially, High operational risk

2. **Bulk location read contract followed by a scoped frontend view** — first expose a backend read endpoint that returns all balances for one `locationCode`; then add frontend location DTOs, location-scoped state, selector, and table/mobile rendering.
   - Pros: One request per selected location, explicit cache keys, predictable loading/error behavior, clean separation from catalog and ecommerce stock, and a reusable foundation for transfers and sales later.
   - Cons: Requires a small backend prerequisite before the frontend UI slice; the endpoint contract must define authorization and absent-row semantics.
   - Effort: Medium overall, Low operational risk

3. **Dedicated stock route** — leave `/admin/producto` catalog-only and build a new `/admin/inventario/stock` route.
   - Pros: Strongest visual separation and a natural future home for movements and transfers.
   - Cons: Adds routing, navigation, duplicated product presentation, and more permissions before the location read model is proven.
   - Effort: High

4. **Client-side replication or aggregation of central stock** — fabricate POS values from the current product response.
   - Pros: Very small initial implementation.
   - Cons: Produces false inventory data, violates location isolation, and would be unsafe for operational decisions.
   - Effort: Low initially, unacceptable rework risk

## Recommendation

Choose **Approach 2** and split F07 into reviewable slices. Do not build the frontend table on the current per-product endpoint; the N+1 behavior would be a design regression even if the first demo appears to work.

The smallest professional first frontend slice should be **F07A: location contract and scoped read-state foundation**, after the backend bulk-read contract is approved:

1. Normalize server-provided `Location` and `LocationStock` DTOs at the service boundary.
2. Add a location-directory hook and a selected-location stock hook with cache/request identity including `locationCode`.
3. Add service and hook tests for four canonical codes, cross-location isolation, absent versus persisted zero, invalid identity, `403`, retry, and stale-selection protection.
4. Keep the existing catalog and `useCentralStock` behavior unchanged; no POS quantity may populate `product.stock`.

The next slice, **F07B**, can add the selector and read-only scoped table/mobile presentation. A later slice can address location-aware mutations only after the backend defines authorization and a POS write endpoint. The current central editor remains unchanged and continues to call the central-only endpoint.

## Risks

- Implementing against the per-product read endpoint creates N+1 traffic and makes the inventory screen unreliable as the catalog grows.
- Reusing `product.stock` for a selected POS would change ecommerce availability and featured-product behavior incorrectly.
- Treating an absent balance as a confirmed zero would hide whether a POS has been provisioned.
- The backend currently authorizes location reads at the broad `ver_inventario` permission level; the frontend must not invent seller-to-POS restrictions.
- A location-scoped cache without the location code in its key could display one POS quantity under another location.
- The backend returns only locations that exist in the database, so the frontend must handle a missing canonical location rather than assume four options always exist.
- POS editing is not supported by the current backend; presenting an enabled edit control would create a false success path.
- Existing build/lint/test baselines must be reported separately from any new location-state regressions.

## Product Decision Needed

Before proposal and implementation, the team should approve the backend prerequisite: a bulk read endpoint for one location, for example `GET /api/inventario/stock?locationCode=...`, including its response shape, authorization, and whether unprovisioned product/location pairs are omitted or returned with `provisioned: false`. The team should also confirm that F07 is read-only for POS locations and that ecommerce remains Bodega Central-only.

## Ready for Proposal

**No — pending the bulk-read contract and the read-only POS decision.** Once those are approved, proceed to proposal for `F07A: frontend location contract and scoped read-state foundation`; do not create branches or production code from this exploration alone.
