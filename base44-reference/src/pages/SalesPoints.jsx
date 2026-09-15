import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Store, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

export default function SalesPoints() {
  const [points, setPoints] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "punto_venta_1", location: "", responsible: "", status: "activo" });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pts, prods] = await Promise.all([
        base44.entities.SalesPoint.list("-created_date", 10),
        base44.entities.Product.list("-created_date", 200),
      ]);
      setPoints(pts);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStockField = (code) => {
    const map = { punto_venta_1: "stock_pv1", punto_venta_2: "stock_pv2", punto_venta_3: "stock_pv3" };
    return map[code];
  };

  const getPointStock = (code) => {
    const field = getStockField(code);
    return products.reduce((sum, p) => sum + (p[field] || 0), 0);
  };

  const getPointProducts = (code) => {
    const field = getStockField(code);
    return products.filter((p) => (p[field] || 0) > 0);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast({ title: "Error", description: "Nombre y código son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await base44.entities.SalesPoint.update(selected.id, form);
        toast({ title: "Punto actualizado" });
      } else {
        await base44.entities.SalesPoint.create(form);
        toast({ title: "Punto creado" });
      }
      setDialogOpen(false);
      setForm({ name: "", code: "punto_venta_1", location: "", responsible: "", status: "activo" });
      setSelected(null);
      loadData();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este punto de venta?")) return;
    await base44.entities.SalesPoint.delete(id);
    toast({ title: "Punto eliminado" });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Puntos de Venta"
        description="Administra las ubicaciones de venta"
        action={
          <Button onClick={() => { setSelected(null); setForm({ name: "", code: "punto_venta_1", location: "", responsible: "", status: "activo" }); setDialogOpen(true); }}
            className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Punto
          </Button>
        }
      />

      {points.length === 0 ? (
        <EmptyState icon={Store} title="Sin puntos de venta" description="Registra tus puntos de venta" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {points.map((point) => {
            const stockCount = getPointStock(point.code);
            const pointProducts = getPointProducts(point.code);
            return (
              <div key={point.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{point.name}</h3>
                        <p className="text-amber-100 text-xs">{point.location || "Sin ubicación"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      point.status === "activo" ? "bg-white/20 text-white" : "bg-red-500/20 text-red-100"
                    }`}>
                      {point.status === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-stone-800">{stockCount}</p>
                      <p className="text-xs text-stone-400">unidades en stock</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-stone-600">{pointProducts.length}</p>
                      <p className="text-xs text-stone-400">productos</p>
                    </div>
                  </div>
                  {point.responsible && (
                    <p className="text-xs text-stone-500 mb-3">Responsable: <span className="font-medium">{point.responsible}</span></p>
                  )}
                  {pointProducts.length > 0 && (
                    <div className="bg-stone-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-stone-500 mb-2">Productos en stock:</p>
                      {pointProducts.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex justify-between text-xs py-0.5">
                          <span className="text-stone-600">{p.name}</span>
                          <span className="font-medium">{p[getStockField(point.code)]}</span>
                        </div>
                      ))}
                      {pointProducts.length > 4 && (
                        <p className="text-xs text-stone-400 mt-1">+{pointProducts.length - 4} más</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1 pt-3 border-t border-stone-100">
                    <button onClick={() => { setSelected(point); setForm({ name: point.name, code: point.code, location: point.location || "", responsible: point.responsible || "", status: point.status || "activo" }); setDialogOpen(true); }}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-stone-500" />
                    </button>
                    <button onClick={() => handleDelete(point.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? "Editar Punto de Venta" : "Nuevo Punto de Venta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Código</Label>
              <Select value={form.code} onValueChange={(v) => setForm({ ...form, code: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="punto_venta_1">Punto de Venta 1</SelectItem>
                  <SelectItem value="punto_venta_2">Punto de Venta 2</SelectItem>
                  <SelectItem value="punto_venta_3">Punto de Venta 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ubicación</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Responsable</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} /></div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Guardando..." : selected ? "Actualizar" : "Crear Punto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}