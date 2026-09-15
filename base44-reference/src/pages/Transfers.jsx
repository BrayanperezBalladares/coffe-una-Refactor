import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { LOCATIONS } from "@/lib/constants";
import moment from "moment";

const STOCK_FIELDS = {
  bodega_central: "total_stock",
  punto_venta_1: "stock_pv1",
  punto_venta_2: "stock_pv2",
  punto_venta_3: "stock_pv3",
};

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "", quantity: "", location_from: "bodega_central",
    location_to: "punto_venta_1", responsible: "", notes: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [movs, prods] = await Promise.all([
        base44.entities.InventoryMovement.filter({ movement_type: "traslado" }, "-created_date", 100),
        base44.entities.Product.list("-created_date", 200),
      ]);
      setTransfers(movs);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.product_id || !form.quantity || !form.responsible) {
      toast({ title: "Error", description: "Todos los campos obligatorios deben completarse", variant: "destructive" });
      return;
    }
    if (form.location_from === form.location_to) {
      toast({ title: "Error", description: "Origen y destino deben ser diferentes", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find((p) => p.id === form.product_id);
      const qty = Number(form.quantity);
      const fromField = STOCK_FIELDS[form.location_from];
      const toField = STOCK_FIELDS[form.location_to];
      const currentFrom = product[fromField] || 0;

      if (qty > currentFrom) {
        toast({ title: "Error", description: `Stock insuficiente en ${LOCATIONS[form.location_from]}. Disponible: ${currentFrom}`, variant: "destructive" });
        setSaving(false);
        return;
      }

      await base44.entities.InventoryMovement.create({
        product_id: form.product_id,
        product_name: product.name,
        movement_type: "traslado",
        quantity: qty,
        location_from: form.location_from,
        location_to: form.location_to,
        responsible: form.responsible,
        notes: form.notes,
        movement_date: new Date().toISOString(),
      });

      await base44.entities.Product.update(product.id, {
        [fromField]: currentFrom - qty,
        [toField]: (product[toField] || 0) + qty,
      });

      toast({ title: "Traslado registrado" });
      setDialogOpen(false);
      setForm({
        product_id: "", quantity: "", location_from: "bodega_central",
        location_to: "punto_venta_1", responsible: "", notes: "",
      });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo registrar el traslado", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const selectedProduct = products.find((p) => p.id === form.product_id);

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
        title="Traslados entre Ubicaciones"
        description="Mover productos entre bodega y puntos de venta"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Traslado
          </Button>
        }
      />

      {transfers.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="Sin traslados" description="Registra el primer traslado de productos" />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Producto</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Origen</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Destino</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 text-stone-600">{moment(t.movement_date || t.created_date).format("DD/MM/YY HH:mm")}</td>
                    <td className="py-3 px-4 font-medium text-stone-800">{t.product_name}</td>
                    <td className="py-3 px-4 text-stone-600">{LOCATIONS[t.location_from]}</td>
                    <td className="py-3 px-4 text-stone-600">{LOCATIONS[t.location_to]}</td>
                    <td className="py-3 px-4 font-semibold">{t.quantity}</td>
                    <td className="py-3 px-4 text-stone-600">{t.responsible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Traslado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Producto *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {products.filter((p) => p.status === "activo").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct && (
              <div className="bg-stone-50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-medium text-stone-600">Stock actual:</p>
                {Object.entries(LOCATIONS).map(([key, label]) => (
                  <p key={key} className="flex justify-between text-stone-500">
                    <span>{label}:</span>
                    <span className="font-medium">{selectedProduct[STOCK_FIELDS[key]] || 0}</span>
                  </p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origen</Label>
                <Select value={form.location_from} onValueChange={(v) => setForm({ ...form, location_from: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATIONS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destino</Label>
                <Select value={form.location_to} onValueChange={(v) => setForm({ ...form, location_to: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATIONS).filter(([key]) => key !== form.location_from).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Cantidad *</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
            </div>
            <div>
              <Label>Responsable *</Label>
              <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Registrando..." : "Registrar Traslado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}