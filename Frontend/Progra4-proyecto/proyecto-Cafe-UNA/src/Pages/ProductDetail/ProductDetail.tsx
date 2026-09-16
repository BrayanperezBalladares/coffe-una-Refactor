import React from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import { useTraducir } from '../../hooks/useTraducir';
import { ProductDetailBreadcrumbs } from './components/ProductDetailBreadcrumbs';
import { ProductDetailEmpty } from './components/ProductDetailEmpty';
import { ProductDetailContent } from './components/ProductDetailContent';
import { useProductDetail } from './hooks/useProductDetail';
import './ProductDetail.css';

export const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams({ strict: false }) as { productId?: string };
  const numericId = Number(productId);

  const {
    product,
    display,
    relacionados,
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
  } = useProductDetail(numericId);

  const tVolver = useTraducir('Volver al catálogo');
  const tIva = useTraducir('IVA incluido');
  const tPresentacion = useTraducir('Presentación');
  const tCantidad = useTraducir('Cantidad');
  const tAgotado = useTraducir('Agotado');
  const tAnadir = useTraducir('Añadir al carrito');
  const tFicha = useTraducir('Ficha técnica y especificaciones');
  const tCategoria = useTraducir('Categoría');
  const tSubcategoria = useTraducir('Subcategoría');
  const tPrecioSin = useTraducir('Precio sin IVA');
  const tInicio = useTraducir('Inicio');
  const tProductos = useTraducir('Productos');
  const tTambien = useTraducir('También te puede interesar');
  const tVerCat = useTraducir('Ver todo el catálogo');
  const tUnidades = useTraducir('unidades');
  const tPuntosVenta = useTraducir('Disponibilidad en cafeterías UNA');

  const isReady = !loading;
  const showLoading = usePublicPageLoadingGate('product-detail', isReady);
  const loadingMessage = getLoadingMessageForCacheKey('product-detail');

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={Boolean(loadError) && !loading}
      error={loadError}
      errorMessage={loadError}
      onRetry={() => window.location.reload()}
    >
      <main className="product-detail-page">
        <ProductDetailBreadcrumbs
          product={product}
          display={display}
          tVolver={tVolver}
          tInicio={tInicio}
          tProductos={tProductos}
        />

        {!product && !loading ? (
          <ProductDetailEmpty
            loadError={loadError}
            tVolver={tVolver}
            onBack={() => navigate({ to: '/productos' })}
          />
        ) : null}

        {product && display ? (
          <ProductDetailContent
            product={product}
            display={display}
            fotos={fotos}
            fotoActiva={fotoActiva}
            fotoActual={fotoActual}
            setFotoActiva={setFotoActiva}
            lightboxAbierto={lightboxAbierto}
            setLightboxAbierto={setLightboxAbierto}
            stockDisponible={stockDisponible}
            estaAgotado={estaAgotado}
            precioNormal={precioNormal}
            precioConIVA={precioConIVA}
            quantity={quantity}
            changeQuantity={changeQuantity}
            handleAddToCart={handleAddToCart}
            addedToast={addedToast}
            puntosVenta={puntosVenta}
            relacionados={relacionados}
            tAgotado={tAgotado}
            tIva={tIva}
            tPrecioSin={tPrecioSin}
            tPresentacion={tPresentacion}
            tCantidad={tCantidad}
            tAnadir={tAnadir}
            tFicha={tFicha}
            tCategoria={tCategoria}
            tSubcategoria={tSubcategoria}
            tPuntosVenta={tPuntosVenta}
            tUnidades={tUnidades}
            tTambien={tTambien}
            tVerCat={tVerCat}
          />
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default ProductDetail;
