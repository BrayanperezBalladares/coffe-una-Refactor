import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ShoppingCart, Search, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SALE_STATUSES, PAYMENT_METHODS, LOCATIONS } from "@/lib/constants";
import moment from "moment";

const STOCK_FIELDS = {
  bodega_central: "total_stock",
  punto_venta_1: "stock_pv1",
  punto_venta_2: "stock_pv2",
  punto_venta_3: "stock_pv3",
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [saleItems, setSaleItems] = useState([{ product_id: "", quantity: 1 }]);
  const [form, setForm] = useState({
    sale_type: "fisica", location: "punto_venta_1", payment_method: "efectivo",
    responsible: "", customer_name: "", customer_email: "", customer_phone: "",
    invoice_number: "", pickup_location: "", notes: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sls, prods] = await Promise.all([
        base44.entities.Sale.list("-created_date", 200),
        base44.entities.Product.list("-created_date", 200),
      ]);
      setSales(sls);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addItem = () => setSaleItems([...saleItems, { product_id: "", quantity: 1 }]);
  const removeItem = (idx) => setSaleItems(saleItems.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    const updated = [...saleItems];
    updated[idx][field] = value;
    setSaleItems(updated);
  };

  const calcTotal = () => {
    return saleItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return sum + (product?.price || 0) * (item.quantity || 0);
    }, 0);
  };

  const handleSave = async () => {
    const validItems = saleItems.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0 || !form.responsible) {
      toast({ title: "Error", description: "Agrega al menos un producto y responsable", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const items = validItems.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return {
          product_id: item.product_id,
          product_name: product.name,
          quantity: Number(item.quantity),
          unit_price: product.price || 0,
          subtotal: (product.price || 0) * Number(item.quantity),
        };
      });

      const sale = await base44.entities.Sale.create({
        ...form,
        items,
        total: items.reduce((s, i) => s + i.subtotal, 0),
        sale_date: new Date().toISOString(),
        status: form.sale_type === "fisica" ? "entregado" : "pendiente",
      });

      // Deduct stock and create movements
      for (const item of items) {
        const product = products.find((p) => p.id === item.product_id);
        const stockField = form.location === "web" ? "total_stock" : STOCK_FIELDS[form.location];
        await base44.entities.Product.update(product.id, {
          [stockField]: Math.max(0, (product[stockField] || 0) - item.quantity),
        });
        await base44.entities.InventoryMovement.create({
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: "venta",
          quantity: item.quantity,
          location_from: form.location === "web" ? "bodega_central" : form.location,
          responsible: form.responsible,
          sale_id: sale.id,
          movement_date: new Date().toISOString(),
          exit_reason: form.sale_type === "web" ? "venta_web" : "venta_fisica",
        });
      }

      toast({ title: "Venta registrada" });
      setDialogOpen(false);
      setSaleItems([{ product_id: "", quantity: 1 }]);
      setForm({
        sale_type: "fisica", location: "punto_venta_1", payment_method: "efectivo",
        responsible: "", customer_name: "", customer_email: "", customer_phone: "",
        invoice_number: "", pickup_location: "", notes: "",
      });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo registrar la venta", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const updateStatus = async (sale, newStatus) => {
    await base44.entities.Sale.update(sale.id, { status: newStatus });
    toast({ title: `Estado actualizado a ${SALE_STATUSES[newStatus]?.label}` });
    loadData();
  };

  const filtered = sales.filter((s) => {
    const matchSearch = s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.responsible?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || s.sale_type === filterType;
    return matchSearch && matchType;
  });

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
        title="Control de Ventas"
        description="Ventas web y físicas"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nueva Venta
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Buscar por cliente o responsable..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="fisica">Física</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas" description="Registra la primera venta" />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Ubicación</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 text-stone-600">{moment(s.sale_date || s.created_date).format("DD/MM/YY HH:mm")}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.sale_type === "web" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {s.sale_type === "web" ? "Web" : "Física"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-800">{s.customer_name || "—"}</td>
                    <td className="py-3 px-4 text-stone-500 text-xs">
                      {s.location === "web" ? "Web" : LOCATIONS[s.location] || s.location}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">₡{s.total?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Select value={s.status} onValueChange={(v) => updateStatus(s, v)}>
                        <SelectTrigger className="h-7 text-xs w-[130px]">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${SALE_STATUSES[s.status]?.color || ""}`}>
                            {SALE_STATUSES[s.status]?.label || s.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SALE_STATUSES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => { setSelectedSale(s); setDetailOpen(true); }}
                        className="p-1.5 hover:bg-stone-100 rounded-lg">
                        <Eye className="w-4 h-4 text-stone-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Venta</Label>
                <Select value={form.sale_type} onValueChange={(v) => setForm({ ...form, sale_type: v, location: v === "web" ? "web" : "punto_venta_1" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Punto de Venta</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {form.sale_type === "web" ? (
                      <SelectItem value="web">Web</SelectItem>
                    ) : (
                      Object.entries(LOCATIONS).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0">Productos</Label>
                <button onClick={addItem} className="text-xs text-amber-700 hover:underline font-medium">+ Agregar</button>
              </div>
              <div className="space-y-2">
                {saleItems.map((item, idx) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select value={item.product_id} onValueChange={(v) => updateItem(idx, "product_id", v)}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="Producto" /></SelectTrigger>
                          <SelectContent>
                            {products.filter((p) => p.status === "activo" && p.category_type === "venta").map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name} - ₡{p.price?.toLocaleString()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input type="number" className="w-20" value={item.quantity} min={1}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                      {saleItems.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs px-2 py-2">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-right mt-2">
                <span className="text-lg font-bold text-amber-700">Total: ₡{calcTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Método de Pago</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsable *</Label>
                <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Factura (opcional)</Label>
              <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Registrando..." : "Registrar Venta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-stone-400">Tipo:</span><p className="font-medium">{selectedSale.sale_type === "web" ? "Web" : "Física"}</p></div>
                <div><span className="text-stone-400">Fecha:</span><p className="font-medium">{moment(selectedSale.sale_date).format("DD/MM/YYYY HH:mm")}</p></div>
                <div><span className="text-stone-400">Ubicación:</span><p className="font-medium">{LOCATIONS[selectedSale.location] || selectedSale.location}</p></div>
                <div><span className="text-stone-400">Pago:</span><p className="font-medium">{PAYMENT_METHODS[selectedSale.payment_method]}</p></div>
                <div><span className="text-stone-400">Responsable:</span><p className="font-medium">{selectedSale.responsible}</p></div>
                <div><span className="text-stone-400">Cliente:</span><p className="font-medium">{selectedSale.customer_name || "—"}</p></div>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-stone-500 mb-2">Productos</p>
                {(selectedSale.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-stone-100 last:border-0">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span className="font-medium">₡{item.subtotal?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-1 font-bold text-amber-700">
                  <span>Total</span>
                  <span>₡{selectedSale.total?.toLocaleString()}</span>
                </div>
              </div>
              {selectedSale.notes && (
                <div><span className="text-stone-400">Notas:</span><p>{selectedSale.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}