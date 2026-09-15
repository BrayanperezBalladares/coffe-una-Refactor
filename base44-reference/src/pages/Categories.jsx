import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CATEGORY_TYPES } from "@/lib/constants";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "venta", status: "activo" });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cats = await base44.entities.Category.list("-created_date", 100);
      setCategories(cats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", type: "venta", status: "activo" });
    setSelected(null);
  };

  const openEdit = (cat) => {
    setSelected(cat);
    setForm({ name: cat.name, description: cat.description || "", type: cat.type, status: cat.status || "activo" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await base44.entities.Category.update(selected.id, form);
        toast({ title: "Categoría actualizada" });
      } else {
        await base44.entities.Category.create(form);
        toast({ title: "Categoría creada" });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await base44.entities.Category.delete(id);
    toast({ title: "Categoría eliminada" });
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
        title="Categorías"
        description="Organiza tu inventario por categorías"
        action={
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-amber-700 hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Sin categorías"
          description="Crea categorías para organizar tus productos"
          action={
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-amber-700 hover:bg-amber-800">
              <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    cat.type === "venta" ? "bg-amber-100" :
                    cat.type === "insumo_agricola" ? "bg-emerald-100" :
                    cat.type === "donacion" ? "bg-purple-100" :
                    cat.type === "material_administrativo" ? "bg-blue-100" :
                    "bg-stone-100"
                  }`}>
                    <Tags className={`w-5 h-5 ${
                      cat.type === "venta" ? "text-amber-600" :
                      cat.type === "insumo_agricola" ? "text-emerald-600" :
                      cat.type === "donacion" ? "text-purple-600" :
                      cat.type === "material_administrativo" ? "text-blue-600" :
                      "text-stone-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{cat.name}</h3>
                    <p className="text-xs text-stone-400">{CATEGORY_TYPES[cat.type]?.label}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  cat.status === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                }`}>
                  {cat.status === "activo" ? "Activo" : "Inactivo"}
                </span>
              </div>
              {cat.description && (
                <p className="text-sm text-stone-500 mt-3 line-clamp-2">{cat.description}</p>
              )}
              <div className="flex gap-1 mt-4 pt-3 border-t border-stone-100">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-stone-500" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Café en bolsa" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? "Guardando..." : selected ? "Actualizar" : "Crear Categoría"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}