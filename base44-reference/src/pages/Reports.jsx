import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { CATEGORY_TYPES, LOCATIONS, MOVEMENT_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import moment from "moment";

const COLORS = ["#d97706", "#059669", "#7c3aed", "#2563eb", "#78716c", "#dc2626", "#0891b2"];

export default function Reports() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(moment().subtract(30, "days").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prods, movs, sls, lts] = await Promise.all([
        base44.entities.Product.list("-created_date", 500),
        base44.entities.InventoryMovement.list("-created_date", 500),
        base44.entities.Sale.list("-created_date", 500),
        base44.entities.CoffeeLot.list("-created_date", 100),
      ]);
      setProducts(prods);
      setMovements(movs);
      setSales(sls);
      setLots(lts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredSales = sales.filter((s) => {
    const d = moment(s.sale_date || s.created_date);
    return d.isSameOrAfter(dateFrom, "day") && d.isSameOrBefore(dateTo, "day") && s.status !== "cancelado";
  });

  const filteredMovements = movements.filter((m) => {
    const d = moment(m.movement_date || m.created_date);
    return d.isSameOrAfter(dateFrom, "day") && d.isSameOrBefore(dateTo, "day");
  });

  // Sales by period
  const salesByDay = {};
  filteredSales.forEach((s) => {
    const day = moment(s.sale_date || s.created_date).format("DD/MM");
    salesByDay[day] = (salesByDay[day] || 0) + (s.total || 0);
  });
  const salesChartData = Object.entries(salesByDay).map(([day, total]) => ({ day, total }));

  // Sales by location
  const salesByLocation = {};
  filteredSales.forEach((s) => {
    const loc = s.location === "web" ? "Web" : LOCATIONS[s.location] || s.location;
    salesByLocation[loc] = (salesByLocation[loc] || 0) + (s.total || 0);
  });
  const locationChartData = Object.entries(salesByLocation).map(([name, value]) => ({ name, value }));

  // Top products
  const productSales = {};
  filteredSales.forEach((s) => {
    (s.items || []).forEach((item) => {
      productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, qty }));

  // Movements by type
  const movsByType = {};
  filteredMovements.forEach((m) => {
    const t = MOVEMENT_TYPES[m.movement_type]?.label || m.movement_type;
    movsByType[t] = (movsByType[t] || 0) + 1;
  });
  const movsChartData = Object.entries(movsByType).map(([name, value]) => ({ name, value }));

  // Low stock
  const lowStockProducts = products
    .filter((p) => p.status === "activo" && p.min_stock > 0 && p.total_stock <= p.min_stock)
    .sort((a, b) => (a.total_stock || 0) - (b.total_stock || 0));

  // Donations
  const donations = products.filter((p) => p.category_type === "donacion");

  // Agricultural supplies usage
  const agriMovements = filteredMovements.filter((m) => {
    const prod = products.find((p) => p.id === m.product_id);
    return prod?.category_type === "insumo_agricola" && (m.movement_type === "salida" || m.movement_type === "consumo_interno");
  });

  const totalSalesAmount = filteredSales.reduce((s, sale) => s + (sale.total || 0), 0);
  const totalSalesCount = filteredSales.length;

  return (
    <div>
      <PageHeader title="Reportes" description="Análisis y estadísticas de Café-UNA" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-end">
        <div>
          <Label className="text-xs text-stone-500">Desde</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        </div>
        <div>
          <Label className="text-xs text-stone-500">Hasta</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-sm">
          <span className="text-stone-500">Ventas del período: </span>
          <span className="font-bold text-amber-700">₡{totalSalesAmount.toLocaleString()}</span>
          <span className="text-stone-400 ml-2">({totalSalesCount} ventas)</span>
        </div>
      </div>

      <Tabs defaultValue="ventas" className="space-y-6">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="otros">Donaciones / Insumos</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Ventas por Período</h3>
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesChartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => `₡${val.toLocaleString()}`} />
                    <Line type="monotone" dataKey="total" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-stone-400 py-8 text-sm">Sin datos en este período</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Ventas por Punto de Venta</h3>
              {locationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={locationChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ₡${value.toLocaleString()}`}>
                      {locationChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `₡${val.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-stone-400 py-8 text-sm">Sin datos</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Productos Más Vendidos</h3>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#d97706" radius={[0, 4, 4, 0]} name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-stone-400 py-8 text-sm">Sin datos</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Inventario Actual</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {products.filter((p) => p.status === "activo").map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.code} · {CATEGORY_TYPES[p.category_type]?.label}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${(p.total_stock || 0) <= (p.min_stock || 0) && p.min_stock > 0 ? "text-red-600" : "text-stone-700"}`}>
                        {p.total_stock || 0} {p.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-red-700 mb-4">Productos con Bajo Stock ({lowStockProducts.length})</h3>
              {lowStockProducts.length === 0 ? (
                <p className="text-center text-stone-400 py-8 text-sm">Todo el stock está en orden</p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{p.name}</p>
                        <p className="text-xs text-stone-400">Mínimo: {p.min_stock}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">{p.total_stock || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movimientos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Movimientos por Tipo</h3>
              {movsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={movsChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-stone-400 py-8 text-sm">Sin movimientos</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Historial de Movimientos ({filteredMovements.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredMovements.slice(0, 20).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${MOVEMENT_TYPES[m.movement_type]?.color || ""}`}>
                        {MOVEMENT_TYPES[m.movement_type]?.label}
                      </span>
                      <span className="text-sm text-stone-700">{m.product_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{m.quantity}</p>
                      <p className="text-xs text-stone-400">{moment(m.movement_date || m.created_date).format("DD/MM")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="otros" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-purple-700 mb-4">Donaciones Recibidas ({donations.length})</h3>
              {donations.length === 0 ? (
                <p className="text-center text-stone-400 py-8 text-sm">Sin donaciones registradas</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {donations.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-stone-50">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{d.name}</p>
                        <p className="text-xs text-stone-400">
                          {d.donor && `Donante: ${d.donor}`}
                          {d.donation_date && ` · ${moment(d.donation_date).format("DD/MM/YYYY")}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-stone-600">{d.total_stock || 0} {d.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-emerald-700 mb-4">Consumo de Insumos Agrícolas ({agriMovements.length} movimientos)</h3>
              {agriMovements.length === 0 ? (
                <p className="text-center text-stone-400 py-8 text-sm">Sin consumo registrado</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {agriMovements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{m.product_name}</p>
                        <p className="text-xs text-stone-400">
                          {moment(m.movement_date || m.created_date).format("DD/MM/YYYY")} · {m.responsible}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-stone-600">-{m.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}