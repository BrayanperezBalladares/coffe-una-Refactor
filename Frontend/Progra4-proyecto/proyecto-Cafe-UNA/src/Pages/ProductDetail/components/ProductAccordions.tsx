import React, { useState } from 'react';
import { ChevronDown, Package, Store, Truck } from 'lucide-react';
import { formatCRC, ProductItem, PuntoVentaItem } from './types';

interface AccordionsProps {
  display: ProductItem;
  product: ProductItem;
  precioNormal: number;
  puntosVenta: PuntoVentaItem[];
  tFicha: string;
  tCategoria: string;
  tSubcategoria: string;
  tPresentacion: string;
  tPrecioSin: string;
  tPuntosVenta: string;
  tUnidades: string;
  tAgotado: string;
}

export const ProductAccordions: React.FC<AccordionsProps> = ({
  display,
  product,
  precioNormal,
  puntosVenta,
  tFicha,
  tCategoria,
  tSubcategoria,
  tPresentacion,
  tPrecioSin,
  tPuntosVenta,
  tUnidades,
  tAgotado,
}) => {
  const [specsAbiertas, setSpecsAbiertas] = useState(true);
  const [posAbierto, setPosAbierto] = useState(true);
  const [envioAbierto, setEnvioAbierto] = useState(false);

  return (
    <div className="product-detail-page__accordions">
      <div className="product-detail-page__accordion-card">
        <button
          type="button"
          className="product-detail-page__accordion-head"
          onClick={() => setSpecsAbiertas((prev) => !prev)}
          aria-expanded={specsAbiertas}
        >
          <span className="product-detail-page__accordion-title">
            <Package size={16} aria-hidden="true" />
            {tFicha}
          </span>
          <ChevronDown
            size={18}
            className={`product-detail-page__chevron${specsAbiertas ? ' is-open' : ''}`}
            aria-hidden="true"
          />
        </button>
        {specsAbiertas ? (
          <div className="product-detail-page__accordion-body">
            <dl className="product-detail-page__spec-list">
              <div className="product-detail-page__spec-item">
                <dt>{tCategoria}</dt>
                <dd>{display.categoria || 'Cafetería UNA'}</dd>
              </div>
              {display.subcategoria ? (
                <div className="product-detail-page__spec-item">
                  <dt>{tSubcategoria}</dt>
                  <dd>{display.subcategoria}</dd>
                </div>
              ) : null}
              {product.peso ? (
                <div className="product-detail-page__spec-item">
                  <dt>{tPresentacion}</dt>
                  <dd>{product.peso}</dd>
                </div>
              ) : null}
              <div className="product-detail-page__spec-item">
                <dt>{tPrecioSin}</dt>
                <dd>{formatCRC(precioNormal)}</dd>
              </div>
              <div className="product-detail-page__spec-item">
                <dt>Código / SKU</dt>
                <dd>UNA-PRD-{String(product.id).padStart(4, '0')}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      {puntosVenta.length > 0 ? (
        <div className="product-detail-page__accordion-card">
          <button
            type="button"
            className="product-detail-page__accordion-head"
            onClick={() => setPosAbierto((prev) => !prev)}
            aria-expanded={posAbierto}
          >
            <span className="product-detail-page__accordion-title">
              <Store size={16} aria-hidden="true" />
              {tPuntosVenta}
            </span>
            <ChevronDown
              size={18}
              className={`product-detail-page__chevron${posAbierto ? ' is-open' : ''}`}
              aria-hidden="true"
            />
          </button>
          {posAbierto ? (
            <div className="product-detail-page__accordion-body">
              <ul className="product-detail-page__pos-list">
                {puntosVenta.map((punto) => {
                  const stockNum = Number(punto.stock) || 0;
                  return (
                    <li key={punto.code} className="product-detail-page__pos-item">
                      <div className="product-detail-page__pos-info">
                        <Store size={15} className="product-detail-page__pos-store-icon" />
                        <span>{punto.name}</span>
                      </div>
                      <span
                        className={`product-detail-page__pos-stock-tag ${
                          stockNum > 0 ? 'is-available' : 'is-empty'
                        }`}
                      >
                        {stockNum > 0 ? `${stockNum} ${tUnidades}` : tAgotado}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="product-detail-page__accordion-card">
        <button
          type="button"
          className="product-detail-page__accordion-head"
          onClick={() => setEnvioAbierto((prev) => !prev)}
          aria-expanded={envioAbierto}
        >
          <span className="product-detail-page__accordion-title">
            <Truck size={16} aria-hidden="true" />
            Retiro y Envíos Nacionales
          </span>
          <ChevronDown
            size={18}
            className={`product-detail-page__chevron${envioAbierto ? ' is-open' : ''}`}
            aria-hidden="true"
          />
        </button>
        {envioAbierto ? (
          <div className="product-detail-page__accordion-body">
            <div className="product-detail-page__shipping-info">
              <p>
                <strong>Retiro en Cafeterías UNA:</strong> Podés retirar tu pedido en
                cualquiera de nuestras sedes autorizadas sin costo adicional una vez
                confirmada la orden.
              </p>
              <p>
                <strong>Envíos a todo el país:</strong> Coordinamos entregas con Correos
                de Costa Rica (24 a 48 horas hábiles en el GAM, 48 a 72 horas para el resto del
                país).
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
