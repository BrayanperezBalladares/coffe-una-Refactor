import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FlaskConical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import moment from "moment";

export default function CoffeeLots() {
  const [lots, setLots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lot_number: "", product_id: "", production_date: "", expiration_date: "",
    quantity_produced: "", notes: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lts, prods] = await Promise.all([
        base44.entities.CoffeeLot.list("-created_date", 100),
        base44.entities.Product.list("-created_date", 200),
      ]);
      setLots(lts);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ lot_number: "", product_id: "", production_date: "", expiration_date: "", quantity_produced: "", notes: "" });
    setSelected(null);
  };

  const handleSave = async () => {
    if (!form.lot_number || !form.product_id || !form.production_date || !form.quantity_produced) {
      toast({ title: "Error", description: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find((p) => p.id === form.product_id);
      const qty = Number(form.quantity_produced);
      const data = {
        ...form,
        product_name: product.name,
        quantity_produced: qty,
        quantity_remaining: qty,
        status: "activo",
      };

      if (selected) {
        await base44.entities.CoffeeLot.update(selected.id, data);
        toast({ title: "Lote actualizado" });
      } else {
        await base44.entities.CoffeeLot.create(data);
        // Also create entry movement and update stock
        await base44.entities.InventoryMovement.create({
          product_id: form.product_id,
          product_name: product.name,
          movement_type: "entrada",
          entry_reason: "produccion",
          quantity: qty,
          location_from: "bodega_central",
          responsible: "Sistema - Lote " + form.lot_number,
          movement_date: new Date().toISOString(),
        });
        await base44.entities.Product.update(product.id, {
          total_stock: (product.total_stock || 0) + qty,
        });
        toast({ title: "Lote creado y stock actualizado" });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este lote?")) return;
    await base44.entities.CoffeeLot.delete(id);
    toast({ title: "Lote eliminado" });
    loadData();
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    return moment(date).diff(moment(), "days") <= 30 && moment(date).isAfter(moment());
  };

  const isExpired = (date) => {
    if (!date) return false;
    return moment(date).isBefore(moment());
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
        title="Lotes de Café"
        description="Gestión de producción por lotes"
        action={
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Lote
          </Button>
        }
      />

      {lots.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Sin lotes" description="Registra tu primera producción de café" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <div key={lot.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${
              isExpired(lot.expiration_date) ? "border-red-200" :
              isExpiringSoon(lot.expiration_date) ? "border-amber-200" :
              "border-stone-200"
            }`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-stone-400">Lote</p>
                    <h3 className="font-bold text-stone-900 text-lg">{lot.lot_number}</h3>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    lot.status === "activo" ? "bg-emerald-50 text-emerald-700" :
                    lot.status === "agotado" ? "bg-stone-100 text-stone-500" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {lot.status === "activo" ? "Activo" : lot.status === "agotado" ? "Agotado" : "Vencido"}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mb-3">{lot.product_name}</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-stone-500">
                  <div>
                    <p className="text-stone-400">Producción</p>
                    <p className="font-medium text-stone-700">{moment(lot.production_date).format("DD/MM/YYYY")}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Vencimiento</p>
                    <p className={`font-medium ${
                      isExpired(lot.expiration_date) ? "text-red-600" :
                      isExpiringSoon(lot.expiration_date) ? "text-amber-600" :
                      "text-stone-700"
                    }`}>
                      {lot.expiration_date ? moment(lot.expiration_date).format("DD/MM/YYYY") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">Producido</p>
                    <p className="font-medium text-stone-700">{lot.quantity_produced}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Restante</p>
                    <p className="font-medium text-stone-700">{lot.quantity_remaining}</p>
                  </div>
                </div>
                {lot.notes && <p className="text-xs text-stone-400 mt-3 line-clamp-2">{lot.notes}</p>}
                <div className="flex gap-1 mt-4 pt-3 border-t border-stone-100">
                  <button onClick={() => {
                    setSelected(lot);
                    setForm({
                      lot_number: lot.lot_number, product_id: lot.product_id,
                      production_date: lot.production_date, expiration_date: lot.expiration_date || "",
                      quantity_produced: lot.quantity_produced, notes: lot.notes || "",
                    });
                    setDialogOpen(true);
                  }} className="p-2 hover:bg-stone-100 rounded-lg"><Edit2 className="w-4 h-4 text-stone-500" /></button>
                  <button onClick={() => handleDelete(lot.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? "Editar Lote" : "Nuevo Lote de Producción"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Número de Lote *</Label><Input value={form.lot_number} onChange={(e) => setForm({ ...form, lot_number: e.target.value })} placeholder="LOTE-2024-001" /></div>
            <div>
              <Label>Producto *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {products.filter((p) => p.category_type === "venta").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha de Producción *</Label><Input type="date" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} /></div>
              <div><Label>Fecha de Vencimiento</Label><Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
            </div>
            <div><Label>Cantidad Producida *</Label><Input type="number" value={form.quantity_produced} onChange={(e) => setForm({ ...form, quantity_produced: e.target.value })} /></div>
            <div><Label>Observaciones</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Guardando..." : selected ? "Actualizar" : "Crear Lote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}