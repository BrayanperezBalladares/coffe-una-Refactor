import { useEffect, useRef, useState } from "react";
import { PackageMinus, X } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";
import { NumericInput } from "../../../../Components/NumericInput/NumericInput";
import { sanitizeUserFacingError } from "../../../../lib/formLimits";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { t } from "../../../../lib/t";

export const MOTIVOS_SALIDA = [
  { value: "donacion", label: "Donación" },
  { value: "venta", label: "Venta" },
  { value: "traslado", label: "Traslado" },
  { value: "ajuste", label: "Ajuste / Merma" },
];

export function EgresoInventarioModal({
  open,
  product,
  availableStock = 0,
  onSave,
  onClose,
  isSaving = false,
  error = "",
}) {
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("donacion");
  const [destinatarioNombre, setDestinatarioNombre] = useState("");
  const [notas, setNotas] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const submitGuard = useRef(false);

  const tTitulo = useTraducir("Registrar salida de inventario");
  const tRegistrando = useTraducir("Registrando egreso...");
  const tRegistrar = useTraducir("Registrar egreso");
  const tProducto = useTraducir("Producto");

  useEffect(() => {
    if (open) {
      setCantidad(availableStock > 0 ? "1" : "0");
      setMotivo("donacion");
      setDestinatarioNombre("");
      setNotas("");
      setValidationError("");
      setSubmitError("");
      submitGuard.current = false;
    }
  }, [open, availableStock]);

  if (!open) return null;

  const esDonacion = motivo === "donacion";
  const stockNumerico = Number(availableStock) || 0;
  const sinStock = stockNumerico <= 0;
  const message = validationError || submitError || error;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitGuard.current || isSaving) return;

    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      setValidationError(t("La cantidad debe ser un número entero mayor a 0."));
      setSubmitError("");
      window.requestAnimationFrame(() =>
        document.querySelector("[name='cantidadEgreso']")?.focus(),
      );
      return;
    }

    if (cant > stockNumerico) {
      setValidationError(
        t("La cantidad a egresar no puede superar el stock disponible ({stock}).", {
          stock: stockNumerico,
        }),
      );
      setSubmitError("");
      window.requestAnimationFrame(() =>
        document.querySelector("[name='cantidadEgreso']")?.focus(),
      );
      return;
    }

    const dest = destinatarioNombre.trim();
    if (esDonacion && !dest) {
      setValidationError(
        t("El nombre del destinatario es obligatorio para salidas por donación."),
      );
      setSubmitError("");
      window.requestAnimationFrame(() =>
        document.querySelector("[name='destinatarioEgreso']")?.focus(),
      );
      return;
    }

    submitGuard.current = true;
    setValidationError("");
    setSubmitError("");

    try {
      await onSave({
        productoId: String(product?.id),
        cantidad: cant,
        motivo,
        destinatarioNombre: dest,
        notas: notas.trim(),
      });
    } catch (saveError) {
      submitGuard.current = false;
      setSubmitError(
        sanitizeUserFacingError(
          saveError?.message || "No se pudo registrar el egreso de inventario.",
        ),
      );
    }
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-lg" labelledBy="egreso-modal-title">
      <AdminModalHeader>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <PackageMinus className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="egreso-modal-title" className="truncate text-lg font-semibold text-slate-950">
              {tTitulo}
            </h2>
            <p className="truncate text-sm text-slate-500">{product?.nombre || tProducto}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label={t("Cerrar modal de egreso")}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </AdminModalHeader>

      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Tarjeta de información del producto y stock actual */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ST>Stock en Bodega Central</ST>
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {product?.nombre || tProducto}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  sinStock
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                <ST>{sinStock ? "Agotado" : `${stockNumerico} disponibles`}</ST>
              </span>
            </div>
          </div>

          {sinStock ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              <ST>Este producto no tiene unidades disponibles en Bodega Central para egresar.</ST>
            </p>
          ) : null}

          {/* Selector de motivo */}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span><ST>Motivo de la salida</ST> <span className="text-rose-600">*</span></span>
            <select
              name="motivoSalida"
              value={motivo}
              disabled={isSaving || sinStock}
              onChange={(e) => {
                setMotivo(e.target.value);
                setValidationError("");
                setSubmitError("");
              }}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 disabled:opacity-60"
            >
              {MOTIVOS_SALIDA.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              <ST>Clasifica la naturaleza del egreso para la bitácora contable e institucional.</ST>
            </span>
          </label>

          {/* Campo de cantidad */}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span><ST>Cantidad a egresar</ST> <span className="text-rose-600">*</span></span>
            <NumericInput
              name="cantidadEgreso"
              value={cantidad}
              disabled={isSaving || sinStock}
              onChange={(event) => {
                setCantidad(event.target.value);
                setValidationError("");
                setSubmitError("");
              }}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 disabled:opacity-60"
              required
            />
            <span className="text-xs font-normal text-slate-500">
              <ST>Máximo permitido:</ST> {stockNumerico} <ST>unidades</ST>.
            </span>
          </label>

          {/* Destinatario / Beneficiario (Requerido para donaciones) */}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <div className="flex items-center justify-between">
              <span>
                <ST>Destinatario / Beneficiario</ST>{" "}
                {esDonacion ? <span className="text-rose-600">*</span> : null}
              </span>
              {esDonacion ? (
                <span className="text-xs font-semibold text-rose-600">
                  <ST>* Requerido para donaciones</ST>
                </span>
              ) : (
                <span className="text-xs font-normal text-slate-400">
                  <ST>Opcional</ST>
                </span>
              )}
            </div>
            <input
              type="text"
              name="destinatarioEgreso"
              value={destinatarioNombre}
              disabled={isSaving || sinStock}
              maxLength={200}
              placeholder={
                esDonacion
                  ? t("Nombre de la persona, proyecto u organización beneficiaria...")
                  : t("Destinatario opcional...")
              }
              onChange={(e) => {
                setDestinatarioNombre(e.target.value);
                setValidationError("");
                setSubmitError("");
              }}
              className={`min-h-11 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 disabled:opacity-60 ${
                esDonacion && !destinatarioNombre.trim() && validationError
                  ? "border-rose-500"
                  : "border-slate-200"
              }`}
              required={esDonacion}
            />
            <span className="text-xs font-normal text-slate-500">
              <ST>Registra a quién se le entrega el producto para fines de auditoría.</ST>
            </span>
          </label>

          {/* Notas u observaciones */}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span><ST>Observaciones / Justificación</ST></span>
            <textarea
              name="notasEgreso"
              value={notas}
              disabled={isSaving || sinStock}
              rows={2}
              maxLength={500}
              placeholder={t("Detalles adicionales, número de acta o justificación...")}
              onChange={(e) => {
                setNotas(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 disabled:opacity-60"
            />
          </label>

          {message ? (
            <p className="text-sm font-medium text-rose-600" role="alert" aria-live="assertive">
              <ST>{message}</ST>
            </p>
          ) : null}

          <div className="border-t border-slate-100 pt-3">
            <AdminModalActions
              className="w-full justify-start"
              onCancel={onClose}
              primaryLabel={isSaving ? tRegistrando : tRegistrar}
              primaryDisabled={isSaving || sinStock}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
