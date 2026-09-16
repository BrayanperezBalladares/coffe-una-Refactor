import React from 'react';
import { ShieldCheck, ShoppingCart } from 'lucide-react';

interface PurchaseDockProps {
  quantity: number;
  stockDisponible: number;
  estaAgotado: boolean;
  onChangeQuantity: (delta: number) => void;
  onAddToCart: (event: React.MouseEvent<HTMLButtonElement>) => void;
  tCantidad: string;
  tAgotado: string;
  tAnadir: string;
  addedToast: boolean;
}

export const ProductPurchaseDock: React.FC<PurchaseDockProps> = ({
  quantity,
  stockDisponible,
  estaAgotado,
  onChangeQuantity,
  onAddToCart,
  tCantidad,
  tAgotado,
  tAnadir,
  addedToast,
}) => (
  <>
    <div className="product-detail-page__purchase-dock">
      <div className="product-detail-page__stepper-wrap">
        <span className="product-detail-page__stepper-label">{tCantidad}</span>
        <div className="product-detail-page__stepper" aria-label={tCantidad}>
          <button
            type="button"
            className="product-detail-page__stepper-btn"
            onClick={() => onChangeQuantity(-1)}
            disabled={quantity <= 1 || estaAgotado}
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span className="product-detail-page__stepper-val" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="product-detail-page__stepper-btn"
            onClick={() => onChangeQuantity(1)}
            disabled={quantity >= stockDisponible || estaAgotado}
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="product-detail-page__cta-add"
        onClick={onAddToCart}
        disabled={estaAgotado}
      >
        <ShoppingCart size={18} aria-hidden="true" />
        <span>{estaAgotado ? tAgotado : tAnadir}</span>
      </button>
    </div>

    {addedToast ? (
      <div className="product-detail-page__added-feedback" role="alert">
        <ShieldCheck size={16} />
        <span>¡Producto agregado al carrito con éxito!</span>
      </div>
    ) : null}
  </>
);
