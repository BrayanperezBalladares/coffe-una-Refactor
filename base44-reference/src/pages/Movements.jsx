import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowRightLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { MOVEMENT_TYPES, ENTRY_REASONS, EXIT_REASONS, LOCATIONS } from "@/lib/constants";
import moment from "moment";

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    product_id: "", movement_type: "entrada", entry_reason: "compra",
    exit_reason: "", quantity: "", location_from: "bodega_central",
    location_to: "", responsible: "", notes: "", lot_id: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [movs, prods] = await Promise.all([
        base44.entities.InventoryMovement.list("-created_date", 200),
        base44.entities.Product.list("-created_date", 200),
      ]);
      setMovements(movs);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.product_id || !form.quantity || !form.responsible) {
      toast({ title: "Error", description: "Producto, cantidad y responsable son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find((p) => p.id === form.product_id);
      const qty = Number(form.quantity);

      await base44.entities.InventoryMovement.create({
        ...form,
        quantity: qty,
        product_name: product.name,
        movement_date: new Date().toISOString(),
      });

      // Update stock
      let stockUpdate = {};
      if (form.movement_type === "entrada") {
        stockUpdate.total_stock = (product.total_stock || 0) + qty;
      } else if (form.movement_type === "salida" || form.movement_type === "venta" || form.movement_type === "consumo_interno") {
        stockUpdate.total_stock = Math.max(0, (product.total_stock || 0) - qty);
      } else if (form.movement_type === "ajuste") {
        stockUpdate.total_stock = qty;
      }
      if (Object.keys(stockUpdate).length > 0) {
        await base44.entities.Product.update(product.id, stockUpdate);
      }

      toast({ title: "Movimiento registrado" });
      setDialogOpen(false);
      setForm({
        product_id: "", movement_type: "entrada", entry_reason: "compra",
        exit_reason: "", quantity: "", location_from: "bodega_central",
        location_to: "", responsible: "", notes: "", lot_id: "",
      });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo registrar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = movements.filter((m) => {
    const matchSearch = m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.responsible?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.movement_type === filterType;
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
        title="Movimientos de Inventario"
        description="Registro de entradas, salidas y ajustes"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Movimiento
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Buscar por producto o responsable..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(MOVEMENT_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="Sin movimientos" description="Registra el primer movimiento de inventario" />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Producto</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Ubicación</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Responsable</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Notas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 text-stone-600">{moment(m.movement_date || m.created_date).format("DD/MM/YY HH:mm")}</td>
                    <td className="py-3 px-4 font-medium text-stone-800">{m.product_name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${MOVEMENT_TYPES[m.movement_type]?.color || ""}`}>
                        {MOVEMENT_TYPES[m.movement_type]?.label || m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{m.quantity}</td>
                    <td className="py-3 px-4 text-stone-500 text-xs">
                      {m.location_from && LOCATIONS[m.location_from]}
                      {m.location_from && m.location_to && " → "}
                      {m.location_to && LOCATIONS[m.location_to]}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{m.responsible}</td>
                    <td className="py-3 px-4 text-stone-400 text-xs max-w-[150px] truncate">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_TYPES).filter(([k]) => k !== "traslado").map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
              </div>
            </div>
            {form.movement_type === "entrada" && (
              <div>
                <Label>Razón de Entrada</Label>
                <Select value={form.entry_reason} onValueChange={(v) => setForm({ ...form, entry_reason: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTRY_REASONS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(form.movement_type === "salida" || form.movement_type === "venta") && (
              <div>
                <Label>Razón de Salida</Label>
                <Select value={form.exit_reason} onValueChange={(v) => setForm({ ...form, exit_reason: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXIT_REASONS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Ubicación</Label>
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
              <Label>Responsable *</Label>
              <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Nombre del responsable" />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Registrando..." : "Registrar Movimiento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}