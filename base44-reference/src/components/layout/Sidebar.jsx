import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowRightLeft,
  ShoppingCart,
  Store,
  FlaskConical,
  Bell,
  BarChart3,
  Menu,
  X,
  LogOut,
  Coffee,
  ChevronDown,
  ChevronRight,
  Plug,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Panel Principal", path: "/", icon: LayoutDashboard },
  { label: "Catálogo de Productos", path: "/products", icon: Package },
  { label: "Categorías", path: "/categories", icon: Tags },
  {
    label: "Inventario",
    icon: ArrowRightLeft,
    children: [
      { label: "Movimientos", path: "/movements" },
      { label: "Traslados", path: "/transfers" },
    ],
  },
  { label: "Ventas", path: "/sales", icon: ShoppingCart },
  { label: "Puntos de Venta", path: "/sales-points", icon: Store },
  { label: "Lotes de Café", path: "/lots", icon: FlaskConical },
  { label: "Alertas", path: "/alerts", icon: Bell },
  { label: "Reportes", path: "/reports", icon: BarChart3 },
  { label: "Conectar IA", path: "/connect", icon: Plug },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState(["Inventario"]);

  const toggleExpanded = (label) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (path) => location.pathname === path;

  const renderNavItem = (item) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.label);
      const hasActiveChild = item.children.some((c) => isActive(c.path));
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              hasActiveChild
                ? "bg-amber-900/20 text-amber-100"
                : "text-stone-300 hover:bg-stone-700/50 hover:text-white"
            }`}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-8 mt-1 space-y-0.5">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive(child.path)
                      ? "bg-amber-700/30 text-amber-200 font-medium"
                      : "text-stone-400 hover:bg-stone-700/50 hover:text-white"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive(item.path)
            ? "bg-amber-700/30 text-amber-200 shadow-sm"
            : "text-stone-300 hover:bg-stone-700/50 hover:text-white"
        }`}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-stone-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Café-UNA</h1>
            <p className="text-[11px] text-stone-400 font-medium">Inventario & Ventas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="p-3 border-t border-stone-700/50">
        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:bg-stone-700/50 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-stone-800 rounded-lg shadow-lg text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-stone-800 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-stone-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}