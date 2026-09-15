## Exploration: Interfaz administrativa de Puntos de Venta

### Current State
El inventario actual vive en `/admin/producto`. Ya separa catálogo, Bodega Central y stock por ubicación mediante `productosService.js`, `useInventoryLocations.js` y `useLocationStock.js`. El backend F08 expone el ajuste transaccional de stock POS, pero todavía está pendiente de integrarse en `development`. El sidebar actual solo enlaza a Producto dentro de Manejo de inventario.

### Affected Areas
- `proyecto-Cafe-UNA/src/services/productosService.js` — falta adaptar el comando de ajuste POS y limpiar/refrescar el cache de la ubicación.
- `proyecto-Cafe-UNA/src/Pages/Admin/PuntosVenta/` — nueva pantalla de consulta y operación por POS.
- `proyecto-Cafe-UNA/src/router.jsx` — nueva ruta administrativa lazy.
- `proyecto-Cafe-UNA/src/Components/Admin/AppSidebar.jsx` — posible integración posterior; se evita modificarla mientras la compañera trabaja el apartado informativo.

### Approaches
1. **Nueva pantalla de Puntos de Venta** — vista dedicada con selector/listado de POS y detalle de stock.
   - Pros: separa operación POS del catálogo; escala para ventas y traslados futuros.
   - Cons: requiere ruta y componentes nuevos.
   - Effort: Medium
2. **Agregar todo dentro de `/admin/producto`** — reutilizar la tabla existente para operar POS.
   - Pros: menor cambio inicial.
   - Cons: mezcla responsabilidades y dificulta agregar ventas, traslados e historial.
   - Effort: Low

### Recommendation
Elegir la pantalla dedicada. Reutilizar los contratos, hooks, layout y tokens existentes, pero mantener fuera de este slice ventas, traslados, historial, activos y edición de metadatos del POS.

### Risks
- La UI puede adelantarse al backend si F08 no está en `development`.
- Cambios en el sidebar pueden entrar en conflicto con el trabajo del apartado informativo.
- Un stock POS no debe modificar disponibilidad ecommerce ni `Producto.Stock` central.

### Ready for Proposal
Yes — el alcance queda delimitado y puede pasar a propuesta, especificación, diseño y tareas.
