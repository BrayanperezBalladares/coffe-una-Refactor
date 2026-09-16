import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Coffee, Mail, MapPin, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './SocialIcons';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useHomeBrandNavigation } from '../../hooks/useHomeBrandNavigation';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerEnlaces, obtenerFooter } from '../../services/informacionService';
import { useIdioma } from '../../lib/useIdioma';
import { useTraducir } from '../../hooks/useTraducir';
import './Footer.css';

interface EnlaceFooter {
  id?: string | number;
  ruta?: string;
  Ruta?: string;
  etiqueta?: string;
  Etiqueta?: string;
  etiquetaEn?: string;
  EtiquetaEn?: string;
}

interface FooterData {
  fraseMarca?: string;
  FraseMarca?: string;
  textoCopyright?: string;
  TextoCopyright?: string;
  telefono?: string;
  Telefono?: string;
  correo?: string;
  Correo?: string;
  mapsUrl?: string;
  MapsUrl?: string;
  facebookUrl?: string;
  FacebookUrl?: string;
  instagramUrl?: string;
  InstagramUrl?: string;
  logoClaroUrl?: string;
  LogoClaroUrl?: string;
  logoUrl?: string;
  LogoUrl?: string;
}

function telefonoHref(telefono?: string | null): string {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('506') ? `tel:+${digits}` : `tel:+506${digits}`;
}

export const Footer: React.FC = () => {
  const { idioma } = useIdioma();
  const onBrandClick = useHomeBrandNavigation();
  const [footer, setFooter] = useState<FooterData | null>(null);
  const [enlacesExplorar, setEnlacesExplorar] = useState<EnlaceFooter[]>([]);

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerFooter().catch(() => null),
      obtenerEnlaces('FooterExplorar').catch(() => []),
    ]).then(([footerData, enlaces]) => {
      if (!activo) return;
      setFooter(footerData);
      setEnlacesExplorar(Array.isArray(enlaces) ? enlaces : []);
    });

    return () => {
      activo = false;
    };
  }, [idioma]);

  const fraseMarca = useTraducir(
    footer?.fraseMarca ?? footer?.FraseMarca ?? '',
  );
  const textoCopyright = useTraducir(
    footer?.textoCopyright ?? footer?.TextoCopyright ?? '',
  );

  const labelExplorar = useTraducir('Explorar');
  const labelContactos = useTraducir('Contacto & Atención');
  const labelRedes = useTraducir('Seguinos');
  const labelUbicacion = useTraducir('Visitar Finca en Maps');
  const labelInicio = useTraducir('Ir al inicio');
  const labelSello = useTraducir('Universidad Nacional de Costa Rica');
  const labelTerminos = useTraducir('Términos & Condiciones');
  const labelPrivacidad = useTraducir('Política de Privacidad');

  const telHref = telefonoHref(footer?.telefono ?? footer?.Telefono);
  const footerLogoSrc = normalizeImageUrl(
    footer?.logoClaroUrl || footer?.LogoClaroUrl || footer?.logoUrl || footer?.LogoUrl,
    { width: 480 },
  );

  const hasContactos = Boolean(
    telHref || footer?.correo || footer?.Correo || footer?.mapsUrl || footer?.MapsUrl,
  );
  const hasSocial = Boolean(
    footer?.facebookUrl || footer?.FacebookUrl || footer?.instagramUrl || footer?.InstagramUrl,
  );

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__glow" aria-hidden="true" />
      <div className="footer__inner">
        <div className="footer__top">
          {/* Brand & Institution Column */}
          <div className="footer__brand-col">
            <Link
              to="/"
              className="footer__brand"
              aria-label={labelInicio}
              onClick={onBrandClick}
            >
              {footerLogoSrc ? (
                <img
                  src={footerLogoSrc}
                  alt="Café UNA"
                  className="footer__logo"
                  width={200}
                  height={56}
                  decoding="async"
                />
              ) : (
                <span className="footer__brand-fallback">Café UNA</span>
              )}
            </Link>

            {fraseMarca ? (
              <p className="footer__slogan">“{fraseMarca}”</p>
            ) : null}

            <div className="footer__badge">
              <Coffee size={13} className="footer__badge-icon" aria-hidden="true" />
              <span>{labelSello}</span>
            </div>
          </div>

          {/* Navigation Links Column */}
          {enlacesExplorar.length > 0 ? (
            <nav className="footer__nav-col" aria-label={labelExplorar}>
              <h3 className="footer__col-title">{labelExplorar}</h3>
              <ul className="footer__nav-list">
                {enlacesExplorar.map((enlace) => (
                  <li key={enlace.id ?? enlace.ruta}>
                    <SiteNavLink enlace={enlace} className="footer__nav-link" />
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {/* Contact Details Column */}
          {hasContactos ? (
            <section className="footer__contact-col" aria-label={labelContactos}>
              <h3 className="footer__col-title">{labelContactos}</h3>
              <div className="footer__contact-list">
                {telHref ? (
                  <a href={telHref} className="footer__contact-link">
                    <span className="footer__icon-wrapper">
                      <Phone size={14} aria-hidden="true" />
                    </span>
                    <span>{footer?.telefono ?? footer?.Telefono}</span>
                  </a>
                ) : null}

                {(footer?.correo || footer?.Correo) ? (
                  <a
                    href={`mailto:${footer?.correo ?? footer?.Correo}`}
                    className="footer__contact-link"
                  >
                    <span className="footer__icon-wrapper">
                      <Mail size={14} aria-hidden="true" />
                    </span>
                    <span className="truncate">{footer?.correo ?? footer?.Correo}</span>
                  </a>
                ) : null}

                {(footer?.mapsUrl || footer?.MapsUrl) ? (
                  <a
                    href={footer?.mapsUrl ?? footer?.MapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__contact-link"
                  >
                    <span className="footer__icon-wrapper">
                      <MapPin size={14} aria-hidden="true" />
                    </span>
                    <span>{labelUbicacion}</span>
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Social & Community Column */}
          {hasSocial ? (
            <section className="footer__social-col" aria-label={labelRedes}>
              <h3 className="footer__col-title">{labelRedes}</h3>
              <p className="footer__social-copy">
                Conectate con nuestras novedades, catas y eventos de café especial.
              </p>
              <div className="footer__social-links">
                {(footer?.instagramUrl || footer?.InstagramUrl) ? (
                  <a
                    href={footer?.instagramUrl ?? footer?.InstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram de Café UNA"
                    className="footer__social-btn"
                  >
                    <InstagramIcon className="footer__social-svg" />
                  </a>
                ) : null}
                {(footer?.facebookUrl || footer?.FacebookUrl) ? (
                  <a
                    href={footer?.facebookUrl ?? footer?.FacebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook de Café UNA"
                    className="footer__social-btn"
                  >
                    <FacebookIcon className="footer__social-svg" />
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        {/* Bottom Legal & Attribution Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            {textoCopyright || `© ${currentYear} Café UNA. Todos los derechos reservados.`}
          </p>
          <div className="footer__bottom-links">
            <span className="footer__sublink">{labelPrivacidad}</span>
            <span className="footer__bullet" aria-hidden="true">·</span>
            <span className="footer__sublink">{labelTerminos}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
