import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { ST } from '../../Components/T/ST';
import { useTraducir } from '../../hooks/useTraducir';
import { sanitizeUserFacingError, MAX_PASSWORD } from '../../lib/formLimits';
import { queueFocusFormError } from '../../lib/formFocus';
import { normalizeImageUrl } from '../../lib/imageUtils';
import {
  completarCliente,
  limpiarIntentRegistroCliente,
  mapAuthenticatedUser,
  puedeAbrirRegistroCliente,
  puedeComprar,
  registrarCliente,
} from '../../services/authService';
import { consultarCedulaDetallada } from '../../services/cedulaService';
import { obtenerNavbar } from '../../services/informacionService';
import {
  getActiveSessionUser,
  saveAuthenticatedUser,
} from '../../services/sessionService';
import { Input } from '../../Components/ui/input';
import { Button } from '../../Components/ui/button';
import { CountryCombobox } from '../../Components/ui/CountryCombobox';
import { cn } from '../../lib/utils';
import '../Login/Login.css';
import './Registro.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_RE = /^(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}$/;
const NOMBRE_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const CEDULA_JURIDICA_RE = /^\d{1}-\d{3}-\d{6}$/;

const LIMITE = {
  nombre: 50,
  apellido: 40,
  cedula: 9,
  dimex: 12,
  pasaporte: 20,
  razonSocial: 120,
  nombreComercial: 120,
  representanteLegal: 100,
  cedulaJuridica: 12,
  direccionFiscal: 200,
  telefono: 15,
  correo: 100,
  password: MAX_PASSWORD,
};

function normalizarCedulaCr(valor) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, LIMITE.cedula);
}

function soloLetras(valor, max) {
  return String(valor ?? '')
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, max);
}

function soloDigitos(valor, max) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, max);
}

function soloTelefono(valor) {
  const texto = String(valor ?? '');
  const tieneMas = texto.trimStart().startsWith('+');
  const digitos = texto.replace(/\D/g, '').slice(0, LIMITE.telefono - (tieneMas ? 1 : 0));
  return tieneMas ? `+${digitos}` : digitos;
}

function formatearCedulaJuridica(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 10);
  if (digitos.length <= 1) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 1)}-${digitos.slice(1)}`;
  return `${digitos.slice(0, 1)}-${digitos.slice(1, 4)}-${digitos.slice(4)}`;
}

function soloCorreo(valor) {
  return String(valor ?? '')
    .replace(/\s+/g, '')
    .slice(0, LIMITE.correo);
}

function PasswordField({
  id,
  value,
  onChange,
  visible,
  onToggle,
  ariaInvalid,
  ariaDescribedBy,
  maxLength,
}) {
  const Icon = visible ? Eye : EyeOff;
  const tOcultar = useTraducir('Ocultar contraseña');
  const tMostrar = useTraducir('Mostrar contraseña');

  return (
    <div className="login-password-wrapper relative flex items-center">
      <Input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={cn(
          'pr-10 transition-all duration-200',
          ariaInvalid ? 'border-red-500 focus-visible:ring-red-400' : ''
        )}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="login-password-toggle absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        onClick={onToggle}
        aria-label={visible ? tOcultar : tMostrar}
      >
        <Icon className="login-password-icon h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function validarPasswordCliente(password) {
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (password.length > LIMITE.password) {
    return `La contraseña no puede tener más de ${LIMITE.password} caracteres.`;
  }
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula.';
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.';
  if (!/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial.';
  }
  return '';
}

function validarTelefono(valor, obligatorio = true) {
  const telefono = String(valor || '').trim();
  if (!telefono) return obligatorio ? 'El teléfono es obligatorio.' : '';
  if (!TELEFONO_RE.test(telefono) || telefono.replace(/\D/g, '').length < 8) {
    return 'El teléfono no tiene un formato válido.';
  }
  return '';
}

const emptyErrors = () => ({
  esNacional: '',
  tipoDocumento: '',
  pais: '',
  nombre: '',
  apellido1: '',
  apellido2: '',
  identificacion: '',
  razonSocial: '',
  nombreComercial: '',
  representanteLegal: '',
  cedulaJuridica: '',
  direccionFiscal: '',
  telefonoOficina: '',
  correo: '',
  password: '',
  confirmPassword: '',
  telefono: '',
  aceptoTerminos: '',
  aceptoPrivacidad: '',
});

const Registro = () => {
  const navigate = useNavigate();
  const sessionUser = getActiveSessionUser();
  const upgradeMode = Boolean(sessionUser) && !puedeComprar(sessionUser);

  const tVolver = useTraducir('Volver');
  const tTitulo = useTraducir('Registro de cliente');
  const tSubtitulo = useTraducir(
    upgradeMode
      ? 'Completá tus datos para obtener el rol de cliente y poder comprar.'
      : 'Registrate como persona natural o persona jurídica para comprar en Café UNA.',
  );
  const tPersona = useTraducir('Persona natural');
  const tEmpresa = useTraducir('Persona jurídica');
  const tNombre = useTraducir('Nombre');
  const tApellido1 = useTraducir('Primer apellido');
  const tApellido2 = useTraducir('Segundo apellido');
  const tCedula = useTraducir('Cédula nacional');
  const tDimex = useTraducir('DIMEX');
  const tPasaporte = useTraducir('Pasaporte');
  const tPais = useTraducir('País de procedencia');
  const tTipoDocumento = useTraducir('Tipo de identificación');
  const tConsultandoCedula = useTraducir('Consultando cédula...');
  const tConsultandoDimex = useTraducir('Consultando DIMEX...');
  const tDatosCargados = useTraducir('Datos cargados automáticamente. Podés editarlos si hace falta.');
  const tRazonSocial = useTraducir('Razón social');
  const tNombreComercial = useTraducir('Nombre comercial');
  const tRepresentante = useTraducir('Nombre del representante legal');
  const tCedulaJuridica = useTraducir('Cédula jurídica');
  const tDireccionFiscal = useTraducir('Dirección fiscal');
  const tTelefonoOficina = useTraducir('Teléfono de oficina');
  const tCorreo = useTraducir('Correo');
  const tPassword = useTraducir('Contraseña');
  const tConfirm = useTraducir('Confirmar contraseña');
  const tTelefono = useTraducir('Teléfono móvil');
  const tTerminos = useTraducir('Acepto los términos y condiciones');
  const tPrivacidad = useTraducir('Acepto las políticas de privacidad');
  const tEnviar = useTraducir(upgradeMode ? 'Ingresar como cliente' : 'Crear cuenta de cliente');
  const tEnviando = useTraducir(upgradeMode ? 'Guardando...' : 'Enviando...');
  const tOpcional = useTraducir('(opcional)');
  const tYaCliente = useTraducir('Tu cuenta ya puede comprar.');
  const tIrCheckout = useTraducir('Ir al checkout');

  const [tipo, setTipo] = useState('persona');
  const [logoUrl, setLogoUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [avisoCedula, setAvisoCedula] = useState('');
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState(emptyErrors);
  const consultaCedulaRef = useRef({ digitos: '', enCurso: false });

  const [form, setForm] = useState({
    esNacional: 'si',
    tipoDocumento: 'cedula',
    pais: 'Costa Rica',
    nombre: '',
    apellido1: '',
    apellido2: '',
    identificacion: '',
    razonSocial: '',
    nombreComercial: '',
    representanteLegal: '',
    cedulaJuridica: '',
    direccionFiscal: '',
    telefonoOficina: '',
    correo: sessionUser?.email || '',
    password: '',
    confirmPassword: '',
    telefono: '',
    aceptoTerminos: false,
    aceptoPrivacidad: false,
  });

  const esNacionalCr = form.tipoDocumento === 'cedula';

  const labelIdentificacion = form.tipoDocumento === 'cedula'
    ? tCedula
    : form.tipoDocumento === 'dimex'
      ? tDimex
      : tPasaporte;

  useEffect(() => {
    let cancelled = false;
    obtenerNavbar()
      .then((data) => {
        if (cancelled) return;
        setLogoUrl(data?.logoUrl || data?.LogoUrl || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionUser && puedeComprar(sessionUser)) {
      const redirect = sessionStorage.getItem('postLoginRedirect') || '/checkout';
      sessionStorage.removeItem('postLoginRedirect');
      navigate({ to: redirect });
      return;
    }
    if (!puedeAbrirRegistroCliente()) {
      navigate({ to: '/checkout' });
    }
  }, [sessionUser, navigate]);

  // Consulta y autocompletado automático de Cédula y DIMEX
  const consultarDatosIdentificacion = useCallback(async (digitos, tipoDoc, { forzar = false } = {}) => {
    const esCedula = tipoDoc === 'cedula' && digitos.length === 9;
    const esDimex = tipoDoc === 'dimex' && (digitos.length >= 10 && digitos.length <= 12);
    if (!esCedula && !esDimex) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula('');

    try {
      const datos = await consultarCedulaDetallada(digitos);
      const nombre = datos?.nombre || datos?.Nombre || '';
      const apellido1 = datos?.primerApellido || datos?.PrimerApellido || '';
      const apellido2 = datos?.segundoApellido || datos?.SegundoApellido || '';

      if (!nombre && !apellido1) {
        consultaCedulaRef.current = { digitos: '', enCurso: false };
        setAvisoCedula(
          tipoDoc === 'dimex'
            ? 'No se encontraron datos automáticos para este DIMEX. Podés completar los campos manualmente.'
            : 'No se encontraron datos para esta cédula. Podés completarlos manualmente.'
        );
        return;
      }

      consultaCedulaRef.current = { digitos, enCurso: false };
      setForm((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre: nombre || prev.nombre,
        apellido1: apellido1 || prev.apellido1,
        apellido2: apellido2 || prev.apellido2,
      }));
      setAvisoCedula(tDatosCargados);
      setErrors((prev) => ({
        ...prev,
        identificacion: '',
        nombre: '',
        apellido1: '',
        apellido2: '',
      }));
    } catch (error) {
      consultaCedulaRef.current = { digitos: '', enCurso: false };
      const mensajeBase = error?.message?.trim() || 'No se pudo consultar el documento.';
      const yaIndicaManual = /manualmente|completar/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : `${mensajeBase} Podés completar los datos manualmente.`
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, [tDatosCargados]);

  // Disparar autocompletado cuando la cédula o DIMEX están completos
  useEffect(() => {
    if (tipo !== 'persona') return undefined;
    const tipoDoc = form.tipoDocumento;
    if (tipoDoc !== 'cedula' && tipoDoc !== 'dimex') return undefined;

    const digitos = tipoDoc === 'cedula'
      ? normalizarCedulaCr(form.identificacion)
      : form.identificacion.replace(/\D/g, '');

    const esValidoParaConsulta =
      (tipoDoc === 'cedula' && digitos.length === 9) ||
      (tipoDoc === 'dimex' && (digitos.length === 11 || digitos.length === 12));

    if (!esValidoParaConsulta) return undefined;
    if (consultaCedulaRef.current.enCurso) return undefined;
    if (consultaCedulaRef.current.digitos === digitos) return undefined;

    const timeoutId = window.setTimeout(() => {
      consultarDatosIdentificacion(digitos, tipoDoc);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [form.identificacion, form.tipoDocumento, tipo, consultarDatosIdentificacion]);

  const handleTipoDocumentoChange = (tipoDoc) => {
    const esNac = tipoDoc === 'cedula';
    setForm((prev) => ({
      ...prev,
      tipoDocumento: tipoDoc,
      esNacional: esNac ? 'si' : 'no',
      pais: esNac ? 'Costa Rica' : prev.pais === 'Costa Rica' ? '' : prev.pais,
      identificacion: '',
      nombre: '',
      apellido1: '',
      apellido2: '',
    }));
    setErrors((prev) => ({
      ...prev,
      tipoDocumento: '',
      identificacion: '',
      pais: '',
    }));
    setAvisoCedula('');
    consultaCedulaRef.current = { digitos: '', enCurso: false };
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setFormError('');
    if (key === 'identificacion') {
      setAvisoCedula('');
      consultaCedulaRef.current = { digitos: '', enCurso: false };
    }
  };

  const validate = () => {
    const next = emptyErrors();

    if (tipo === 'persona') {
      if (form.tipoDocumento !== 'cedula' && form.tipoDocumento !== 'dimex' && form.tipoDocumento !== 'pasaporte') {
        next.tipoDocumento = 'Elegí un tipo de identificación válido.';
      }

      // Validación de País si es extranjero
      if (!esNacionalCr) {
        if (!form.pais?.trim()) {
          next.pais = 'Seleccioná tu país de procedencia.';
        }
      }

      // Validación del número de documento
      if (!form.identificacion.trim()) {
        next.identificacion = `El número de ${labelIdentificacion.toLowerCase()} es obligatorio.`;
      } else if (form.tipoDocumento === 'cedula') {
        const digitos = normalizarCedulaCr(form.identificacion);
        if (digitos.length !== 9) {
          next.identificacion = 'La cédula costarricense debe tener 9 dígitos.';
        }
      } else if (form.tipoDocumento === 'dimex') {
        const digitos = form.identificacion.replace(/\D/g, '');
        if (digitos.length < 10 || digitos.length > 12) {
          next.identificacion = 'El DIMEX debe tener entre 10 y 12 dígitos.';
        }
      } else if (!/^[A-Za-z0-9]{5,20}$/.test(form.identificacion.trim())) {
        next.identificacion = 'El pasaporte no tiene un formato válido (5 a 20 caracteres alfanuméricos).';
      }

      // Nombres y apellidos
      if (!form.nombre.trim()) {
        next.nombre = 'El nombre es obligatorio.';
      } else if (!NOMBRE_RE.test(form.nombre.trim())) {
        next.nombre = 'El nombre solo puede incluir letras y espacios.';
      }

      if (!form.apellido1.trim()) {
        next.apellido1 = 'El primer apellido es obligatorio.';
      } else if (!NOMBRE_RE.test(form.apellido1.trim())) {
        next.apellido1 = 'El apellido solo puede incluir letras y espacios.';
      }

      if (esNacionalCr) {
        if (!form.apellido2.trim()) {
          next.apellido2 = 'El segundo apellido es obligatorio para cédula nacional.';
        } else if (!NOMBRE_RE.test(form.apellido2.trim())) {
          next.apellido2 = 'El apellido solo puede incluir letras y espacios.';
        }
      } else if (form.apellido2.trim() && !NOMBRE_RE.test(form.apellido2.trim())) {
        next.apellido2 = 'El apellido solo puede incluir letras y espacios.';
      }
    } else {
      if (!form.razonSocial.trim()) next.razonSocial = 'La razón social es obligatoria.';
      if (!form.nombreComercial.trim()) {
        next.nombreComercial = 'El nombre comercial es obligatorio.';
      }
      if (!form.representanteLegal.trim()) {
        next.representanteLegal = 'El nombre del representante legal es obligatorio.';
      }
      if (!form.cedulaJuridica.trim()) next.cedulaJuridica = 'La cédula jurídica es obligatoria.';
      else if (!CEDULA_JURIDICA_RE.test(form.cedulaJuridica.trim())) {
        next.cedulaJuridica = 'La cédula jurídica debe tener el formato 3-101-123456.';
      }
      next.telefonoOficina = validarTelefono(form.telefonoOficina, false);
    }

    if (!upgradeMode) {
      if (!form.correo.trim()) next.correo = 'El correo es obligatorio.';
      else if (!EMAIL_RE.test(form.correo.trim())) next.correo = 'El correo no tiene un formato válido.';
      next.password = validarPasswordCliente(form.password);
      if (!form.confirmPassword) next.confirmPassword = 'Confirmá la contraseña.';
      else if (form.password !== form.confirmPassword) {
        next.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    next.telefono = validarTelefono(form.telefono, true);
    if (!form.aceptoTerminos) next.aceptoTerminos = 'Debe aceptar los términos y condiciones.';
    if (!form.aceptoPrivacidad) next.aceptoPrivacidad = 'Debe aceptar las políticas de privacidad.';

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const canSubmit = useMemo(() => {
    if (submitting || consultandoCedula) return false;
    if (!form.aceptoTerminos || !form.aceptoPrivacidad) return false;
    if (!form.telefono.trim()) return false;
    if (tipo === 'persona') {
      if (!form.identificacion.trim() || !form.nombre.trim() || !form.apellido1.trim()) {
        return false;
      }
      if (esNacionalCr && !form.apellido2.trim()) return false;
      if (!esNacionalCr && !form.pais?.trim()) return false;
    }
    if (tipo === 'empresa') {
      if (
        !form.razonSocial.trim()
        || !form.nombreComercial.trim()
        || !form.representanteLegal.trim()
        || !form.cedulaJuridica.trim()
      ) {
        return false;
      }
    }
    if (!upgradeMode) {
      if (!form.correo.trim() || !form.password || !form.confirmPassword) return false;
      if (form.password !== form.confirmPassword) return false;
      if (validarPasswordCliente(form.password)) return false;
    }
    return !Object.values(errors).some(Boolean);
  }, [form, tipo, upgradeMode, submitting, consultandoCedula, errors, esNacionalCr]);

  const buildPayload = () => {
    const payload = {
      tipo,
      telefono: form.telefono.trim(),
      aceptoTerminos: form.aceptoTerminos,
      aceptoPrivacidad: form.aceptoPrivacidad,
    };
    if (tipo === 'persona') {
      payload.esNacional = form.esNacional;
      payload.tipoDocumento = form.tipoDocumento;
      payload.pais = form.tipoDocumento === 'cedula' ? 'Costa Rica' : form.pais.trim();
      payload.nombre = form.nombre.trim();
      payload.apellido1 = form.apellido1.trim();
      if (form.apellido2.trim()) payload.apellido2 = form.apellido2.trim();
      payload.identificacion = form.tipoDocumento === 'cedula' || form.tipoDocumento === 'dimex'
        ? form.identificacion.replace(/\D/g, '')
        : form.identificacion.trim().toUpperCase();
    } else {
      payload.razonSocial = form.razonSocial.trim();
      payload.nombreComercial = form.nombreComercial.trim();
      payload.representanteLegal = form.representanteLegal.trim();
      payload.cedulaJuridica = form.cedulaJuridica.trim();
      if (form.direccionFiscal.trim()) payload.direccionFiscal = form.direccionFiscal.trim();
      if (form.telefonoOficina.trim()) payload.telefonoOficina = form.telefonoOficina.trim();
    }
    if (!upgradeMode) {
      payload.correo = form.correo.trim().toLowerCase();
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) {
      queueFocusFormError({ root: e.currentTarget });
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = buildPayload();
      if (upgradeMode) {
        const result = await completarCliente(payload);
        const token = result?.token || result?.Token;
        if (token) {
          saveAuthenticatedUser(mapAuthenticatedUser(token));
        }
        limpiarIntentRegistroCliente();
        const redirect = sessionStorage.getItem('postLoginRedirect') || '/checkout';
        sessionStorage.removeItem('postLoginRedirect');
        window.location.href = redirect;
        return;
      }

      await registrarCliente(payload);
      sessionStorage.setItem('registroClienteCorreo', payload.correo);
      navigate({
        to: '/verificar-cuenta',
        search: { correo: payload.correo },
      });
    } catch (err) {
      setFormError(sanitizeUserFacingError(err.message || 'No se pudo completar el registro.'));
      queueFocusFormError({ root: e.currentTarget });
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionUser && puedeComprar(sessionUser)) {
    return (
      <main className="login-page registro-page">
        <Link to="/" className="login-back">
          ← <ST>{tVolver}</ST>
        </Link>
        <div className="login-card registro-card">
          <p className="login-success"><ST>{tYaCliente}</ST></p>
          <Button
            type="button"
            className="w-full bg-[#1e2a22] hover:bg-[#2a3a30] text-amber-50 h-11"
            onClick={() => navigate({ to: '/checkout' })}
          >
            <ST>{tIrCheckout}</ST>
          </Button>
        </div>
      </main>
    );
  }

  if (!puedeAbrirRegistroCliente()) {
    return null;
  }

  const field = (key, label, props = {}) => (
    <div className="login-field" key={key}>
      <label htmlFor={key}>
        <ST>{label}</ST>
        {props.optional ? (
          <>
            {' '}
            <span className="registro-optional"><ST>{tOpcional}</ST></span>
          </>
        ) : null}
      </label>
      <Input
        id={key}
        name={key}
        value={form[key]}
        className={cn(
          'transition-all duration-200',
          errors[key] ? 'border-red-500 focus-visible:ring-red-400' : ''
        )}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        onChange={(ev) => setField(key, ev.target.value)}
        {...props.input}
      />
      {errors[key] ? (
        <p id={`${key}-error`} className="login-field-error"><ST>{errors[key]}</ST></p>
      ) : null}
    </div>
  );

  const campoLetras = (key, label, max, extra = {}) => field(key, label, {
    ...extra,
    input: {
      autoComplete: extra.autoComplete,
      maxLength: max,
      onChange: (ev) => setField(key, soloLetras(ev.target.value, max)),
      ...(extra.input || {}),
    },
  });

  const campoTelefono = (key, label, extra = {}) => field(key, label, {
    ...extra,
    input: {
      inputMode: 'tel',
      autoComplete: 'tel',
      maxLength: LIMITE.telefono,
      onChange: (ev) => setField(key, soloTelefono(ev.target.value)),
      ...(extra.input || {}),
    },
  });

  return (
    <main className="login-page registro-page">
      <Link to="/" className="login-back">
        ← <ST>{tVolver}</ST>
      </Link>
      <div className="login-card registro-card">
        <div className="login-brand">
          {logoUrl ? (
            <img className="login-logo" src={normalizeImageUrl(logoUrl, { width: 200 })} alt="Café UNA" />
          ) : (
            <h1 className="registro-title"><ST>{tTitulo}</ST></h1>
          )}
        </div>
        <p className="registro-subtitle"><ST>{tSubtitulo}</ST></p>

        {/* Tipo de cliente: Persona vs Empresa con botones accesibles */}
        <div className="registro-tipo flex rounded-lg p-1 bg-muted/60 border border-border/80 mb-5" role="tablist" aria-label="Tipo de cliente">
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'persona'}
            className={cn(
              'flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer select-none text-center',
              tipo === 'persona'
                ? 'bg-[#1e2a22] text-[#f7f4ee] shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            )}
            onClick={() => {
              setTipo('persona');
              setErrors(emptyErrors());
              setFormError('');
            }}
          >
            <ST>{tPersona}</ST>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'empresa'}
            className={cn(
              'flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer select-none text-center',
              tipo === 'empresa'
                ? 'bg-[#1e2a22] text-[#f7f4ee] shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            )}
            onClick={() => {
              setTipo('empresa');
              setErrors(emptyErrors());
              setFormError('');
              setAvisoCedula('');
            }}
          >
            <ST>{tEmpresa}</ST>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {tipo === 'persona' ? (
            <>
              {/* Selector de Tipo de Documento: Cédula, DIMEX o Pasaporte */}
              <div className="login-field">
                <label id="tipo-doc-label" className="registro-label mb-1.5 block">
                  <ST>{tTipoDocumento}</ST>
                </label>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-labelledby="tipo-doc-label"
                >
                  {[
                    { id: 'cedula', label: tCedula, sublabel: 'Nacional' },
                    { id: 'dimex', label: tDimex, sublabel: 'Residente' },
                    { id: 'pasaporte', label: tPasaporte, sublabel: 'Extranjero' },
                  ].map((doc) => {
                    const isSelected = form.tipoDocumento === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleTipoDocumentoChange(doc.id)}
                        className={cn(
                          'flex flex-col items-center justify-center py-2 px-1.5 rounded-lg border text-center transition-all duration-200 cursor-pointer select-none',
                          isSelected
                            ? 'border-amber-700/80 bg-amber-500/10 text-amber-950 dark:text-amber-100 font-semibold shadow-xs ring-1 ring-amber-700/40'
                            : 'border-border bg-background/70 hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span className="text-xs sm:text-sm">{doc.label}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{doc.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.tipoDocumento ? (
                  <p className="login-field-error"><ST>{errors.tipoDocumento}</ST></p>
                ) : null}
              </div>

              {/* País de procedencia (para extranjeros DIMEX o Pasaporte) con Combobox y búsqueda en vivo */}
              {!esNacionalCr ? (
                <div className="login-field animate-in fade-in-50 duration-200">
                  <label htmlFor="pais">
                    <ST>{tPais}</ST>
                  </label>
                  <CountryCombobox
                    id="pais"
                    name="pais"
                    value={form.pais}
                    onChange={(paisSeleccionado) => setField('pais', paisSeleccionado)}
                    error={Boolean(errors.pais)}
                    ariaDescribedBy={errors.pais ? 'pais-error' : undefined}
                    placeholder="Elegí tu país de procedencia..."
                    searchPlaceholder="Escribí para buscar país..."
                  />
                  {errors.pais ? (
                    <p id="pais-error" className="login-field-error"><ST>{errors.pais}</ST></p>
                  ) : null}
                </div>
              ) : null}

              {/* Número de Identificación con validación y límites por tipo */}
              <div className="registro-grid registro-grid--full">
                {field('identificacion', labelIdentificacion, {
                  input: form.tipoDocumento === 'cedula' || form.tipoDocumento === 'dimex'
                    ? {
                        inputMode: 'numeric',
                        autoComplete: 'off',
                        maxLength: form.tipoDocumento === 'cedula' ? LIMITE.cedula : LIMITE.dimex,
                        placeholder: form.tipoDocumento === 'cedula' ? '9 dígitos (sin guiones)' : '10 a 12 dígitos',
                        onChange: (ev) => setField(
                          'identificacion',
                          soloDigitos(
                            ev.target.value,
                            form.tipoDocumento === 'cedula' ? LIMITE.cedula : LIMITE.dimex,
                          ),
                        ),
                      }
                    : {
                        autoComplete: 'off',
                        maxLength: LIMITE.pasaporte,
                        placeholder: 'Número de pasaporte (letras y números)',
                        onChange: (ev) => setField(
                          'identificacion',
                          ev.target.value
                            .replace(/[^A-Za-z0-9]/g, '')
                            .toUpperCase()
                            .slice(0, LIMITE.pasaporte),
                        ),
                      },
                })}
              </div>

              {/* Feedback visual de autocompletado TSE / DIMEX */}
              {(form.tipoDocumento === 'cedula' || form.tipoDocumento === 'dimex') && consultandoCedula ? (
                <p className="registro-cedula-aviso text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping inline-block" />
                  <ST>{form.tipoDocumento === 'dimex' ? tConsultandoDimex : tConsultandoCedula}</ST>
                </p>
              ) : null}
              {avisoCedula ? (
                <p className="registro-cedula-aviso text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <ST>{avisoCedula}</ST>
                </p>
              ) : null}

              {campoLetras('nombre', tNombre, LIMITE.nombre, { autoComplete: 'given-name' })}
              <div className="registro-grid">
                {campoLetras('apellido1', tApellido1, LIMITE.apellido, { autoComplete: 'family-name' })}
                {campoLetras('apellido2', tApellido2, LIMITE.apellido, {
                  optional: !esNacionalCr,
                  autoComplete: 'additional-name',
                })}
              </div>
            </>
          ) : (
            <>
              <div className="registro-grid">
                {field('razonSocial', tRazonSocial, {
                  input: {
                    autoComplete: 'organization',
                    maxLength: LIMITE.razonSocial,
                    onChange: (ev) => setField(
                      'razonSocial',
                      ev.target.value.slice(0, LIMITE.razonSocial),
                    ),
                  },
                })}
                {field('nombreComercial', tNombreComercial, {
                  input: {
                    autoComplete: 'organization',
                    maxLength: LIMITE.nombreComercial,
                    onChange: (ev) => setField(
                      'nombreComercial',
                      ev.target.value.slice(0, LIMITE.nombreComercial),
                    ),
                  },
                })}
              </div>
              <div className="registro-grid">
                {field('cedulaJuridica', tCedulaJuridica, {
                  input: {
                    placeholder: '3-101-123456',
                    inputMode: 'numeric',
                    maxLength: LIMITE.cedulaJuridica,
                    onChange: (ev) => setField(
                      'cedulaJuridica',
                      formatearCedulaJuridica(ev.target.value),
                    ),
                  },
                })}
                {campoLetras('representanteLegal', tRepresentante, LIMITE.representanteLegal)}
              </div>
              <div className="registro-grid">
                {field('direccionFiscal', tDireccionFiscal, {
                  optional: true,
                  input: {
                    maxLength: LIMITE.direccionFiscal,
                    onChange: (ev) => setField(
                      'direccionFiscal',
                      ev.target.value.slice(0, LIMITE.direccionFiscal),
                    ),
                  },
                })}
                {campoTelefono('telefonoOficina', tTelefonoOficina, { optional: true })}
              </div>
            </>
          )}

          {!upgradeMode ? (
            <>
              <div className="registro-grid">
                {field('correo', tCorreo, {
                  input: {
                    type: 'email',
                    autoComplete: 'email',
                    maxLength: LIMITE.correo,
                    onChange: (ev) => setField('correo', soloCorreo(ev.target.value)),
                  },
                })}
                {campoTelefono('telefono', tTelefono)}
              </div>
              <div className="registro-grid">
                <div className="login-field">
                  <label htmlFor="password"><ST>{tPassword}</ST></label>
                  <PasswordField
                    id="password"
                    value={form.password}
                    onChange={(ev) => setField('password', ev.target.value)}
                    visible={showPass}
                    onToggle={() => setShowPass((v) => !v)}
                    ariaInvalid={Boolean(errors.password)}
                    ariaDescribedBy={errors.password ? 'password-error' : undefined}
                    maxLength={LIMITE.password}
                  />
                  {errors.password ? (
                    <p id="password-error" className="login-field-error"><ST>{errors.password}</ST></p>
                  ) : null}
                </div>
                <div className="login-field">
                  <label htmlFor="confirmPassword"><ST>{tConfirm}</ST></label>
                  <PasswordField
                    id="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(ev) => setField('confirmPassword', ev.target.value)}
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    ariaInvalid={Boolean(errors.confirmPassword)}
                    ariaDescribedBy={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    maxLength={LIMITE.password}
                  />
                  {errors.confirmPassword ? (
                    <p id="confirmPassword-error" className="login-field-error">
                      <ST>{errors.confirmPassword}</ST>
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <p className="registro-session-note">
              <ST>Sesión iniciada con</ST> <strong>{sessionUser.email}</strong>.
            </p>
          )}

          <div className="registro-checks">
            <label className={cn('registro-check', form.aceptoTerminos && 'is-checked', errors.aceptoTerminos && 'is-error')}>
              <input
                type="checkbox"
                name="aceptoTerminos"
                checked={form.aceptoTerminos}
                onChange={(ev) => setField('aceptoTerminos', ev.target.checked)}
              />
              <span className="registro-check__box" aria-hidden="true" />
              <span className="registro-check__text"><ST>{tTerminos}</ST></span>
            </label>
            {errors.aceptoTerminos ? (
              <p className="login-field-error"><ST>{errors.aceptoTerminos}</ST></p>
            ) : null}

            <label className={cn('registro-check', form.aceptoPrivacidad && 'is-checked', errors.aceptoPrivacidad && 'is-error')}>
              <input
                type="checkbox"
                name="aceptoPrivacidad"
                checked={form.aceptoPrivacidad}
                onChange={(ev) => setField('aceptoPrivacidad', ev.target.checked)}
              />
              <span className="registro-check__box" aria-hidden="true" />
              <span className="registro-check__text"><ST>{tPrivacidad}</ST></span>
            </label>
            {errors.aceptoPrivacidad ? (
              <p className="login-field-error"><ST>{errors.aceptoPrivacidad}</ST></p>
            ) : null}
          </div>

          {formError ? <p className="login-error" role="alert"><ST>{formError}</ST></p> : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1e2a22] hover:bg-[#2a3a30] text-amber-50 h-11 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
          >
            <ST>{submitting ? tEnviando : tEnviar}</ST>
          </Button>
        </form>

        {!upgradeMode ? (
          <p className="login-footer">
            <ST>¿Ya tenés cuenta?</ST>{' '}
            <Link to="/login" className="login-link font-medium hover:underline text-amber-900 dark:text-amber-300">
              <ST>Iniciar sesión</ST>
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
};

export default Registro;
