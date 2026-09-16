import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Coffee } from 'lucide-react';
import { imagenPrincipalProducto } from '../../../lib/productoImagenes';
import { calcularPrecioConIVA } from '../../../services/productosService';
import { formatCRC, ProductItem } from './types';

interface RelatedProps {
  relacionados: ProductItem[];
  tTambien: string;
  tVerCat: string;
}

export const ProductRelatedSection: React.FC<RelatedProps> = ({
  relacionados,
  tTambien,
  tVerCat,
}) => (
  <section className="product-detail-page__related-section" aria-labelledby="related-products-title">
    <div className="product-detail-page__related-header">
      <div>
        <span className="product-detail-page__related-eyebrow">Selección del tostador</span>
        <h2 id="related-products-title" className="product-detail-page__related-title">
          {tTambien}
        </h2>
      </div>
      <Link to="/productos" className="product-detail-page__related-viewall">
        <span>{tVerCat}</span>
        <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
      </Link>
    </div>

    <div className="product-detail-page__related-grid">
      {relacionados.map((item) => {
        const price = Number(item.precioNormal ?? item.priceWithoutIva ?? item.price ?? 0) || 0;
        const priceIVA = calcularPrecioConIVA(price);
        const imageSrc = imagenPrincipalProducto(item);

        return (
          <Link
            key={item.id}
            to="/productos/$productId"
            params={{ productId: String(item.id) }}
            className="product-detail-page__related-card"
          >
            <div className="product-detail-page__related-img-wrap">
              {imageSrc ? (
                <img src={imageSrc} alt={item.nombre} loading="lazy" />
              ) : (
                <div className="product-detail-page__related-img-empty">
                  <Coffee size={28} />
                </div>
              )}
              {item.categoria ? (
                <span className="product-detail-page__related-badge">{item.categoria}</span>
              ) : null}
            </div>
            <div className="product-detail-page__related-card-body">
              <h3 className="product-detail-page__related-card-title">{item.nombre}</h3>
              <p className="product-detail-page__related-card-price">{formatCRC(priceIVA)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);
