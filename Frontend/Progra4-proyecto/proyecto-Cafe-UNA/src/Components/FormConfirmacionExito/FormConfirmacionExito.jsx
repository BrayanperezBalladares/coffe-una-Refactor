import { Check } from "lucide-react";
import { ST } from "../T/ST";

export function FormConfirmacionExito({
  titulo = "Solicitud enviada correctamente",
  mensaje,
  btnTexto = "Realizar otra solicitud",
  onReset,
}) {
  return (
    <div className="confirmacion">
      <div className="confirmacion__icono">
        <Check size={28} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <h2><ST>{titulo}</ST></h2>
      <p><ST>{mensaje}</ST></p>
      <button type="button" className="btn-enviar" onClick={onReset}>
        <ST>{btnTexto}</ST>
      </button>
    </div>
  );
}
