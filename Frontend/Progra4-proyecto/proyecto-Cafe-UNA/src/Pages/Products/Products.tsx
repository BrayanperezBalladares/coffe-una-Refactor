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

export interface ProductItem {
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

export interface CategoriaItem {
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

function mergeNombres(a: string[], b: string[]): string[] {
  const map = new Map<string, string>();
  for (const n of [...a, ...b]) {
    const s = String(n || '').trim();
    if (s && !map.has(s.toLowerCase())) map.set(s.toLowerCase(), s);
  }
  return Array.from(map.values()).sort((x, y) => x.localeCompare(y, 'es', { sensitivity: 'base' }));
}

function iconoDeCategoria(categoria: string) {
  const c = String(categoria || '').toLowerCase();
  if (c.includes('café') || c.includes('cafe') || c.includes('grano')) return Coffee;
  if (c.includes('textil') || c.includes('ropa') || c.includes('merch')) return Shirt;
  return Tag;
}

function formatPriceCRC(amount: number): string {
  return `\u20A1${amount.toLocaleString('es-CR')}`;
}

/* --- Sub-Component: Single Product Card --- */
interface ProductCardProps {
  product: ProductItem;
  displayName: string;
  tDisponible: string;
  tSinStock: string;
  tAnadir: string;
  onQuickAdd: (e: React.MouseEvent<HTMLButtonElement>, prod: ProductItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  displayName,
  tDisponible,
  tSinStock,
  tAnadir,
  onQuickAdd,
}) => {
  const precio = Number(product.precioNormal ?? product.price ?? 0) || 0;
  const precioFinal = calcularPrecioConIVA(precio);
  const disponibilidad = clasificarDisponibilidad(product);
  const estaAgotado = disponibilidad.codigo === 'agotado';
  const imagen = imagenPrincipalProducto(product);

  return (
    <article
      className={`product-card${estaAgotado ? ' is-sold-out' : ''}`}
      aria-label={displayName}
    >
      <Link
        to="/productos/$productId"
        params={{ productId: String(product.id) }}
        className="product-card__link-overlay"
        aria-label={`Ver detalle de ${displayName}`}
      />

      <div className="product-card__media">
        {imagen ? (
          <OptimizedImage
            src={imagen}
            alt={displayName}
            width={480}
            height={480}
            className="product-card__image"
          />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true">
            <Coffee size={36} className="text-stone-400" />
          </div>
        )}

        <div className="product-card__badges">
          {product.categoria ? (
            <span className="product-card__badge product-card__badge--cat">
              {product.categoria}
            </span>
          ) : <span />}

          <span
            className={`product-card__badge ${
              estaAgotado ? 'product-card__badge--soldout' : 'product-card__badge--stock'
            }`}
          >
            <span className="product-card__dot" aria-hidden="true" />
            {estaAgotado ? tSinStock : tDisponible}
          </span>
        </div>
      </div>

      <div className="product-card__content">
        {product.subcategoria ? (
          <span className="product-card__subcat">{product.subcategoria}</span>
        ) : null}

        <h2 className="product-card__title">{displayName}</h2>

        <div className="product-card__footer">
          <div className="product-card__price-box">
            <span className="product-card__price">{formatPriceCRC(precioFinal)}</span>
            <span className="product-card__iva">IVA incl.</span>
          </div>

          <div className="product-card__actions">
            <button
              type="button"
              className="product-card__add-btn"
              onClick={(e) => onQuickAdd(e, product)}
              disabled={estaAgotado}
              aria-label={`Añadir ${displayName} al carrito`}
            >
              <ShoppingCart size={15} aria-hidden="true" />
              <span>{tAnadir}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/* --- Sub-Component: Catalog Toolbar & Filters --- */
interface ToolbarProps {
  busqueda: string;
  setBusqueda: (v: string) => void;
  sortOption: SortOption;
  setSortOption: (v: SortOption) => void;
  categoria: string;
  setCategoria: (v: string) => void;
  subcategoria: string;
  setSubcategoria: (v: string) => void;
  categorias: string[];
  subcategoriasActivas: string[];
  hayFiltros: boolean;
  onLimpiarFiltros: () => void;
  tBuscar: string;
  tOrdenar: string;
  tTodas: string;
  tLimpiar: string;
}

const ProductFilterToolbar: React.FC<ToolbarProps> = ({
  busqueda,
  setBusqueda,
  sortOption,
  setSortOption,
  categoria,
  setCategoria,
  subcategoria,
  setSubcategoria,
  categorias,
  subcategoriasActivas,
  hayFiltros,
  onLimpiarFiltros,
  tBuscar,
  tOrdenar,
  tTodas,
  tLimpiar,
}) => (
  <section className="products-toolbar" aria-label="Controles de búsqueda y filtros">
    <div className="products-toolbar__search-row">
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

    <div className="products-categories-bar" aria-label="Categorías de productos">
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
          className="products-cat-pill products-cat-pill--clear"
          onClick={onLimpiarFiltros}
          aria-label="Restablecer todos los filtros"
        >
          <X size={13} aria-hidden="true" />
          <span>{tLimpiar}</span>
        </button>
      ) : null}
    </div>

    {subcategoriasActivas.length > 0 ? (
      <div className="products-subcategories-bar" aria-label="Subcategorías">
        <button
          type="button"
          className={`products-sub-pill${subcategoria === 'todas' ? ' is-active' : ''}`}
          onClick={() => setSubcategoria('todas')}
        >
          Todas
        </button>
        {subcategoriasActivas.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`products-sub-pill${
              subcategoria.toLowerCase() === sub.toLowerCase() ? ' is-active' : ''
            }`}
            onClick={() =>
              setSubcategoria(subcategoria.toLowerCase() === sub.toLowerCase() ? 'todas' : sub)
            }
          >
            {sub}
          </button>
        ))}
      </div>
    ) : null}
  </section>
);

/* --- Sub-Component: Pagination Controls --- */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="products-pagination" aria-label="Paginación del catálogo">
      <button
        type="button"
        className="products-pagination__btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Página anterior"
      >
        Anterior
      </button>

      <div className="products-pagination__pages">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={`page-${page}`}
            type="button"
            className={`products-pagination__num${page === currentPage ? ' is-active' : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="products-pagination__btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </nav>
  );
};

const EMPTY_PRODUCTS: ProductItem[] = [];

/* --- Main Products Page --- */
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
    const disp = clasificarDisponibilidad(product);
    const stockEfectivo = Math.max(
      Number(disp?.stock) || 0,
      Number(product?.stockTotal) || 0,
      Number(product?.stock) || 0,
      Number(product?.stockDisponible) || 0,
      disp?.codigo !== 'agotado' ? 10 : 0,
    );

    addProductToCart({
      ...product,
      id: product.id,
      nombre: product.nombre,
      price: Number(product.precioNormal ?? product.price ?? 0) || 0,
      priceWithoutIva: Number(product.precioNormal ?? product.price ?? 0) || 0,
      units: 1,
      stock: stockEfectivo,
      stockTotal: stockEfectivo,
      stockDisponible: stockEfectivo,
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

        <ProductFilterToolbar
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          sortOption={sortOption}
          setSortOption={setSortOption}
          categoria={categoria}
          setCategoria={setCategoria}
          subcategoria={subcategoria}
          setSubcategoria={setSubcategoria}
          categorias={categorias}
          subcategoriasActivas={subcategoriasActivas}
          hayFiltros={hayFiltros}
          onLimpiarFiltros={limpiarFiltros}
          tBuscar={tBuscar}
          tOrdenar={tOrdenar}
          tTodas={tTodas}
          tLimpiar={tLimpiar}
        />

        {currentProducts.length > 0 ? (
          <section className="products-grid" aria-label="Listado de productos">
            {currentProducts.map((product) => {
              const displayName = nombrePorId.get(product.id) || product.nombre;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  displayName={displayName}
                  tDisponible={tDisponible}
                  tSinStock={tSinStock}
                  tAnadir={tAnadir}
                  onQuickAdd={handleQuickAdd}
                />
              );
            })}
          </section>
        ) : (
          <section className="products-empty" aria-live="polite">
            <div className="products-empty__card">
              <Coffee size={44} className="products-empty__icon" aria-hidden="true" />
              <h2 className="products-empty__title">No encontramos productos</h2>
              <p className="products-empty__text">
                No hay coincidencias para los filtros seleccionados. Probá con otro término o restablecé las categorías.
              </p>
              {hayFiltros ? (
                <button
                  type="button"
                  className="products-empty__btn"
                  onClick={limpiarFiltros}
                >
                  <X size={15} aria-hidden="true" />
                  {tLimpiar}
                </button>
              ) : null}
            </div>
          </section>
        )}

        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>
    </PublicPageGate>
  );
};

export default Products;
