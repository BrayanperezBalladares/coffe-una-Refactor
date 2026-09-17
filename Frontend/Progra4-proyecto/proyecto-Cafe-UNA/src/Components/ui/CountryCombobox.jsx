import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe, X } from 'lucide-react';
import { PAISES } from '../../lib/paises';
import { cn } from '../../lib/utils';
import { ST } from '../T/ST';

export function CountryCombobox({
  value,
  onChange,
  id = 'pais',
  name = 'pais',
  placeholder = 'Seleccioná un país...',
  searchPlaceholder = 'Escribí para buscar país...',
  disabled = false,
  error = false,
  ariaLabel = 'País de procedencia',
  ariaDescribedBy,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filtrado de países en tiempo real (insensible a acentos y mayúsculas)
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return PAISES;
    const term = search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return PAISES.filter((pais) => {
      const normalizado = pais
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normalizado.includes(term);
    });
  }, [search]);

  // Manejo de foco automático en el input de búsqueda al abrir
  useEffect(() => {
    if (open) {
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearch('');
    }
  }, [open]);

  // Cierre al hacer click fuera
  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [open]);

  // Teclado para navegar la lista
  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCountries.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries[highlightedIndex]) {
        handleSelect(filteredCountries[highlightedIndex]);
      }
    }
  };

  // Scroll automático hacia el elemento destacado
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, open]);

  const handleSelect = (pais) => {
    onChange?.(pais);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full country-combobox-root', className)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 text-left',
          error && 'border-red-500 focus:ring-red-400 focus:border-red-500',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">
            {value ? <ST>{value}</ST> : <ST>{placeholder}</ST>}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-50 transition-transform duration-200',
            open && 'transform rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[240px] rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 p-1.5 backdrop-blur-md"
          role="dialog"
          aria-modal="false"
        >
          {/* Barra de búsqueda interna */}
          <div className="relative mb-1 flex items-center border-b border-border/70 px-2 pb-1.5 pt-0.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lista con scroll suave */}
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Opciones de países"
            className="max-h-56 overflow-y-auto space-y-0.5 overscroll-contain py-0.5 pr-0.5"
            tabIndex={-1}
          >
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                <ST>No se encontró ningún país coincidente.</ST>
              </li>
            ) : (
              filteredCountries.map((pais, idx) => {
                const isSelected = value === pais;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <li
                    key={pais}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm cursor-pointer transition-colors select-none',
                      isHighlighted ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50',
                      isSelected && 'font-semibold text-primary'
                    )}
                    onClick={() => handleSelect(pais)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <span className="truncate">
                      <ST>{pais}</ST>
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CountryCombobox;
