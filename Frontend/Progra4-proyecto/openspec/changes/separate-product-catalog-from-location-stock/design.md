# Design: Separate Product Catalog from Bodega Central Stock

## Technical Approach

Keep `/admin/producto` and its admin shell, but turn `InventarioProducto.jsx` into an orchestration container. A compatibility adapter converts every backend shape into separate catalog and Bodega Central stock DTOs. Catalog reads/writes and stock mutation state are managed independently; a stock failure never removes already loaded catalog content. Characterization tests precede extraction.

```text
/admin/producto
  -> InventoryProductPage
     -> useProductCatalog -> productosService -> GET/POST/PUT /api/productos
     -> useCentralStock   -> productosService -> compatibility read
                                             -> PUT /api/productos/:id/stock-central
     -> desktop table | mobile list -> catalog drawer | stock editor
```

After a successful stock update, the client applies `{ productId, locationCode, stock }`, then refreshes catalog metadata because the backend may clear `esDestacado` when central stock reaches zero.

## Architecture Decisions

| Decision | Alternatives / tradeoff | Rationale |
|---|---|---|
| Canonical DTOs are created only in `productosService.js`; camelCase wins over PascalCase, and historical price aliases are last | Normalize in components; preserve raw aliases | Current service already prefers `precioNormal -> priceWithoutIva -> price` and `esDestacado -> EsDestacado`; centralizing and removing raw spread prevents mixed models. |
| Separate `useProductCatalog` and `useCentralStock` state machines | One page-level loading/error flag; global store | Independent `{status,data,error,retry}` states satisfy partial failure behavior without adding application-wide state. During compatibility, stock retry re-reads products but updates only stock state. |
| Explicit desktop table and mobile list components | One heavily conditional component; decorative cards | Matches the reviewed operational design and avoids boolean-prop proliferation while sharing row actions and formatters. |
| Catalog and stock use separate forms and requests | Keep stock in `ProductForm`; auto-save both | Enforces field permissions, clearer failures, and rollback-safe writes. Catalog create defaults central stock to zero server-side. |

## Interfaces / Contracts

```js
CatalogProduct = {
  id: string, nombre: string, descripcion: string, imagen: string,
  precioNormal: number, precioConIVA: number,
  estado: "Habilitado" | "Deshabilitado", peso: string,
  esDestacado: boolean
}
CentralStock = {
  productId: string, locationCode: "BODEGA_CENTRAL",
  stock: number | null, confidence: "known" | "unknown"
}
```

For every supported field, precedence is canonical camelCase, then same-name PascalCase; `precioNormal` additionally falls back to `priceWithoutIva`, then `price`. `undefined` advances to the next alias, while valid `false`, `0`, and empty strings are preserved. Missing/malformed stock becomes `stock:null/confidence:"unknown"`, never fabricated zero. Invalid catalog identity rejects that record recoverably.

Catalog POST/PUT payloads contain only `nombre`, `descripcion`, `imagen`, `precioNormal`, `precioConIVA`, `estado`, `peso`, and `esDestacado`. Central stock uses `PUT /api/productos/:id/stock-central`, body `{ stock }`, response `{ productId, locationCode, stock }`. Stock MUST be an integer from 0 through 2147483647 before transport. Compatibility product `stock/Stock` means Bodega Central only. Ecommerce visibility and featured eligibility fail closed unless known central stock is greater than zero; sales-point values are ignored.

## Component and File Boundaries

| Action | Files |
|---|---|
| Create | `src/Pages/Admin/InventarioProducto/components/ProductCatalogTable.jsx`, `ProductCatalogMobileList.jsx`, `ProductCatalogFormDrawer.jsx`, `CentralStockEditor.jsx`, `ProductActions.jsx`; `hooks/useProductCatalog.js`, `hooks/useCentralStock.js`; focused `*.test.jsx`; `src/services/productosService.test.js`, `src/lib/productoDisponibilidad.test.js`, `src/test/setup.js` |
| Modify | `InventarioProducto.jsx`, `src/services/productosService.js`, `src/lib/productoDisponibilidad.js`, `src/lib/formLimits.js`, `package.json`, `vite.config.js` |
| Delete | None |

The page owns permissions and composition; hooks own request transitions; service owns transport/mapping; components receive DTOs and callbacks. Product deletion is removed; deactivation remains permission-gated.

## UI, Accessibility, and Responsive Behavior

Use neutral shared surfaces/actions and semantic colors only for status. Desktop uses a contained table; mobile uses designed list rows. Create/edit opens a side drawer on desktop and full-screen dialog on small screens, with a scrollable body and sticky footer ordered Cancel then Save. Controls are at least 44px, focus is visible, validation runs on blur/submit, the first invalid field receives focus, and errors use `role="alert"`/`aria-live`. Stock source and eligibility are textual, not color-only. Verify 375/768/1024/1440px and reduced motion.

## Testing Strategy

First add Vitest, React Testing Library, jsdom, and setup. Capture current catalog loading, filtering, permissions, form validation, and responsive render in `InventarioProducto.characterization.test.jsx` before extraction. Service tests cover alias precedence, partial/malformed stock, catalog payload exclusion, stock range validation, and exact endpoint contracts. Hook/component tests cover independent retries, permission-denied preservation, focus/error announcements, central-only eligibility, and post-stock catalog refresh. Build and lint run with baseline violations reported separately.

## Threat Matrix

N/A — this change does not alter routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundaries.

## Migration / Rollout

Deliver test foundation, behavior-preserving extraction, compatibility adapter, then stock UI integration. Backend compatibility must deploy first. Each slice can be reverted independently; no frontend data migration or legacy-field removal occurs.

## Open Questions

None.
