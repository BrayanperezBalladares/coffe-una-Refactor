export const CATEGORY_TYPES = {
  venta: { label: "Productos para Venta", color: "amber" },
  insumo_agricola: { label: "Insumos Agrícolas", color: "green" },
  donacion: { label: "Donaciones", color: "purple" },
  material_administrativo: { label: "Materiales Administrativos", color: "blue" },
  equipo: { label: "Equipos", color: "stone" },
};

export const MOVEMENT_TYPES = {
  entrada: { label: "Entrada", color: "text-emerald-700 bg-emerald-50" },
  salida: { label: "Salida", color: "text-red-700 bg-red-50" },
  ajuste: { label: "Ajuste", color: "text-blue-700 bg-blue-50" },
  traslado: { label: "Traslado", color: "text-purple-700 bg-purple-50" },
  venta: { label: "Venta", color: "text-amber-700 bg-amber-50" },
  donacion: { label: "Donación", color: "text-pink-700 bg-pink-50" },
  consumo_interno: { label: "Consumo Interno", color: "text-stone-700 bg-stone-50" },
};

export const ENTRY_REASONS = {
  produccion: "Producción de café",
  compra: "Compra de productos",
  donacion: "Recepción de donación",
  ajuste_manual: "Ajuste manual",
  traslado_entrada: "Traslado (entrada)",
};

export const EXIT_REASONS = {
  venta_web: "Venta web",
  venta_fisica: "Venta física",
  consumo_interno: "Consumo interno",
  perdida: "Pérdida",
  danado: "Producto dañado",
  traslado_salida: "Traslado (salida)",
};

export const LOCATIONS = {
  bodega_central: "Bodega Central",
  punto_venta_1: "Punto de Venta 1",
  punto_venta_2: "Punto de Venta 2",
  punto_venta_3: "Punto de Venta 3",
};

export const SALE_STATUSES = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  pago_recibido: { label: "Pago Recibido", color: "bg-blue-100 text-blue-800" },
  aprobado: { label: "Aprobado", color: "bg-indigo-100 text-indigo-800" },
  preparado: { label: "Preparado", color: "bg-purple-100 text-purple-800" },
  retirado: { label: "Retirado", color: "bg-emerald-100 text-emerald-800" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export const PAYMENT_METHODS = {
  efectivo: "Efectivo",
  sinpe: "SINPE Móvil",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export const UNITS = [
  "unidad", "kg", "g", "lb", "litro", "ml", "bolsa", "caja", "paquete", "rollo", "galón", "metro", "pieza"
];