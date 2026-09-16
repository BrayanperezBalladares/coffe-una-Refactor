import React from 'react';
import { ProductItem } from './types';

interface HeaderProps {
  display: ProductItem;
  product: ProductItem;
  stockDisponible: number;
  estaAgotado: boolean;
  tAgotado: string;
}

export const ProductHeader: React.FC<HeaderProps> = ({
  display,
  product,
  stockDisponible,
  estaAgotado,
  tAgotado,
}) => {
  const subcategoria = display.subcategoria || product.subcategoria;

  return (
    <header className="product-detail-page__header">
      <div className="product-detail-page__eyebrow-row">
        {display.categoria ? (
          <span className="product-detail-page__category-tag">{display.categoria}</span>
        ) : null}

        <span
          className={`product-detail-page__stock-badge ${
            estaAgotado ? 'is-out' : stockDisponible <= 3 ? 'is-low' : 'is-in'
          }`}
        >
          <span className="product-detail-page__stock-dot" aria-hidden="true" />
          {estaAgotado
            ? tAgotado
            : stockDisponible <= 3
            ? `Últimas ${stockDisponible} unidades`
            : 'Disponible'}
        </span>
      </div>

      <h1 className="product-detail-page__title">{display.nombre}</h1>

      {subcategoria ? (
        <p className="product-detail-page__meta-subtitle">{subcategoria}</p>
      ) : null}
    </header>
  );
};
