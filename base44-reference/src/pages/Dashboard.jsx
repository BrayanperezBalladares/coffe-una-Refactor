import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Package, ShoppingCart, AlertTriangle, TrendingUp, ArrowRightLeft, Store, Coffee, Bell
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { MOVEMENT_TYPES, LOCATIONS, SALE_STATUSES } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import moment from "moment";

const PIE_COLORS = ["#d97706", "#059669", "#7c3aed", "#2563eb", "#78716c"];

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, movs, sls] = await Promise.all([
        base44.entities.Product.list("-created_date", 200),
        base44.entities.InventoryMovement.list("-created_date", 50),
        base44.entities.Sale.list("-created_date", 50),
      ]);
      setProducts(prods);
      setMovements(movs);
      setSales(sls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.status === "activo");
  const lowStockProducts = activeProducts.filter(
    (p) => p.min_stock > 0 && p.total_stock <= p.min_stock
  );
  const outOfStock = activeProducts.filter((p) => p.total_stock <= 0);
  const totalSalesAmount = sales
    .filter((s) => s.status !== "cancelado")
    .reduce((sum, s) => sum + (s.total || 0), 0);
  const pendingSales = sales.filter(
    (s) => !["entregado", "cancelado", "retirado"].includes(s.status)
  );

  const categoryData = Object.entries(
    activeProducts.reduce((acc, p) => {
      const cat = p.category_type || "otro";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name:
      name === "venta" ? "Venta" :
      name === "insumo_agricola" ? "Insumos" :
      name === "donacion" ? "Donación" :
      name === "material_administrativo" ? "Admin" :
      name === "equipo" ? "Equipos" : name,
    value,
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, "days");
    const dayMovements = movements.filter((m) =>
      moment(m.created_date).isSame(date, "day")
    );
    return {
      day: date.format("dd"),
      entradas: dayMovements.filter((m) => m.movement_type === "entrada").length,
      salidas: dayMovements.filter(
        (m) => m.movement_type === "salida" || m.movement_type === "venta"
      ).length,
    };
  });

  return (
    <div>
      <PageHeader
        title="Panel Principal"
        description="Resumen general de Café-UNA"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Productos Activos"
          value={activeProducts.length}
          icon={Package}
          color="amber"
        />
        <StatCard
          label="Ventas Totales"
          value={`₡${totalSalesAmount.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Stock Bajo"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          color="red"
          subtitle={outOfStock.length > 0 ? `${outOfStock.length} agotados` : undefined}
        />
        <StatCard
          label="Pedidos Pendientes"
          value={pendingSales.length}
          icon={ShoppingCart}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Movimientos (últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="entradas" fill="#059669" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="salidas" fill="#d97706" radius={[4, 4, 0, 0]} name="Salidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Productos por Categoría</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-stone-400 text-sm">
              Sin datos
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-700">Últimos Movimientos</h3>
            <Link to="/movements" className="text-xs text-amber-700 hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {movements.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${MOVEMENT_TYPES[m.movement_type]?.color || ""}`}>
                    {MOVEMENT_TYPES[m.movement_type]?.label || m.movement_type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{m.product_name}</p>
                    <p className="text-xs text-stone-400">{moment(m.created_date).format("DD/MM/YY HH:mm")}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-stone-700">
                  {m.movement_type === "entrada" ? "+" : "-"}{m.quantity}
                </span>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-4">Sin movimientos recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-700">Alertas</h3>
            <Link to="/alerts" className="text-xs text-amber-700 hover:underline font-medium">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                <div className="p-1.5 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">{p.name}</p>
                  <p className="text-xs text-stone-400">
                    Stock: {p.total_stock} / Mínimo: {p.min_stock}
                  </p>
                </div>
              </div>
            ))}
            {outOfStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                <div className="p-1.5 bg-red-50 rounded-lg">
                  <Package className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">{p.name}</p>
                  <p className="text-xs text-red-500 font-medium">Agotado</p>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && outOfStock.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-4">Sin alertas activas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}