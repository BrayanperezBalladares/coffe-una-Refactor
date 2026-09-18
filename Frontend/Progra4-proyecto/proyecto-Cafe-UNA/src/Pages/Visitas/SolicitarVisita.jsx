import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileDown,
  Lock,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { Calendar } from "@/Components/ui/calendar";
import { CountryCombobox } from "@/Components/ui/CountryCombobox";
import { cn } from "@/lib/utils";
import PageLoading from "../../Components/PageLoading/PageLoading";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { PROVINCIAS_CR, cantonesDeProvincia } from "../../lib/costaRicaDivisiones";
import { sedeDesdeHomeLocation } from "../../lib/sedeFinca";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { obtenerSeccion } from "../../services/informacionService";
import { getActiveSessionUser } from "../../services/sessionService";
import {
  crearSolicitudVisita,
  obtenerDisponibilidadVisitasPublica,
} from "../../services/visitasService";
import { descargarRecomendacionesVisitaPdf } from "../../lib/exportarRecomendacionesVisitaPdf";
import { useIdioma } from "../../lib/useIdioma";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import "../Voluntariado/SolicitarVoluntariado.css";

const VISITA_LOGIN_REDIRECT = "/visitas/solicitar";

const INITIAL_FORM = {
  encargadoIdentificacion: "",
  encargadoNombre: "",
  encargadoPrimerApellido: "",
  encargadoSegundoApellido: "",
  encargadoEmail: "",
  encargadoTelefono: "",
  encargadoInstitucion: "",
  tipoVisitante: "Nacional",
  paisProcedencia: "",
  provincia: "",
  canton: "",
  cantidadVisitantes: "",
  tipoGrupo: "",
  disponibilidadVisitaId: "",
  motivoVisita: "",
  requiereAccesibilidad: false,
  requiereParqueoBus: false,
  observaciones: "",
};

function normalizarCedulaCr(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function esCedulaFisica(valor) {
  const digitos = normalizarCedulaCr(valor);
  return digitos.length === 9 && digitos === String(valor ?? "").replace(/[\s-]/g, "");
}

function esAvisoCedulaInformativo(mensaje) {
  return /cargad[oa]s?\s+autom[aá]ticamente/i.test(mensaje) || /datos cargados/i.test(mensaje);
}

function partesNombreCedula(datos) {
  return {
    nombre: String(datos?.nombre || datos?.Nombre || "").trim(),
    primerApellido: String(datos?.primerApellido || datos?.PrimerApellido || "").trim(),
    segundoApellido: String(datos?.segundoApellido || datos?.SegundoApellido || "").trim(),
  };
}

function Field({ label, children }) {
  return (
    <label className="campo">
      {typeof label === "string" ? <ST>{label}</ST> : label}
      {children}
    </label>
  );
}

function SectionCard({ icon: Icon, paso, title, hint, children }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        {paso != null ? (
          <span className="section-card__paso" aria-hidden="true">
            {paso}
          </span>
        ) : null}
        <div className="section-card__title-group">
          <h4>
            {paso != null ? (
              <span className="sr-only"><ST>Paso</ST> {paso}. </span>
            ) : null}
            {typeof title === "string" ? <ST>{title}</ST> : title}
          </h4>
          {hint ? <p className="section-card__hint">{typeof hint === "string" ? <ST>{hint}</ST> : hint}</p> : null}
        </div>
        {Icon ? <Icon aria-hidden="true" className="section-card__icon-inline" size={20} /> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

function parseIsoLocal(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = String(isoStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function SolicitarVisita() {
  const navigate = useNavigate();
  const { idioma } = useIdioma();
  const dateLocale = idioma === "en" ? enUS : es;
  const session = getActiveSessionUser();
  const isAuthenticated = Boolean(session?.token || session?.id);

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    encargadoEmail: session?.email || "",
  }));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [availabilityError, setAvailabilityError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [avisoCedula, setAvisoCedula] = useState(null);
  const [sedeFinca, setSedeFinca] = useState(() => sedeDesdeHomeLocation(null));
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const handleDescargarRecomendacionesPdf = async () => {
    try {
      setDescargandoPdf(true);
      await descargarRecomendacionesVisitaPdf();
    } catch (err) {
      console.error("Error al generar el PDF de recomendaciones:", err);
    } finally {
      setDescargandoPdf(false);
    }
  };

  const tPhId = useTraducir(form.tipoVisitante === "Internacional" ? "Pasaporte o ID" : "101110111");
  const tPhNombre = useTraducir("Nombre");
  const tPh1 = useTraducir("1° Apellido");
  const tPh2 = useTraducir("2° Apellido");
  const tPhEmail = useTraducir("ejemplo@correo.com");
  const tPhTelefono = useTraducir("88888888");
  const tPhInstitucion = useTraducir("Universidad, colegio, empresa u organización");
  const tPhCantidad = useTraducir("Mínimo 2 personas");
  const tPhTipoGrupo = useTraducir("Universidad, empresa, asociación…");
  const tPhMotivo = useTraducir("Ej: Gira de campo agronómica, recorrido de sostenibilidad…");
  const tPhObservaciones = useTraducir("Detalles adicionales, temática de interés o requerimientos especiales…");
  const tPhPais = useTraducir("Seleccioná tu país...");

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("visitas");

  useEffect(() => {
    let vivo = true;
    obtenerSeccion("homeLocation")
      .then((section) => {
        if (!vivo) return;
        setSedeFinca(sedeDesdeHomeLocation(section));
      })
      .catch(() => {
        if (!vivo) return;
        setSedeFinca(sedeDesdeHomeLocation(null));
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Mapeo de fechas habilitadas para visitas (YYYY-MM-DD -> array de slots)
  const fechasHabilitadasMap = useMemo(() => {
    const map = new Map();
    for (const slot of availability) {
      if (!slot.habilitada) continue;
      const iso = String(slot.fecha || "").slice(0, 10);
      if (!iso) continue;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(slot);
    }
    return map;
  }, [availability]);

  // Fechas habilitadas para el modifier del Calendar
  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const parsed = parseIsoLocal(iso);
      if (parsed) list.push(parsed);
    }
    return list;
  }, [fechasHabilitadasMap]);

  // Función para deshabilitar días en el calendario
  const isDateDisabled = useCallback(
    (date) => {
      const hoy = startOfDay(new Date());
      if (isBefore(startOfDay(date), hoy)) return true;
      const iso = format(date, "yyyy-MM-dd");
      return !fechasHabilitadasMap.has(iso);
    },
    [fechasHabilitadasMap],
  );

  const slotsParaFechaSeleccionada = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const iso = format(fechaSeleccionada, "yyyy-MM-dd");
    return fechasHabilitadasMap.get(iso) || [];
  }, [fechaSeleccionada, fechasHabilitadasMap]);

  const selectedSlot = useMemo(
    () => availability.find((slot) => slot.id === form.disponibilidadVisitaId) || null,
    [availability, form.disponibilidadVisitaId],
  );

  const redirectToLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT);
    navigate({ to: "/login" });
  }, [navigate]);

  const handleFormInteractionCapture = useCallback(
    (event) => {
      if (isAuthenticated) return;
      if (event.target.closest?.(".auth-banner__link")) return;

      event.preventDefault();
      event.stopPropagation();
      redirectToLogin();
    },
    [isAuthenticated, redirectToLogin],
  );

  useEffect(() => {
    let active = true;
    obtenerDisponibilidadVisitasPublica()
      .then((slots) => {
        if (!active) return;
        setAvailability(slots);
        setAvailabilityStatus("success");

        // Si hay fechas habilitadas, preseleccionar la primera fecha disponible
        const habilitados = slots.filter((s) => s.habilitada);
        if (habilitados.length > 0) {
          const primerIso = habilitados[0].fecha;
          const parsed = parseIsoLocal(primerIso);
          if (parsed) {
            setFechaSeleccionada(parsed);
          }
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setAvailability([]);
        setAvailabilityError(loadError?.message || "No se pudieron cargar los horarios disponibles.");
        setAvailabilityStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectFecha = (date) => {
    if (!date) return;
    setFechaSeleccionada(date);
    const iso = format(date, "yyyy-MM-dd");
    // Si el turno actual no pertenece a la fecha seleccionada, reiniciar
    setForm((current) => {
      const currentSlot = availability.find((s) => s.id === current.disponibilidadVisitaId);
      if (currentSlot && currentSlot.fecha === iso) return current;
      return { ...current, disponibilidadVisitaId: "" };
    });
  };

  const consultarDatosCedula = useCallback(async (digitos, { forzar = false } = {}) => {
    if (digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula(null);

    try {
      const datos = await consultarCedulaDetallada(digitos);
      const partes = partesNombreCedula(datos);
      if (!partes.nombre && !partes.primerApellido) {
        consultaCedulaRef.current = { digitos: "", enCurso: false };
        setAvisoCedula("No se encontraron datos para esta cédula. Complete los datos manualmente.");
        return;
      }
      consultaCedulaRef.current = { digitos, enCurso: false };
      setForm((prev) => ({
        ...prev,
        encargadoNombre: partes.nombre,
        encargadoPrimerApellido: partes.primerApellido,
        encargadoSegundoApellido: partes.segundoApellido,
      }));
      setAvisoCedula("Datos cargados automáticamente. Puede editarlos si es necesario.");
    } catch (cedulaError) {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      const mensajeBase = cedulaError?.message?.trim() || "No se pudo consultar la cédula.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion =
        cedulaError?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : esConexion
            ? `${mensajeBase} Mientras tanto, complete los datos manualmente.`
            : `${mensajeBase} Complete los datos manualmente.`,
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, []);

  useEffect(() => {
    const digitos = normalizarCedulaCr(form.encargadoIdentificacion);
    if (!esCedulaFisica(form.encargadoIdentificacion) || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [form.encargadoIdentificacion, consultarDatosCedula]);

  const handleIdentificacionBlur = () => {
    const digitos = normalizarCedulaCr(form.encargadoIdentificacion);
    if (esCedulaFisica(form.encargadoIdentificacion) && digitos.length === 9) {
      if (consultaCedulaRef.current.digitos !== digitos) {
        consultarDatosCedula(digitos, { forzar: true });
      }
    }
  };

  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "provincia" && current.tipoVisitante === "Nacional") {
        next.canton = "";
      }
      if (name === "tipoVisitante") {
        next.provincia = "";
        next.canton = "";
        next.paisProcedencia = value === "Nacional" ? "" : "";
      }
      return next;
    });

    if (name === "encargadoIdentificacion") {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      setAvisoCedula(null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (
      !form.encargadoIdentificacion.trim() ||
      !form.encargadoNombre.trim() ||
      !form.encargadoPrimerApellido.trim() ||
      !form.encargadoEmail.trim() ||
      !form.encargadoTelefono.trim()
    ) {
      setError("Completá los campos obligatorios antes de enviar la solicitud.");
      return;
    }

    if (form.tipoVisitante === "Nacional") {
      if (!form.provincia.trim() || !form.canton.trim()) {
        setError("Completá los campos obligatorios antes de enviar la solicitud.");
        return;
      }
    } else {
      if (!form.paisProcedencia.trim()) {
        setError("Indicá el país de procedencia del grupo internacional.");
        return;
      }
    }

    if (!form.cantidadVisitantes || Number(form.cantidadVisitantes) < 2) {
      setError("Las visitas grupales requieren al menos 2 personas.");
      return;
    }

    if (
      !form.tipoGrupo.trim() ||
      !form.disponibilidadVisitaId ||
      !form.motivoVisita.trim()
    ) {
      setError("Completá los campos obligatorios antes de enviar la solicitud.");
      return;
    }

    const nombreCompleto = [
      form.encargadoNombre,
      form.encargadoPrimerApellido,
      form.encargadoSegundoApellido,
    ]
      .map((parte) => String(parte || "").trim())
      .filter(Boolean)
      .join(" ");

    const ciudadProvincia =
      form.tipoVisitante === "Internacional"
        ? form.paisProcedencia.trim()
        : [form.provincia, form.canton]
            .map((parte) => String(parte || "").trim())
            .filter(Boolean)
            .join(", ");

    const paisProcedencia =
      form.tipoVisitante === "Internacional"
        ? form.paisProcedencia.trim()
        : "Costa Rica";

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        encargadoNombre: nombreCompleto,
        paisProcedencia,
        ciudadProvincia,
      };
      const created = await crearSolicitudVisita(payload);
      setSuccess(created);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo enviar la solicitud de visita.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        className={`voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
        ref={pageRef}
      >
        <section className="voluntariado-section">
          <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />

          <header className="voluntariado-header">
            <h1><ST>Solicitud de visitas grupales</ST></h1>
            <p>
              <ST>
                Completá la información del grupo y elegí uno de los horarios habilitados por la administración.
                La solicitud quedará pendiente de revisión.
              </ST>
            </p>
          </header>

          <form
            className="formulario-card"
            onSubmit={submit}
            onFocusCapture={handleFormInteractionCapture}
            onPointerDownCapture={handleFormInteractionCapture}
            noValidate
          >
            <div className="form-secciones">
              <SectionCard
                paso={1}
                icon={UserRound}
                title="Información del encargado"
                hint="Datos de la persona responsable de coordinar la visita."
              >
                <div className="campo full">
                  <p className="campo-label font-medium mb-2 text-foreground/90">
                    <ST>¿El encargado es costarricense o residente?</ST> <span className="req text-destructive">*</span>
                  </p>
                  <div className="tipo-opciones flex gap-4">
                    <label className={cn(
                      "radio-card flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors",
                      form.tipoVisitante === "Nacional" ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border hover:bg-accent/40"
                    )}>
                      <input
                        type="radio"
                        name="tipoVisitanteRadio"
                        value="Nacional"
                        checked={form.tipoVisitante === "Nacional"}
                        onChange={() => update({ target: { name: "tipoVisitante", value: "Nacional", type: "text" } })}
                        className="accent-primary"
                      />
                      <span><ST>Costarricense</ST></span>
                    </label>
                    <label className={cn(
                      "radio-card flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors",
                      form.tipoVisitante === "Internacional" ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border hover:bg-accent/40"
                    )}>
                      <input
                        type="radio"
                        name="tipoVisitanteRadio"
                        value="Internacional"
                        checked={form.tipoVisitante === "Internacional"}
                        onChange={() => update({ target: { name: "tipoVisitante", value: "Internacional", type: "text" } })}
                        className="accent-primary"
                      />
                      <span><ST>Extranjero</ST></span>
                    </label>
                  </div>
                  <select
                    name="tipoVisitante"
                    aria-label="Tipo de visitante"
                    value={form.tipoVisitante}
                    onChange={update}
                    className="sr-only"
                    tabIndex={-1}
                  >
                    <option value="Nacional">Nacional</option>
                    <option value="Internacional">Internacional</option>
                  </select>
                </div>

                {form.tipoVisitante === "Internacional" && (
                  <div className="campo full">
                    <Field label="País de procedencia *">
                      <CountryCombobox
                        id="vis-pais"
                        name="paisProcedencia"
                        value={form.paisProcedencia}
                        onChange={(nuevoPais) => {
                          setForm((prev) => ({ ...prev, paisProcedencia: nuevoPais }));
                          setError("");
                        }}
                        ariaLabel="País de procedencia *"
                        placeholder={tPhPais}
                        error={Boolean(error && !form.paisProcedencia.trim())}
                      />
                    </Field>
                  </div>
                )}

                <div className="form-grid--2cols">
                  <Field label={form.tipoVisitante === "Internacional" ? "Identificación (Pasaporte / ID) *" : "Identificación (Cédula) *"}>
                    <div className="campo-con-estado">
                      <input
                        name="encargadoIdentificacion"
                        aria-label="Identificación del encargado"
                        placeholder={tPhId}
                        value={form.encargadoIdentificacion}
                        onChange={update}
                        onBlur={handleIdentificacionBlur}
                        maxLength={form.tipoVisitante === "Internacional" ? 30 : 9}
                      />
                      {consultandoCedula ? (
                        <span className="campo-estado-icono">
                          <span className="cedula-loader" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                  </Field>
                  <Field label="Nombre *">
                    <input
                      name="encargadoNombre"
                      placeholder={tPhNombre}
                      value={form.encargadoNombre}
                      onChange={update}
                      maxLength={80}
                    />
                  </Field>
                </div>

                <div className="form-grid--2cols">
                  <Field label="Primer apellido *">
                    <input
                      name="encargadoPrimerApellido"
                      placeholder={tPh1}
                      value={form.encargadoPrimerApellido}
                      onChange={update}
                      maxLength={80}
                    />
                  </Field>
                  <Field label="Segundo apellido">
                    <input
                      name="encargadoSegundoApellido"
                      placeholder={tPh2}
                      value={form.encargadoSegundoApellido}
                      onChange={update}
                      maxLength={80}
                    />
                  </Field>
                </div>

                {consultandoCedula && (
                  <span className="mensaje-info"><ST>Consultando datos de la cédula...</ST></span>
                )}
                {!consultandoCedula && avisoCedula && (
                  <span className={esAvisoCedulaInformativo(avisoCedula) ? "mensaje-info" : "mensaje-error"}>
                    <ST>{avisoCedula}</ST>
                  </span>
                )}

                <div className="form-grid--2cols">
                  <Field label="Correo electrónico *">
                    <input
                      type="email"
                      name="encargadoEmail"
                      placeholder={tPhEmail}
                      value={form.encargadoEmail}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Teléfono *">
                    <input
                      name="encargadoTelefono"
                      placeholder={tPhTelefono}
                      value={form.encargadoTelefono}
                      onChange={update}
                    />
                  </Field>
                </div>

                <div className="campo full">
                  <Field label="Institución o empresa (opcional)">
                    <input
                      name="encargadoInstitucion"
                      placeholder={tPhInstitucion}
                      value={form.encargadoInstitucion}
                      onChange={update}
                      maxLength={120}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                paso={2}
                icon={Users}
                title="Información del grupo"
                hint="Las visitas grupales requieren al menos dos personas."
              >
                <div className="form-grid--2cols">
                  <Field label="Cantidad de visitantes *">
                    <input
                      min="2"
                      type="number"
                      name="cantidadVisitantes"
                      placeholder={tPhCantidad}
                      value={form.cantidadVisitantes}
                      onChange={update}
                    />
                  </Field>

                  <Field label="Tipo de grupo *">
                    <input
                      name="tipoGrupo"
                      aria-label="Tipo de grupo"
                      value={form.tipoGrupo}
                      onChange={update}
                      placeholder={tPhTipoGrupo}
                    />
                  </Field>
                </div>

                {form.tipoVisitante === "Nacional" && (
                  <div className="form-grid--2cols">
                    <Field label="Provincia *">
                      <select name="provincia" value={form.provincia} onChange={update}>
                        <option value="">{idioma === "en" ? "Select a province" : "Seleccioná una provincia"}</option>
                        {PROVINCIAS_CR.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Cantón *">
                      <select
                        name="canton"
                        value={form.canton}
                        onChange={update}
                        disabled={!form.provincia}
                      >
                        <option value="">
                          {form.provincia
                            ? (idioma === "en" ? "Select a canton" : "Seleccioná un cantón")
                            : (idioma === "en" ? "First select a province" : "Primero seleccioná una provincia")}
                        </option>
                        {cantonesDeProvincia(form.provincia).map((can) => (
                          <option key={can} value={can}>
                            {can}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                <div className="campo full">
                  <Field label="Motivo de la visita *">
                    <input
                      name="motivoVisita"
                      placeholder={tPhMotivo}
                      value={form.motivoVisita}
                      onChange={update}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Sección de Horarios Homologada */}
              <SectionCard
                paso={3}
                icon={CalendarDays}
                title="Fecha y horario disponibles *"
                hint="Seleccioná un día habilitado en el calendario y luego el turno de tu preferencia."
              >
                {availabilityStatus === "loading" ? (
                  <div className="voluntariado-aviso-bloque">
                    <div className="voluntariado-aviso-bloque__icono-wrap">
                      <Clock className="voluntariado-aviso-bloque__icono size-7 animate-spin" />
                    </div>
                    <p className="voluntariado-aviso-bloque__texto">
                      <ST>Cargando fechas y horarios disponibles…</ST>
                    </p>
                  </div>
                ) : availabilityStatus === "error" ? (
                  <p className="mensaje-error text-center" role="alert">
                    <ST>{availabilityError || "No se pudieron cargar los horarios disponibles."}</ST>
                  </p>
                ) : fechasHabilitadasDates.length === 0 ? (
                  <div className="voluntariado-aviso-bloque">
                    <div className="voluntariado-aviso-bloque__icono-wrap">
                      <CalendarX2 className="voluntariado-aviso-bloque__icono size-7" />
                    </div>
                    <p className="voluntariado-aviso-bloque__titulo">
                      <ST>No hay fechas y horarios habilitados</ST>
                    </p>
                    <p className="voluntariado-aviso-bloque__texto">
                      <ST>Actualmente no hay fechas habilitadas para visitas grupales. Por favor consultá más adelante.</ST>
                    </p>
                  </div>
                ) : (
                  <div className="campo full flex flex-col items-center">
                    {fechaSeleccionada && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-900/20 bg-amber-50/70 px-5 py-2 shadow-xs">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900/60">
                          <ST>FECHA SELECCIONADA:</ST>
                        </span>
                        <span className="text-xs font-bold text-amber-950 capitalize">
                          {format(
                            fechaSeleccionada,
                            idioma === "en" ? "EEEE, MMMM do, yyyy" : "EEEE, dd 'de' MMMM 'de' yyyy",
                            { locale: dateLocale }
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center my-1 w-full">
                      <Calendar
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={handleSelectFecha}
                        disabled={isDateDisabled}
                        locale={dateLocale}
                        modifiers={{
                          habilitado: fechasHabilitadasDates,
                        }}
                        modifiersClassNames={{
                          habilitado: "rdp-day-habilitado",
                        }}
                        captionLayout="dropdown"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 mt-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-[#24140e] bg-white font-bold text-[#24140e] text-[11px]">
                          15
                        </span>
                        <span><ST>Fecha disponible para visitas</ST></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center text-stone-400 opacity-40 text-[11px]">
                          15
                        </span>
                        <span><ST>Fecha no disponible</ST></span>
                      </div>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-stone-200/80">
                      {!fechaSeleccionada ? (
                        <div className="voluntariado-aviso-bloque">
                          <div className="voluntariado-aviso-bloque__icono-wrap">
                            <Clock className="voluntariado-aviso-bloque__icono size-7" />
                          </div>
                          <p className="voluntariado-aviso-bloque__titulo">
                            <ST>Seleccioná una fecha en el calendario</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto">
                            <ST>Al seleccionar un día habilitado, se cargarán los turnos u horarios disponibles para esa fecha.</ST>
                          </p>
                        </div>
                      ) : slotsParaFechaSeleccionada.length === 0 ? (
                        <div className="voluntariado-aviso-bloque">
                          <div className="voluntariado-aviso-bloque__icono-wrap">
                            <CalendarX2 className="voluntariado-aviso-bloque__icono size-7" />
                          </div>
                          <p className="voluntariado-aviso-bloque__titulo">
                            <ST>Sin turnos para esta fecha</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto">
                            <ST>No hay turnos disponibles para el día seleccionado.</ST>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-stone-700 mb-3">
                            <ST>Horarios disponibles para el</ST>{" "}
                            <strong className="text-stone-900">
                              {format(
                                fechaSeleccionada,
                                idioma === "en" ? "MMMM do" : "dd 'de' MMMM",
                                { locale: dateLocale }
                              )}
                            </strong>:
                          </p>

                          <div className="opciones-disponibilidad-grid">
                            {slotsParaFechaSeleccionada.map((slot) => {
                              const esActivo = form.disponibilidadVisitaId === slot.id;
                              const franja = `${slot.horaInicio.slice(0, 5)} – ${slot.horaFin.slice(0, 5)}`;
                              return (
                                <label
                                  key={slot.id}
                                  className={`opcion-disponibilidad-card ${
                                    esActivo ? "opcion-disponibilidad-card--activa" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="disponibilidadVisitaId"
                                    value={slot.id}
                                    checked={esActivo}
                                    aria-label={`Horario ${franja}`}
                                    onChange={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        disponibilidadVisitaId: slot.id,
                                      }));
                                    }}
                                  />
                                  <div className="opcion-disponibilidad__header">
                                    <span className="opcion-disponibilidad__titulo">
                                      {franja}
                                    </span>
                                    <span className="opcion-disponibilidad__radio-dot" />
                                  </div>
                                  <span className="opcion-disponibilidad__horario">
                                    <Clock size={14} />
                                    {franja}
                                  </span>
                                  {slot.nota ? (
                                    <span className="text-xs text-stone-500 mt-1 block">
                                      <ST>{slot.nota}</ST>
                                    </span>
                                  ) : null}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                paso={4}
                icon={ClipboardList}
                title="Necesidades y recomendaciones"
                hint="Todas las visitas serán recibidas o acompañadas por personal del proyecto."
              >
                <fieldset className="visita-necesidades-fieldset">
                  <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-600">
                    <ST>Necesidades del grupo</ST>
                  </legend>
                  <div className="visita-checkbox-grid">
                    <label className={`visita-checkbox-card ${form.requiereAccesibilidad ? "visita-checkbox-card--activa" : ""}`}>
                      <input
                        type="checkbox"
                        name="requiereAccesibilidad"
                        checked={form.requiereAccesibilidad}
                        onChange={update}
                      />
                      <div className="visita-checkbox-card__info">
                        <strong><ST>Requerimientos de accesibilidad</ST></strong>
                        <span><ST>Apoyo para personas con movilidad reducida o necesidades especiales.</ST></span>
                      </div>
                    </label>
                    <label className={`visita-checkbox-card ${form.requiereParqueoBus ? "visita-checkbox-card--activa" : ""}`}>
                      <input
                        type="checkbox"
                        name="requiereParqueoBus"
                        aria-label="Parqueo"
                        checked={form.requiereParqueoBus}
                        onChange={update}
                      />
                      <div className="visita-checkbox-card__info">
                        <strong><ST>Parqueo</ST></strong>
                        <span><ST>Habilitar espacio de parqueo y maniobra en la finca.</ST></span>
                      </div>
                    </label>
                  </div>
                </fieldset>

                <div className="visita-recomendaciones">
                  <div className="visita-recomendaciones__header flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-700 shrink-0" />
                      <strong><ST>Recomendaciones para el recorrido</ST></strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleDescargarRecomendacionesPdf}
                      disabled={descargandoPdf}
                      className="visita-btn-descargar-pdf inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Descargar guía y recomendaciones oficiales en formato PDF"
                    >
                      <FileDown size={14} className="text-amber-700 shrink-0" />
                      <span><ST>{descargandoPdf ? "Generando PDF..." : "Descargar recomendaciones (PDF)"}</ST></span>
                    </button>
                  </div>
                  <ul className="visita-recomendaciones__list">
                    <li><ST>Usá vestimenta cómoda y calzado cerrado apropiado para senderos al aire libre.</ST></li>
                    <li><ST>Llevá repelente si visitarán zonas con vegetación densa o cultivo de café.</ST></li>
                    <li><ST>Considerá protección solar e hidratación suficiente para el recorrido.</ST></li>
                  </ul>
                </div>

                <div className="campo full">
                  <Field label="Observaciones o solicitudes especiales">
                    <textarea
                      name="observaciones"
                      placeholder={tPhObservaciones}
                      rows={3}
                      value={form.observaciones}
                      onChange={update}
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
                <ST>{error}</ST>
              </p>
            ) : null}
            {success ? (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4" role="status">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-base">
                      <ST>¡Solicitud de visita enviada con éxito!</ST>
                    </p>
                    <p className="text-sm text-emerald-800 mt-0.5">
                      <ST>Solicitud #{success.id} enviada en estado {success.estado}. Te notificaremos por correo electrónico.</ST>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDescargarRecomendacionesPdf}
                  disabled={descargandoPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <FileDown size={15} />
                  <span><ST>Descargar guía de visita (PDF)</ST></span>
                </button>
              </div>
            ) : null}

            {!isAuthenticated ? (
              <div className="auth-banner mb-6">
                <Lock size={20} strokeWidth={2} className="auth-banner__icon" />
                <div className="auth-banner__content">
                  <p className="auth-banner__text"><ST>Debe iniciar sesión para enviar su solicitud de visita.</ST></p>
                  <Link
                    to="/login"
                    className="auth-banner__link"
                    onClick={() => sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT)}
                  >
                    <ST>Iniciar sesión →</ST>
                  </Link>
                </div>
              </div>
            ) : null}

            <AvisoSedeFinca sede={sedeFinca} contexto="visita" />

            <div className="acciones-formulario">
              <button
                className="btn-enviar"
                disabled={
                  submitting ||
                  availabilityStatus === "error" ||
                  (availabilityStatus === "success" && fechasHabilitadasDates.length === 0)
                }
                type="submit"
              >
                {submitting ? <ST>Enviando…</ST> : <ST>Enviar solicitud</ST>}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
