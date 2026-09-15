import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Edit2, Trash2, Eye, Package, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CATEGORY_TYPES, UNITS } from "@/lib/constants";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", description: "", category_id: "", category_type: "venta",
    price: "", image_url: "", status: "activo", min_stock: 0, unit: "unidad",
    notes: "", donor: "", donation_date: "",
  });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        base44.entities.Product.list("-created_date", 200),
        base44.entities.Category.list("-created_date", 100),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({
      code: "", name: "", description: "", category_id: "", category_type: "venta",
      price: "", image_url: "", status: "activo", min_stock: 0, unit: "unidad",
      notes: "", donor: "", donation_date: "",
    });
    setSelectedProduct(null);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setForm({
      code: product.code || "",
      name: product.name || "",
      description: product.description || "",
      category_id: product.category_id || "",
      category_type: product.category_type || "venta",
      price: product.price || "",
      image_url: product.image_url || "",
      status: product.status || "activo",
      min_stock: product.min_stock || 0,
      unit: product.unit || "unidad",
      notes: product.notes || "",
      donor: product.donor || "",
      donation_date: product.donation_date || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast({ title: "Error", description: "Código y nombre son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price: form.price ? Number(form.price) : 0,
        min_stock: Number(form.min_stock) || 0,
      };
      if (selectedProduct) {
        await base44.entities.Product.update(selectedProduct.id, data);
        toast({ title: "Producto actualizado" });
      } else {
        data.total_stock = 0;
        data.stock_pv1 = 0;
        data.stock_pv2 = 0;
        data.stock_pv3 = 0;
        await base44.entities.Product.create(data);
        toast({ title: "Producto creado" });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await base44.entities.Product.delete(id);
    toast({ title: "Producto eliminado" });
    loadData();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.category_type === filterType;
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
        title="Catálogo de Productos"
        description={`${products.length} productos registrados`}
        action={
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Agrega tu primer producto al catálogo"
          action={
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-amber-700 hover:bg-amber-800">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-stone-100 flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-stone-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-stone-400 font-mono">{p.code}</p>
                    <h3 className="font-semibold text-stone-900 mt-0.5">{p.name}</h3>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    p.status === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                  }`}>
                    {p.status === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  {CATEGORY_TYPES[p.category_type]?.label || p.category_type}
                </span>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <div>
                    {p.price > 0 && <p className="text-lg font-bold text-amber-700">₡{p.price?.toLocaleString()}</p>}
                    <p className="text-xs text-stone-400">Stock: {p.total_stock || 0} {p.unit}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedProduct(p); setDetailOpen(true); }}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-stone-500" />
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-stone-500" />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CAFE-250" />
              </div>
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
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bolsa de café 250g" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Categoría</Label>
                <Select value={form.category_type} onValueChange={(v) => setForm({ ...form, category_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.type === form.category_type && c.status === "activo").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Precio (₡)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>Stock Mínimo</Label>
                <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
              <div>
                <Label>Unidad</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.category_type === "donacion" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Donante</Label>
                  <Input value={form.donor} onChange={(e) => setForm({ ...form, donor: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha de Donación</Label>
                  <Input type="date" value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label>Imagen</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && (
                  <img src={form.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-lg cursor-pointer hover:bg-stone-200 transition-colors text-sm text-stone-600">
                  <ImageIcon className="w-4 h-4" />
                  Subir imagen
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Guardando..." : selectedProduct ? "Actualizar" : "Crear Producto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 mt-2">
              {selectedProduct.image_url && (
                <img src={selectedProduct.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-stone-400">Código:</span><p className="font-medium">{selectedProduct.code}</p></div>
                <div><span className="text-stone-400">Nombre:</span><p className="font-medium">{selectedProduct.name}</p></div>
                <div><span className="text-stone-400">Tipo:</span><p className="font-medium">{CATEGORY_TYPES[selectedProduct.category_type]?.label}</p></div>
                <div><span className="text-stone-400">Precio:</span><p className="font-medium">₡{selectedProduct.price?.toLocaleString() || 0}</p></div>
                <div><span className="text-stone-400">Stock Total:</span><p className="font-medium">{selectedProduct.total_stock || 0}</p></div>
                <div><span className="text-stone-400">Stock Mínimo:</span><p className="font-medium">{selectedProduct.min_stock || 0}</p></div>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-stone-500 mb-2">Stock por Ubicación</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-stone-500">Bodega Central:</span><span className="font-medium">{selectedProduct.total_stock || 0}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">PV 1:</span><span className="font-medium">{selectedProduct.stock_pv1 || 0}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">PV 2:</span><span className="font-medium">{selectedProduct.stock_pv2 || 0}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">PV 3:</span><span className="font-medium">{selectedProduct.stock_pv3 || 0}</span></div>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-xs text-stone-400">Descripción</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}