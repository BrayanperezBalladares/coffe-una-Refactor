# Especificación: Interfaz de inventario por punto de venta

## Requisitos

### Requisito: Acceso a la pantalla POS

La pantalla DEBE estar disponible en `/admin/puntos-venta` para usuarios con `ver_inventario` y NO DEBE exponer datos a usuarios sin autorización.

#### Escenario: Acceso autorizado
- DADO que la sesión tiene permiso para ver inventario
- CUANDO navega a `/admin/puntos-venta`
- ENTONCES se muestra la pantalla administrativa de puntos de venta

#### Escenario: Acceso no autorizado
- DADO que la sesión no tiene permiso para ver inventario
- CUANDO intenta abrir la ruta
- ENTONCES no se muestran productos ni cantidades POS

### Requisito: Selección aislada de puntos de venta

La interfaz DEBE mostrar únicamente `POS_FUNA_UNA`, `POS_EDITORIAL` y `POS_STAND_FERIAS` como puntos de venta. Cada consulta DEBE usar el código estable y DEBE conservar visible el nombre de la ubicación seleccionada.

#### Escenario: Consultar un POS
- DADO que el usuario selecciona `POS_EDITORIAL`
- CUANDO se carga el detalle
- ENTONCES se consulta el stock con `locationCode=POS_EDITORIAL`
- Y ninguna fila usa cantidades de otra ubicación

#### Escenario: Stock ausente o cero
- DADO que el producto no tiene balance POS o tiene balance explícito en cero
- CUANDO se renderiza la tabla
- ENTONCES se distingue “Sin registro” de `0` confirmado

### Requisito: Ajuste POS autorizado

La interfaz DEBE mostrar el editor únicamente a usuarios con `ajustar_stock_ubicaciones`. El editor DEBE exigir un entero entre 0 y 2147483647 y un motivo entre 1 y 300 caracteres, y DEBE enviar ambos datos al endpoint de F08.

#### Escenario: Guardar ajuste
- DADO que el usuario tiene permiso y selecciona un producto POS
- CUANDO introduce stock válido y un motivo válido
- ENTONCES se envía `PUT /api/inventario/ubicaciones/{locationCode}/productos/{productId}/stock`
- Y se refresca únicamente el detalle de la ubicación seleccionada

#### Escenario: Validación del formulario
- DADO que el stock o el motivo no cumplen las reglas
- CUANDO intenta guardar
- ENTONCES se muestran errores accesibles y no se envía la solicitud

#### Escenario: Error de guardado
- DADO que el backend rechaza o falla el ajuste
- CUANDO termina la solicitud
- ENTONCES se conserva el formulario, se informa el error y se permite reintentar

### Requisito: Separación del catálogo y Bodega Central

La pantalla POS NO DEBE modificar `product.stock`, la disponibilidad ecommerce, ni la regla de destacados basada en `BODEGA_CENTRAL`.

#### Escenario: Ajustar un POS
- DADO que un producto tiene stock central y POS diferentes
- CUANDO se guarda un ajuste POS
- ENTONCES solo cambia el balance del POS seleccionado
- Y la disponibilidad ecommerce permanece basada en Bodega Central

### Requisito: Estados y accesibilidad

La interfaz DEBE diferenciar carga, lista vacía, error, éxito y actualización pendiente; DEBE usar controles con nombre accesible, foco visible y comportamiento responsive para escritorio y móvil.

#### Escenario: Carga y reintento
- DADO que una consulta POS está pendiente o falla
- CUANDO se muestra la pantalla
- ENTONCES se presenta el estado correspondiente y una acción accesible de reintento cuando aplique
