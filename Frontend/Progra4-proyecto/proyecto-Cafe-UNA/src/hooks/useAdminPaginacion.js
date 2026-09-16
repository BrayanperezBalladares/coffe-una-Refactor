import { useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 10;
const EMPTY_ITEMS = [];

/**
 * Firma estable del listado para no resetear la página en cada render
 * cuando el caller pasa un array nuevo con el mismo contenido.
 */
function firmaItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "0";
  const primero = items[0];
  const ultimo = items[items.length - 1];
  const idDe = (item) =>
    item == null
      ? ""
      : typeof item === "object"
        ? String(item.id ?? item.Id ?? item.codigo ?? item.clave ?? item.numero ?? "")
        : String(item);
  return `${items.length}:${idDe(primero)}:${idDe(ultimo)}`;
}

export function useAdminPaginacion(items = EMPTY_ITEMS, pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const firma = firmaItems(items);
  const [prevFirma, setPrevFirma] = useState(() => firma);
  const [prevPageSize, setPrevPageSize] = useState(pageSize);

  if (firma !== prevFirma || pageSize !== prevPageSize) {
    setPrevFirma(firma);
    setPrevPageSize(pageSize);
    setPage(1);
  }

  const total = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageItems,
    total,
    totalPages,
    showPagination: total > pageSize,
  };
}
