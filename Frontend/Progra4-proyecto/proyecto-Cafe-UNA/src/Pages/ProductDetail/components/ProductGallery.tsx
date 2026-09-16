import React from 'react';
import { Coffee, Search } from 'lucide-react';
import OptimizedImage from '../../../Components/OptimizedImage/OptimizedImage';
import { ProductItem } from './types';

interface GalleryProps {
  display: ProductItem;
  fotos: string[];
  fotoActiva: number;
  fotoActual: string;
  onSelectFoto: (index: number) => void;
  onOpenLightbox: () => void;
}

export const ProductGallery: React.FC<GalleryProps> = ({
  display,
  fotos,
  fotoActiva,
  fotoActual,
  onSelectFoto,
  onOpenLightbox,
}) => (
  <div className="product-detail-page__gallery-column">
    <div className="product-detail-page__media-wrapper">
      <div
        className="product-detail-page__hero-media"
        role={fotoActual ? 'button' : undefined}
        tabIndex={fotoActual ? 0 : undefined}
        onClick={fotoActual ? onOpenLightbox : undefined}
        onKeyDown={(e) => {
          if (fotoActual && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onOpenLightbox();
          }
        }}
        aria-label={fotoActual ? `Ampliar imagen de ${display.nombre}` : undefined}
      >
        {fotoActual ? (
          <OptimizedImage
            src={fotoActual}
            alt={display.nombre}
            width={800}
            height={800}
            priority
            className="product-detail-page__hero-img"
          />
        ) : (
          <div className="product-detail-page__hero-placeholder" aria-hidden="true">
            <Coffee size={48} />
          </div>
        )}

        {fotoActual ? (
          <button
            type="button"
            className="product-detail-page__zoom-badge"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox();
            }}
            aria-label="Abrir imagen en pantalla completa"
          >
            <Search size={15} />
            <span>Ampliar</span>
          </button>
        ) : null}
      </div>

      {fotos.length > 1 ? (
        <div className="product-detail-page__thumb-strip" aria-label="Galería de imágenes">
          {fotos.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`product-detail-page__thumb-item${index === fotoActiva ? ' is-active' : ''}`}
              onClick={() => onSelectFoto(index)}
              aria-label={`Ver imagen ${index + 1} de ${display.nombre}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);
