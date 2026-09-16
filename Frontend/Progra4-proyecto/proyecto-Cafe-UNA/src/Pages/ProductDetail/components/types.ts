export interface ProductItem {
  id: number | string;
  nombre: string;
  descripcion?: string;
  precioNormal?: number | string;
  priceWithoutIva?: number | string;
  price?: number | string;
  estado?: string;
  categoria?: string;
  subcategoria?: string;
  peso?: string;
  stock?: number | string;
  stockTotal?: number | string;
  imagen?: string;
  imagenes?: string[];
  [key: string]: any;
}

export interface PuntoVentaItem {
  code: string | number;
  name: string;
  stock: number | string;
  [key: string]: any;
}

export function formatCRC(value: number | string | null | undefined): string {
  return '\u20A1' + (Number(value) || 0).toLocaleString('es-CR');
}
