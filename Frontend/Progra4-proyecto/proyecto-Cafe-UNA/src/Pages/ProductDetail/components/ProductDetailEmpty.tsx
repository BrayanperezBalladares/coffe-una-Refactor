import React from 'react';
import { ArrowLeft, Package } from 'lucide-react';

interface EmptyProps {
  loadError: string;
  tVolver: string;
  onBack: () => void;
}

export const ProductDetailEmpty: React.FC<EmptyProps> = ({
  loadError,
  tVolver,
  onBack,
}) => (
  <section className="product-detail-page__empty-state">
    <Package size={48} className="product-detail-page__empty-icon" aria-hidden="true" />
    <h2>{loadError || 'Producto no encontrado'}</h2>
    <p>El producto solicitado no existe o no se encuentra activo en nuestro catálogo.</p>
    <button
      type="button"
      className="product-detail-page__btn-back-catalog"
      onClick={onBack}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {tVolver}
    </button>
  </section>
);
