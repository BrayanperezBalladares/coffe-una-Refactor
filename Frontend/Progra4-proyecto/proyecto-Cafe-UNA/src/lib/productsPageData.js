import { obtenerProductos, obtenerDisponibilidadPuntosVenta } from '../services/productosService';

export async function fetchProductsPageData() {
  const [productList, disponibilidad] = await Promise.all([
    obtenerProductos(),
    obtenerDisponibilidadPuntosVenta().catch(() => ({ porProducto: [] })),
  ]);

  const porProductoMap = new Map();
  if (Array.isArray(disponibilidad?.porProducto)) {
    for (const row of disponibilidad.porProducto) {
      const maxStock = (row.puntos || []).reduce(
        (max, p) => Math.max(max, Number(p?.stock) || 0),
        0,
      );
      const totalPosStock = (row.puntos || []).reduce(
        (sum, p) => sum + (Number(p?.stock) || 0),
        0,
      );
      porProductoMap.set(String(row.productoId), { maxStock, totalPosStock, puntos: row.puntos });
    }
  }

  const list = Array.isArray(productList) ? productList : [];
  const merged = list.map((prod) => {
    const pos = porProductoMap.get(String(prod?.id));
    if (!pos) return prod;
    const stockEfectivo = Math.max(
      Number(prod?.stockTotal) || 0,
      Number(prod?.stock) || 0,
      pos.totalPosStock,
      pos.maxStock,
    );
    return {
      ...prod,
      puntosVenta: pos.puntos,
      stock: stockEfectivo,
      stockTotal: stockEfectivo,
      stockDisponible: stockEfectivo,
    };
  });

  return {
    products: merged,
  };
}

