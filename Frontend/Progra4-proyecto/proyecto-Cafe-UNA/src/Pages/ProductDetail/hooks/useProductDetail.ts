import { useState, useEffect, useMemo } from 'react';
import {
  calcularPrecioConIVA,
  obtenerDisponibilidadPuntosVenta,
  obtenerProductoPorId,
  obtenerProductos,
} from '../../../services/productosService';
import { clasificarDisponibilidad } from '../../../lib/productoDisponibilidad';
import { parsearImagenesProducto } from '../../../lib/productoImagenes';
import { addProductToCart, pulseButton } from '../../../lib/cartStorage';
import { useTraducirLista, useTraducirObjeto } from '../../../hooks/useTraducir';
import { ProductItem, PuntoVentaItem } from '../components/types';

const CAMPOS_PRODUCTO = ['nombre', 'descripcion', 'categoria', 'subcategoria'];

export function useProductDetail(numericId: number) {
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relacionados, setRelacionados] = useState<ProductItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVentaItem[]>([]);
  const [addedToast, setAddedToast] = useState(false);

  const productoUi = useTraducirObjeto(
    product ?? { nombre: '', descripcion: '', categoria: '', subcategoria: '' },
    CAMPOS_PRODUCTO,
  );
  const relacionadosUi = useTraducirLista(relacionados, ['nombre']);
  const display: ProductItem | null = product ? (productoUi || product) : null;

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      if (!Number.isFinite(numericId)) {
        if (active) {
          setLoadError('Producto no encontrado.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setLoadError('');
        const [data, catalogo] = await Promise.all([
          obtenerProductoPorId(numericId),
          obtenerProductos().catch(() => []),
        ]);

        if (!active) return;

        if (!data || data.estado === 'Deshabilitado') {
          setProduct(null);
          setRelacionados([]);
          setLoadError('Producto no encontrado o no disponible actualmente.');
        } else {
          setProduct(data);
          setQuantity(1);
          setFotoActiva(0);
          setLightboxAbierto(false);

          const catalogArray: ProductItem[] = Array.isArray(catalogo) ? catalogo : [];
          setRelacionados(
            catalogArray
              .filter(
                (item) =>
                  String(item.id) !== String(data.id) &&
                  item.estado !== 'Deshabilitado',
              )
              .slice(0, 4),
          );

          obtenerDisponibilidadPuntosVenta([data.id])
            .then((disp: any) => {
              if (!active) return;
              const row = (disp?.porProducto || []).find(
                (item: any) => String(item.productoId) === String(data.id),
              );
              setPuntosVenta(row?.puntos || []);
            })
            .catch(() => {
              if (active) setPuntosVenta([]);
            });
        }
      } catch {
        if (!active) return;
        setProduct(null);
        setLoadError('No se pudo cargar la información del producto.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [numericId]);

  const fotos = useMemo(() => parsearImagenesProducto(product), [product]);
  const fotoActual = fotos[fotoActiva] || fotos[0] || '';

  const precioNormal = useMemo(
    () => Number(product?.precioNormal ?? product?.priceWithoutIva ?? product?.price ?? 0) || 0,
    [product],
  );
  const precioConIVA = useMemo(() => calcularPrecioConIVA(precioNormal), [precioNormal]);

  const stockPosMax = useMemo(
    () => puntosVenta.reduce((max, punto) => Math.max(max, Number(punto.stock) || 0), 0),
    [puntosVenta],
  );
  const stockDisponible = stockPosMax > 0 ? stockPosMax : Number(product?.stock) || 0;

  const disponibilidad = clasificarDisponibilidad(
    puntosVenta.length > 0
      ? { ...(product || {}), stock: stockPosMax, stockTotal: stockPosMax }
      : product || { stock: 0 },
  );
  const estaAgotado = disponibilidad.codigo === 'agotado';

  const changeQuantity = (delta: number) => {
    setQuantity((current) => {
      const nextValue = current + delta;
      return Math.min(Math.max(nextValue, 1), stockDisponible || 1);
    });
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!product || estaAgotado) return;
    const effectiveStock = Math.max(
      stockDisponible,
      Number(product.stockTotal) || 0,
      Number(product.stock) || 0,
    );
    if (
      addProductToCart(
        {
          ...product,
          stock: effectiveStock,
          stockTotal: effectiveStock,
          stockDisponible: effectiveStock,
        },
        quantity,
      )
    ) {
      pulseButton(event.currentTarget);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    }
  };

  const listaRelacionados = (relacionadosUi && relacionadosUi.length > 0) ? relacionadosUi : relacionados;

  return {
    product,
    display,
    relacionados: listaRelacionados,
    loadError,
    loading,
    quantity,
    fotoActiva,
    setFotoActiva,
    fotoActual,
    fotos,
    lightboxAbierto,
    setLightboxAbierto,
    puntosVenta,
    addedToast,
    precioNormal,
    precioConIVA,
    stockDisponible,
    estaAgotado,
    changeQuantity,
    handleAddToCart,
  };
}
