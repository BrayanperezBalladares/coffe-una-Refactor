import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ProductItem } from './types';

interface BreadcrumbsProps {
  product: ProductItem | null;
  display: ProductItem | null;
  tVolver: string;
  tInicio: string;
  tProductos: string;
}

export const ProductDetailBreadcrumbs: React.FC<BreadcrumbsProps> = ({
  product,
  display,
  tVolver,
  tInicio,
  tProductos,
}) => (
  <nav className="product-detail-page__nav-bar" aria-label="Navegación de producto">
    <Link to="/productos" className="product-detail-page__back-link">
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{tVolver}</span>
    </Link>

    {product && display ? (
      <ol className="product-detail-page__breadcrumb" aria-label="Miga de pan">
        <li>
          <Link to="/">{tInicio}</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to="/productos">{tProductos}</Link>
        </li>
        {display.categoria ? (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <span className="product-detail-page__breadcrumb-current">{display.categoria}</span>
            </li>
          </>
        ) : null}
        <li aria-hidden="true">/</li>
        <li aria-current="page">
          <strong className="product-detail-page__breadcrumb-item-active">{display.nombre}</strong>
        </li>
      </ol>
    ) : null}
  </nav>
);
