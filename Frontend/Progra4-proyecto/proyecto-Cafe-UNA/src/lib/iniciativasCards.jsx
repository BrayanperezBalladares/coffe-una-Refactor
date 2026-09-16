import { HeartHandshake, Compass, Users } from 'lucide-react';

export const ESTILOS_INICIATIVA = {
  donaciones: {
    accentColor: '#9a3412',
    accentBg: '#fff7ed',
    borderColor: '#fed7aa',
  },
  visitas: {
    accentColor: '#78350f',
    accentBg: '#fefce8',
    borderColor: '#fef08a',
  },
  voluntariado: {
    accentColor: '#166534',
    accentBg: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
};

export const ICONOS_INICIATIVA = {
  donaciones: <HeartHandshake size={22} strokeWidth={1.8} aria-hidden="true" />,
  visitas: <Compass size={22} strokeWidth={1.8} aria-hidden="true" />,
  voluntariado: <Users size={22} strokeWidth={1.8} aria-hidden="true" />,
};

const TEXTOS_DEFAULT_BOTON = {
  donaciones: 'Hacer una donación',
  visitas: 'Agendar una visita',
  voluntariado: 'Sumarme como voluntario',
};

export function buildIniciativasCards(tarjetas = []) {
  return tarjetas.map((tarjeta) => {
    const clave = (tarjeta.clave || '').toLowerCase();
    const estilo = ESTILOS_INICIATIVA[clave] || {};
    let ruta = tarjeta.ruta || '';
    if (clave === 'donaciones') {
      const actual = String(ruta).trim();
      if (!actual || actual.startsWith('/donaciones/necesidades')) {
        ruta = '/donaciones/solicitar';
      }
    }
    if (clave === 'visitas') {
      const actual = String(ruta).trim();
      if (!actual || actual === '/visitas' || actual.startsWith('/visitas')) {
        ruta = '/visitas/solicitar';
      }
    }

    const rawBtn = String(tarjeta.textoBoton || '').trim();
    const isGenericForm = !rawBtn || rawBtn.toLowerCase() === 'formulario' || rawBtn.toLowerCase() === 'form';
    const textoBoton = isGenericForm
      ? (TEXTOS_DEFAULT_BOTON[clave] || 'Conocer más')
      : rawBtn;

    return {
      id: clave || tarjeta.clave,
      etiqueta: tarjeta.etiqueta,
      titulo: tarjeta.titulo,
      descripcion: tarjeta.descripcion,
      ruta,
      textoBoton,
      icono: ICONOS_INICIATIVA[clave] ?? null,
      accentColor: estilo.accentColor,
      accentBg: estilo.accentBg,
      borderColor: estilo.borderColor,
    };
  });
}

