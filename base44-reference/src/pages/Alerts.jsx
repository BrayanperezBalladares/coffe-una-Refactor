import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Package, Clock, Store, Bell } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { LOCATIONS } from "@/lib/constants";
import moment from "moment";

export default function Alerts() {
  const [products, setProducts] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prods, lts] = await Promise.all([
        base44.entities.Product.list("-created_date", 200),
        base44.entities.CoffeeLot.list("-created_date", 100),
      ]);
      setProducts(prods);
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

  const active = products.filter((p) => p.status === "activo");
  const lowStock = active.filter((p) => p.min_stock > 0 && p.total_stock > 0 && p.total_stock <= p.min_stock);
  const outOfStock = active.filter((p) => p.total_stock <= 0);
  const pvNeedRestock = active.filter((p) => {
    const pvTotal = (p.stock_pv1 || 0) + (p.stock_pv2 || 0) + (p.stock_pv3 || 0);
    return p.min_stock > 0 && pvTotal <= p.min_stock && (p.total_stock || 0) > 0;
  });
  const expiringSoon = lots.filter((l) => {
    if (!l.expiration_date || l.status === "agotado") return false;
    const days = moment(l.expiration_date).diff(moment(), "days");
    return days >= 0 && days <= 30;
  });
  const expired = lots.filter((l) => {
    if (!l.expiration_date) return false;
    return moment(l.expiration_date).isBefore(moment()) && l.status !== "agotado";
  });

  const totalAlerts = lowStock.length + outOfStock.length + pvNeedRestock.length + expiringSoon.length + expired.length;

  return (
    <div>
      <PageHeader
        title="Alertas"
        description={`${totalAlerts} alerta${totalAlerts !== 1 ? "s" : ""} activa${totalAlerts !== 1 ? "s" : ""}`}
      />

      {totalAlerts === 0 ? (
        <EmptyState icon={Bell} title="Sin alertas" description="Todo el inventario se encuentra en orden" />
      ) : (
        <div className="space-y-6">
          {outOfStock.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Productos Agotados ({outOfStock.length})
              </h3>
              <div className="space-y-2">
                {outOfStock.map((p) => (
                  <div key={p.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg"><Package className="w-5 h-5 text-red-600" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">{p.code}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">Stock: 0</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Stock Bajo ({lowStock.length})
              </h3>
              <div className="space-y-2">
                {lowStock.map((p) => (
                  <div key={p.id} className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">Mínimo: {p.min_stock} {p.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">Stock: {p.total_stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pvNeedRestock.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Store className="w-4 h-4" /> Puntos de Venta Requieren Reposición ({pvNeedRestock.length})
              </h3>
              <div className="space-y-2">
                {pvNeedRestock.map((p) => (
                  <div key={p.id} className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg"><Store className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        PV1: {p.stock_pv1 || 0} | PV2: {p.stock_pv2 || 0} | PV3: {p.stock_pv3 || 0}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">Bodega: {p.total_stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiringSoon.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Próximos a Vencer ({expiringSoon.length})
              </h3>
              <div className="space-y-2">
                {expiringSoon.map((l) => (
                  <div key={l.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">Lote {l.lot_number}</p>
                      <p className="text-xs text-stone-500">{l.product_name}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600">
                      Vence: {moment(l.expiration_date).format("DD/MM/YY")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expired.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Productos Vencidos ({expired.length})
              </h3>
              <div className="space-y-2">
                {expired.map((l) => (
                  <div key={l.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg"><Clock className="w-5 h-5 text-red-600" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">Lote {l.lot_number}</p>
                      <p className="text-xs text-stone-500">{l.product_name}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      Venció: {moment(l.expiration_date).format("DD/MM/YY")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}