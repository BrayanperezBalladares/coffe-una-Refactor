import React from 'react';
import { Sparkles } from 'lucide-react';
import { ProductItem, PuntoVentaItem, formatCRC } from './types';
import { ProductGallery } from './ProductGallery';
import { ProductHeader } from './ProductHeader';
import { ProductPurchaseDock } from './ProductPurchaseDock';
import { ProductAccordions } from './ProductAccordions';
import { ProductRelatedSection } from './ProductRelatedSection';
import { ImageLightbox } from '../../../Components/ImageLightbox/ImageLightbox';

interface ContentProps {
  product: ProductItem;
  display: ProductItem;
  fotos: string[];
  fotoActiva: number;
  fotoActual: string;
  setFotoActiva: (idx: number) => void;
  lightboxAbierto: boolean;
  setLightboxAbierto: (open: boolean) => void;
  stockDisponible: number;
  estaAgotado: boolean;
  precioNormal: number;
  precioConIVA: number;
  quantity: number;
  changeQuantity: (delta: number) => void;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  addedToast: boolean;
  puntosVenta: PuntoVentaItem[];
  relacionados: ProductItem[];
  tAgotado: string;
  tIva: string;
  tPrecioSin: string;
  tPresentacion: string;
  tCantidad: string;
  tAnadir: string;
  tFicha: string;
  tCategoria: string;
  tSubcategoria: string;
  tPuntosVenta: string;
  tUnidades: string;
  tTambien: string;
  tVerCat: string;
}

export const ProductDetailContent: React.FC<ContentProps> = ({
  product,
  display,
  fotos,
  fotoActiva,
  fotoActual,
  setFotoActiva,
  lightboxAbierto,
  setLightboxAbierto,
  stockDisponible,
  estaAgotado,
  precioNormal,
  precioConIVA,
  quantity,
  changeQuantity,
  handleAddToCart,
  addedToast,
  puntosVenta,
  relacionados,
  tAgotado,
  tIva,
  tPrecioSin,
  tPresentacion,
  tCantidad,
  tAnadir,
  tFicha,
  tCategoria,
  tSubcategoria,
  tPuntosVenta,
  tUnidades,
  tTambien,
  tVerCat,
}) => (
  <>
    <article className="product-detail-page__main-grid">
      <ProductGallery
        display={display}
        fotos={fotos}
        fotoActiva={fotoActiva}
        fotoActual={fotoActual}
        onSelectFoto={setFotoActiva}
        onOpenLightbox={() => setLightboxAbierto(true)}
      />

      <div className="product-detail-page__summary-column">
        <ProductHeader
          display={display}
          product={product}
          stockDisponible={stockDisponible}
          estaAgotado={estaAgotado}
          tAgotado={tAgotado}
        />

        <div className="product-detail-page__pricing-box">
          <div className="product-detail-page__price-main">
            <span className="product-detail-page__price-val">{formatCRC(precioConIVA)}</span>
            <span className="product-detail-page__price-tax">{tIva}</span>
          </div>
          {precioNormal > 0 ? (
            <span className="product-detail-page__price-sub">
              ({formatCRC(precioNormal)} {tPrecioSin})
            </span>
          ) : null}
        </div>

        {display.descripcion ? (
          <div className="product-detail-page__description-box">
            <p>{display.descripcion}</p>
          </div>
        ) : null}

        {product.peso ? (
          <div className="product-detail-page__options-group">
            <span className="product-detail-page__options-label">{tPresentacion}</span>
            <div className="product-detail-page__options-pills">
              <span className="product-detail-page__option-chip is-selected">
                <Sparkles size={13} aria-hidden="true" />
                {product.peso}
              </span>
            </div>
          </div>
        ) : null}

        <ProductPurchaseDock
          quantity={quantity}
          stockDisponible={stockDisponible}
          estaAgotado={estaAgotado}
          onChangeQuantity={changeQuantity}
          onAddToCart={handleAddToCart}
          tCantidad={tCantidad}
          tAgotado={tAgotado}
          tAnadir={tAnadir}
          addedToast={addedToast}
        />

        <ProductAccordions
          display={display}
          product={product}
          precioNormal={precioNormal}
          puntosVenta={puntosVenta}
          tFicha={tFicha}
          tCategoria={tCategoria}
          tSubcategoria={tSubcategoria}
          tPresentacion={tPresentacion}
          tPrecioSin={tPrecioSin}
          tPuntosVenta={tPuntosVenta}
          tUnidades={tUnidades}
          tAgotado={tAgotado}
        />
      </div>
    </article>

    {relacionados.length > 0 ? (
      <ProductRelatedSection
        relacionados={relacionados}
        tTambien={tTambien}
        tVerCat={tVerCat}
      />
    ) : null}

    <ImageLightbox
      images={fotos}
      index={lightboxAbierto ? fotoActiva : -1}
      onClose={() => setLightboxAbierto(false)}
      onIndexChange={setFotoActiva}
      alt={display.nombre}
    />
  </>
);
