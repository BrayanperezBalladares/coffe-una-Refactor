import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  Coffee,
  Package,
  Search,
  Shirt,
  ShoppingCart,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import {
  categoriasUnicas,
  esCategoriaRaiz,
  filtrarPorCategoria,
  nombreCategoria,
  TIPO_CATEGORIA_PRODUCTO,
} from '../../lib/categorias';
import { imagenPrincipalProducto } from '../../lib/productoImagenes';
import './Products.css';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { fetchProductsPageData } from '../../lib/productsPageData';
import { obtenerCategorias } from '../../services/categoriasService';
import { calcularPrecioConIVA } from '../../services/productosService';
import { clasificarDisponibilidad } from '../../lib/productoDisponibilidad';
import { useTraducir, useTraducirLista } from '../../hooks/useTraducir';

const PRODUCTS_PER_PAGE = 12;
const CAMPOS_PRODUCTO = ['nombre', 'descripcion'];

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

interface ProductItem {
  id: number | string;
  nombre: string;
  descripcion?: string;
  precioNormal?: number | string;
  priceWithoutIva?: number | string;
  price?: number | string;
  estado?: string;
  categoria?: string;
  subcategoria?: string;
  imagen?: string;
  imagenes?: string[];
  [key: string]: any;
}

interface CategoriaItem {
  id?: number | string;
  nombre: string;
  padre?: string | null;
  [key: string]: any;
}

function coincidenciaBusqueda(producto: ProductItem, query: string): boolean {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return (
    String(producto?.nombre || '').toLowerCase().includes(q) ||
    String(producto?.descripcion || '').toLowerCase().includes(q) ||
    String(producto?.categoria || '').toLowerCase().includes(q) ||
    String(producto?.subcategoria || '').toLowerCase().includes(q)
  );
}

function mergeNombres(...listas: (string[] | any[])[]): string[] {
  return categoriasUnicas(listas.flat().map((nombre) => ({ categoria: nombre })));
}

function iconoDeCategoria(nombre: string) {
  const n = String(nombre || '').toLowerCase();
  if (n.includes('caf')) return Coffee;
  if (n.includes('camisa') || n.includes('ropa') || n.includes('shirt') || n.includes('polo')) {
    return Shirt;
  }
  return Tag;
}

function formatPriceCRC(amount: number): string {
  return `₡${amount.toLocaleString('es-CR')}`;
}

const EMPTY_PRODUCTS: ProductItem[] = [];

export const Products: React.FC = () => {
  const {
    data,
    showLoading,
    isError,
    error: loadError,
    reload,
    loadingMessage,
  } = useCachedPublicPage('products', fetchProductsPageData);

  const rawProducts: ProductItem[] = data?.products ?? EMPTY_PRODUCTS;
  const productosTrad = useTraducirLista(rawProducts, CAMPOS_PRODUCTO) as ProductItem[];

  const nombrePorId = useMemo(() => {
    const map = new Map<number | string, string>();
    for (const p of productosTrad || []) {
      if (p?.id != null) map.set(p.id, p.nombre);
    }
    return map;
  }, [productosTrad]);

  const tProductos = useTraducir('Catálogo de Productos');
  const tLead = useTraducir('Granos seleccionados, tueste artesanal y productos de nuestra finca.');
  const tBuscar = useTraducir('Buscar por café, variedad, origen o producto...');
  const tTodas = useTraducir('Todas las categorías');
  const tLimpiar = useTraducir('Limpiar filtros');
  const tSinStock = useTraducir('Agotado temporalmente');
  const tDisponible = useTraducir('Disponible');
  const tAnadir = useTraducir('Añadir');
  const tVerDetalles = useTraducir('Ver detalles');
  const tOrdenar = useTraducir('Ordenar por');

  const [currentPage, setCurrentPage] = useState(1);
  const [categoria, setCategoria] = useState('todas');
  const [subcategoria, setSubcategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [categoriasApi, setCategoriasApi] = useState<CategoriaItem[]>([]);

  useEffect(() => {
    let activo = true;
    obtenerCategorias(TIPO_CATEGORIA_PRODUCTO)
      .then((lista) => {
        if (activo) setCategoriasApi(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (activo) setCategoriasApi([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  const visibleProducts = useMemo(
    () => rawProducts.filter((product) => product.estado !== 'Deshabilitado'),
    [rawProducts],
  );

  const categoriasRaizApi = useMemo(
    () => categoriasApi.filter(esCategoriaRaiz).map((item) => item.nombre),
    [categoriasApi],
  );

  const categorias = useMemo(
    () => mergeNombres(categoriasRaizApi, categoriasUnicas(visibleProducts)),
    [categoriasRaizApi, visibleProducts],
  );

  const subcategoriasActivas = useMemo(() => {
    if (categoria === 'todas') return [];
    const desdeApi = categoriasApi
      .filter(
        (item) =>
          nombreCategoria(item.padre).toLowerCase() === categoria.toLowerCase(),
      )
      .map((item) => item.nombre);
    const desdeProductos = categoriasUnicas(
      filtrarPorCategoria(visibleProducts, categoria),
      (item) => item?.subcategoria,
    );
    return mergeNombres(desdeApi, desdeProductos);
  }, [categoria, categoriasApi, visibleProducts]);

  // Filtrado y Ordenamiento
  const productosFiltrados = useMemo(() => {
    const porCategoria = filtrarPorCategoria(visibleProducts, categoria);
    const porSub = filtrarPorCategoria(porCategoria, subcategoria, (item) => item?.subcategoria);
    const coinciden = porSub.filter((producto) => coincidenciaBusqueda(producto, busqueda));

    const sorted = [...coinciden];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => {
          const pA = Number(a.precioNormal ?? a.price ?? 0) || 0;
          const pB = Number(b.precioNormal ?? b.price ?? 0) || 0;
          return pA - pB;
        });
        break;
      case 'price-desc':
        sorted.sort((a, b) => {
          const pA = Number(a.precioNormal ?? a.price ?? 0) || 0;
          const pB = Number(b.precioNormal ?? b.price ?? 0) || 0;
          return pB - pA;
        });
        break;
      case 'name-asc':
        sorted.sort((a, b) => {
          const nA = nombrePorId.get(a.id) || a.nombre || '';
          const nB = nombrePorId.get(b.id) || b.nombre || '';
          return nA.localeCompare(nB, 'es', { sensitivity: 'base' });
        });
        break;
      default:
        // Relevance default (preserves original order)
        break;
    }

    return sorted;
  }, [visibleProducts, categoria, subcategoria, busqueda, sortOption, nombrePorId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoria, subcategoria, busqueda, sortOption]);

  const totalPages = Math.ceil(productosFiltrados.length / PRODUCTS_PER_PAGE) || 1;

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return productosFiltrados.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, productosFiltrados]);

  const hayFiltros =
    categoria !== 'todas' || subcategoria !== 'todas' || Boolean(String(busqueda).trim()) || sortOption !== 'relevance';

  const limpiarFiltros = () => {
    setCategoria('todas');
    setSubcategoria('todas');
    setBusqueda('');
    setSortOption('relevance');
  };

  const handleQuickAdd = (event: React.MouseEvent<HTMLButtonElement>, product: ProductItem) => {
    event.preventDefault();
    event.stopPropagation();
    addProductToCart({
      id: product.id,
      nombre: product.nombre,
      price: Number(product.precioNormal ?? product.price ?? 0) || 0,
      priceWithoutIva: Number(product.precioNormal ?? product.price ?? 0) || 0,
      units: 1,
      image: imagenPrincipalProducto(product),
      category: product.categoria,
    });
    pulseButton(event.currentTarget);
  };

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={loadError}
      errorMessage="No se pudo cargar el catálogo de productos."
      onRetry={reload}
    >
      <main className="products-page">
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.products} />

        {/* Header Hero */}
        <header className="products-header">
          <div className="products-header__copy">
            <span className="products-header__eyebrow">
              <Sparkles size={13} className="text-amber-600" aria-hidden="true" />
              Café de Origen & Especialidad
            </span>
            <h1 className="products-header__title">{tProductos}</h1>
            <p className="products-header__lead">{tLead}</p>
          </div>

          <div className="products-header__stats" aria-live="polite">
            <Package size={15} aria-hidden="true" className="text-amber-700" />
            <span>
              <strong>{productosFiltrados.length}</strong>{' '}
              {productosFiltrados.length === 1 ? 'producto encontrado' : 'productos disponibles'}
            </span>
          </div>
        </header>

        {/* Unified Control Toolbar */}
        <section className="products-toolbar" aria-label="Controles de búsqueda y filtros">
          <div className="products-toolbar__search-row">
            {/* Search Input */}
            <div className="products-search-input">
              <Search className="products-search-input__icon" size={18} aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tBuscar}
                aria-label={tBuscar}
                autoComplete="off"
              />
              {busqueda ? (
                <button
                  type="button"
                  className="products-search-input__clear"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {/* Sort Selector */}
            <div className="products-sort">
              <ArrowUpDown size={15} className="products-sort__icon" aria-hidden="true" />
              <label htmlFor="products-sort-select" className="sr-only">{tOrdenar}</label>
              <select
                id="products-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="products-sort__select"
              >
                <option value="relevance">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name-asc">Nombre: A - Z</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="products-categories-bar" role="group" aria-label="Categorías de productos">
            <button
              type="button"
              className={`products-cat-pill${categoria === 'todas' ? ' is-active' : ''}`}
              onClick={() => {
                setCategoria('todas');
                setSubcategoria('todas');
              }}
            >
              <span>{tTodas}</span>
            </button>

            {categorias.map((nombre) => {
              const activa = nombreCategoria(categoria).toLowerCase() === nombre.toLowerCase();
              const Icono = iconoDeCategoria(nombre);
              return (
                <button
                  key={nombre}
                  type="button"
                  className={`products-cat-pill${activa ? ' is-active' : ''}`}
                  onClick={() => {
                    setCategoria(activa ? 'todas' : nombre);
                    setSubcategoria('todas');
                  }}
                >
                  <Icono size={14} aria-hidden="true" />
                  <span>{nombre}</span>
                </button>
              );
            })}

            {hayFiltros ? (
              <button
                type="button"
                className="products-clear-btn"
                onClick={limpiarFiltros}
              >
                <X size={14} aria-hidden="true" />
                <span>{tLimpiar}</span>
              </button>
            ) : null}
          </div>

          {/* Subcategories Row if Active */}
          {subcategoriasActivas.length > 0 ? (
            <div className="products-subcategories-bar" role="group" aria-label={`Subcategorías de ${categoria}`}>
              <span className="products-subcategories-label">Filtrar por:</span>
              <button
                type="button"
                className={`products-subcat-pill${subcategoria === 'todas' ? ' is-active' : ''}`}
                onClick={() => setSubcategoria('todas')}
              >
                Todas
              </button>
              {subcategoriasActivas.map((sub) => {
                const activa = subcategoria.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    type="button"
                    className={`products-subcat-pill${activa ? ' is-active' : ''}`}
                    onClick={() => setSubcategoria(activa ? 'todas' : sub)}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* Product Grid */}
        <section className="products-grid" aria-label="Lista de productos">
          {productosFiltrados.length === 0 ? (
            <div className="products-empty-state">
              <Package size={48} className="products-empty-state__icon" aria-hidden="true" />
              <h3>No encontramos productos coincidentes</h3>
              <p>Probá cambiando las palabras clave de búsqueda o seleccionando otra categoría.</p>
              {hayFiltros ? (
                <button type="button" className="btn-pill btn-pill--dark mt-3" onClick={limpiarFiltros}>
                  {tLimpiar}
                </button>
              ) : null}
            </div>
          ) : (
            currentProducts.map((product, index) => {
              const precioNormal = Number(product.precioNormal ?? product.priceWithoutIva ?? product.price ?? 0) || 0;
              const precioConIVA = calcularPrecioConIVA(precioNormal);
              const disponibilidad = clasificarDisponibilidad(product);
              const estaAgotado = disponibilidad.codigo === 'agotado';
              const foto = imagenPrincipalProducto(product);
              const nombreUi = nombrePorId.get(product.id) || product.nombre;

              return (
                <article
                  key={product.id}
                  className={`product-card${estaAgotado ? ' is-sold-out' : ''}`}
                >
                  <Link
                    to="/productos/$productId"
                    params={{ productId: String(product.id) }}
                    className="product-card__link-overlay"
                  >
                    <span className="sr-only">{`Ver detalle de ${nombreUi}`}</span>
                  </Link>

                  {/* Card Media */}
                  <div className="product-card__media">
                    {foto ? (
                      <OptimizedImage
                        src={foto}
                        alt={nombreUi}
                        width={480}
                        height={480}
                        priority={index < 4}
                        className="product-card__image"
                      />
                    ) : (
                      <div className="product-card__placeholder" aria-hidden="true">
                        <Coffee size={36} className="text-amber-800/40" />
                      </div>
                    )}

                    {/* Category or Status Badge */}
                    <div className="product-card__badges">
                      {product.categoria ? (
                        <span className="product-card__badge product-card__badge--cat">
                          {product.categoria}
                        </span>
                      ) : null}
                      {estaAgotado ? (
                        <span className="product-card__badge product-card__badge--soldout">
                          Agotado
                        </span>
                      ) : (
                        <span className="product-card__badge product-card__badge--stock">
                          <span className="product-card__dot" aria-hidden="true" />
                          {tDisponible}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="product-card__content">
                    {product.subcategoria ? (
                      <span className="product-card__subcat">{product.subcategoria}</span>
                    ) : null}

                    <h2 className="product-card__title" title={nombreUi}>
                      {nombreUi}
                    </h2>

                    <div className="product-card__footer">
                      <div className="product-card__price-box">
                        <span className="product-card__price">
                          {formatPriceCRC(precioConIVA)}
                        </span>
                        <span className="product-card__iva">IVA incl.</span>
                      </div>

                      <div className="product-card__actions">
                        <button
                          type="button"
                          className="product-card__add-btn"
                          disabled={estaAgotado}
                          onClick={(e) => handleQuickAdd(e, product)}
                          title={`Añadir ${nombreUi} al carrito`}
                          aria-label={`Añadir ${nombreUi} al carrito`}
                        >
                          <ShoppingCart size={16} aria-hidden="true" />
                          <span>{tAnadir}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 ? (
          <nav className="products-pagination" aria-label="Paginación del catálogo">
            <button
              type="button"
              className="products-pagination__arrow"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  type="button"
                  className={`products-pagination__page${currentPage === page ? ' is-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              className="products-pagination__arrow"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              →
            </button>
          </nav>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default Products;
