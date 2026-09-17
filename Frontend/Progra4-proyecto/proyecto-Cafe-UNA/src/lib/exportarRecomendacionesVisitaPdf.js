import {
  LOGO_ASPECT_RATIO,
  LOGO_CAFE_UNA_JPEG_BASE64,
  LOGO_HEIGHT_PX,
  LOGO_WIDTH_PX,
} from "./logoCafeUnaBase64";
import { cargarLogoWebpParaPdf, descargarArchivo, obtenerLogoDefault } from "./exportarDonacionesPdf";

const WIN1252 = {
  Á: 0xc1,
  É: 0xc9,
  Í: 0xcd,
  Ó: 0xd3,
  Ú: 0xda,
  Ü: 0xdc,
  Ñ: 0xd1,
  á: 0xe1,
  é: 0xe9,
  í: 0xed,
  ó: 0xf3,
  ú: 0xfa,
  ü: 0xfc,
  ñ: 0xf1,
  "¿": 0xbf,
  "¡": 0xa1,
  "—": 0x97,
  "–": 0x96,
  "·": 0xb7,
  "°": 0xb0,
  "•": 0x95,
};

function pdfEscape(texto) {
  const bytes = [];
  for (const ch of String(texto ?? "")) {
    if (ch === "\\" || ch === "(" || ch === ")") {
      bytes.push(0x5c, ch.charCodeAt(0));
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 128) {
      bytes.push(code);
      continue;
    }
    bytes.push(WIN1252[ch] ?? 0x3f);
  }
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

function pdfText(x, y, texto, size = 10, font = "/F1", gray = 0) {
  return `q ${gray} g BT ${font} ${size} Tf ${x} ${y} Td (${pdfEscape(texto)}) Tj ET Q`;
}

function pdfLineStroke(x1, y1, x2, y2, gray = 0.6, width = 0.5) {
  return `q ${gray} G ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function pdfRectFill(x, y, w, h, gray = 0.92) {
  return `q ${gray} g ${x} ${y} ${w} ${h} re f Q`;
}

function ensamblarPdf(paginas, pageWidth, pageHeight, logoData = null) {
  const objects = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");

  const logoObjNum = logoData ? 5 : null;
  const firstPageNum = logoData ? 6 : 5;

  const kids = paginas.map((_, i) => `${firstPageNum + i * 2} 0 R`).join(" ");
  objects.push(
    `2 0 obj << /Type /Pages /Count ${paginas.length} /Kids [${kids}] >> endobj`,
  );

  // Fonts: F1 = Helvetica, F2 = Helvetica-Bold
  objects.push(
    "3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj",
  );
  objects.push(
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj",
  );

  if (logoData && logoData.binary) {
    objects.push(
      `5 0 obj << /Type /XObject /Subtype /Image /Width ${logoData.width} /Height ${logoData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoData.binary.length} >> stream\n${logoData.binary}\nendstream endobj`,
    );
  }

  paginas.forEach((content, i) => {
    const pageNum = firstPageNum + i * 2;
    const contentNum = pageNum + 1;
    const xObjectRes = logoData ? `/XObject << /ImLogo ${logoObjNum} 0 R >>` : "";
    objects.push(
      `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectRes} >> /Contents ${contentNum} 0 R >> endobj`,
    );
    objects.push(
      `${contentNum} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

/**
 * Genera el documento oficial en PDF con las recomendaciones de visita para la Finca Experimental Santa Lucía.
 */
export function construirPdfRecomendacionesVisita({
  fechaEmision = new Date().toLocaleDateString("es-CR"),
  logoData = obtenerLogoDefault(),
} = {}) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const innerWidth = pageWidth - 2 * margin;

  const ops = [];
  const paginas = [];
  let y = pageHeight - margin;

  // 1. Encabezado con Logo oficial y membrete institucional
  if (logoData) {
    const logoH = 38;
    const logoW = Math.round(logoH * (logoData.aspectRatio || LOGO_ASPECT_RATIO || 1.95));
    const logoX = margin;
    const logoY = y - logoH + 2;
    ops.push(`q ${logoW} 0 0 ${logoH} ${logoX} ${logoY} cm /ImLogo Do Q`);

    const textX = margin + logoW + 16;
    ops.push(pdfText(textX, y - 4, "UNIVERSIDAD NACIONAL DE COSTA RICA", 7.5, "/F2", 0.35));
    ops.push(pdfText(textX, y - 16, "Recomendaciones para Visitas a Campo", 13.5, "/F2", 0.05));
    ops.push(pdfText(textX, y - 29, "Finca Experimental Santa Lucía · Proyecto Café UNA", 8.5, "/F1", 0.3));
  } else {
    ops.push(pdfText(margin, y, "Café-UNA · Universidad Nacional", 16, "/F2", 0));
    ops.push(pdfText(margin, y - 16, "Recomendaciones para Visitas a Campo", 13.5, "/F2", 0));
    ops.push(pdfText(margin, y - 29, "Finca Experimental Santa Lucía", 8.5, "/F1", 0.3));
  }

  // Badge en la esquina superior derecha
  const badgeW = 115;
  const badgeH = 24;
  const badgeX = pageWidth - margin - badgeW;
  ops.push(pdfRectFill(badgeX, y - 20, badgeW, badgeH, 0.94));
  ops.push(pdfLineStroke(badgeX, y - 20, badgeX + badgeW, y - 20, 0.75, 0.5));
  ops.push(pdfText(badgeX + 12, y - 9, "GUÍA DEL VISITANTE", 8, "/F2", 0.15));
  ops.push(pdfText(badgeX + 12, y - 18, `Emisión: ${fechaEmision}`, 7, "/F1", 0.4));

  y -= 48;
  ops.push(pdfLineStroke(margin, y, margin + innerWidth, y, 0.7, 0.8));
  y -= 18;

  // 2. Banner de introducción
  const bannerH = 46;
  ops.push(pdfRectFill(margin, y - bannerH + 12, innerWidth, bannerH, 0.96));
  ops.push(pdfLineStroke(margin, y - bannerH + 12, margin + innerWidth, y - bannerH + 12, 0.8, 0.5));
  ops.push(pdfText(margin + 12, y, "Bienvenida y preparación para el recorrido agrícola", 9.5, "/F2", 0.1));
  ops.push(
    pdfText(
      margin + 12,
      y - 13,
      "Para garantizar una visita segura, enriquecedora y placentera en nuestras parcelas e instalaciones,",
      8.5,
      "/F1",
      0.25,
    ),
  );
  ops.push(
    pdfText(
      margin + 12,
      y - 25,
      "solicitamos a cada persona visitante tomar en cuenta las siguientes directrices institucionales.",
      8.5,
      "/F1",
      0.25,
    ),
  );

  y -= bannerH + 16;

  // Helper para secciones con items
  function renderSeccion(num, titulo, items) {
    ops.push(pdfRectFill(margin, y - 2, innerWidth, 17, 0.92));
    ops.push(pdfText(margin + 8, y + 2, `${num}. ${titulo.toUpperCase()}`, 8.5, "/F2", 0.1));
    y -= 17;

    items.forEach(([subtitulo, detalle]) => {
      ops.push(pdfText(margin + 10, y, "•", 9, "/F2", 0.4));
      ops.push(pdfText(margin + 20, y, subtitulo, 8.5, "/F2", 0.1));
      const detX = margin + 20 + subtitulo.length * 4.6 + 6;
      ops.push(pdfText(detX, y, detalle.slice(0, 75), 8.5, "/F1", 0.25));
      y -= 14;
    });
    y -= 8;
  }

  // 3. Secciones del documento
  renderSeccion("1", "Vestimenta y Calzado Recomendado", [
    [
      "Calzado cerrado:",
      "Indispensable para senderos y terreno irregular. No se permite calzado abierto.",
    ],
    [
      "Ropa fresca y cómoda:",
      "Se sugiere pantalón largo para protección contra sol, ramas y vegetación.",
    ],
    [
      "Protección para la cabeza:",
      "Uso de gorra o sombrero para los tramos al aire libre.",
    ],
  ]);

  renderSeccion("2", "Protección Personal y Salud", [
    [
      "Repelente de insectos:",
      "Recomendado en zonas de cultivo bajo sombra y senderos boscosos.",
    ],
    [
      "Protección solar:",
      "Aplicar protector solar previamente y portar hidratación adecuada.",
    ],
    [
      "Botella reutilizable:",
      "Disponemos de puntos de agua para promover la reducción de plásticos.",
    ],
    [
      "Capa o impermeable ligero:",
      "El clima en Barva de Heredia es fresco de montaña y puede presentar lloviznas.",
    ],
  ]);

  renderSeccion("3", "Logística de Llegada y Parqueo", [
    [
      "Puntualidad:",
      "Presentarse 15 minutos antes de la hora acordada para el registro del grupo.",
    ],
    [
      "Ubicación:",
      "Finca Experimental Santa Lucía, Escuela de Ciencias Agrarias, Barva de Heredia.",
    ],
    [
      "Área de estacionamiento:",
      "Parqueo seguro para vehículos y busetas. Notificar si traen autobús grande.",
    ],
    [
      "Accesibilidad y apoyo:",
      "Indicar con anticipación si algún participante requiere asistencia de movilidad.",
    ],
  ]);

  renderSeccion("4", "Normas de Seguridad y Convivencia en Campo", [
    [
      "Respeto a las parcelas:",
      "No cortar frutos, ramas ni alterar dispositivos de investigación agrícola.",
    ],
    [
      "Finca libre de residuos:",
      "Retornar con los residuos generados o utilizar las estaciones de reciclaje.",
    ],
    [
      "Guía y acompañamiento:",
      "Permanecer en compañía del personal autorizado y sobre los senderos marcados.",
    ],
  ]);

  // 4. Bloque institucional de Contacto
  const contactoH = 44;
  ops.push(pdfRectFill(margin, y - contactoH + 12, innerWidth, contactoH, 0.95));
  ops.push(pdfLineStroke(margin, y - contactoH + 12, margin + innerWidth, y - contactoH + 12, 0.75, 0.5));
  ops.push(pdfText(margin + 12, y, "Contacto y Coordinación Institucional", 8.5, "/F2", 0.1));
  ops.push(
    pdfText(
      margin + 12,
      y - 12,
      "Escuela de Ciencias Agrarias · Universidad Nacional · Barva de Heredia, Costa Rica",
      8,
      "/F1",
      0.3,
    ),
  );
  ops.push(
    pdfText(
      margin + 12,
      y - 23,
      "Consultas y confirmaciones: cafeuna@una.cr   |   Web: coffe-una-refactor.vercel.app",
      8,
      "/F1",
      0.3,
    ),
  );

  // 5. Pie de página formal
  const footerY = margin + 14;
  ops.push(pdfLineStroke(margin, footerY + 8, margin + innerWidth, footerY + 8, 0.65, 0.5));
  ops.push(
    pdfText(
      margin,
      footerY,
      "Café-UNA · Finca Experimental Santa Lucía · Universidad Nacional de Costa Rica",
      7.5,
      "/F1",
      0.4,
    ),
  );
  ops.push(
    pdfText(
      pageWidth - margin - 110,
      footerY,
      "Documento Informativo Oficial",
      7.5,
      "/F2",
      0.3,
    ),
  );

  paginas.push(ops.join("\n"));

  return ensamblarPdf(paginas, pageWidth, pageHeight, logoData);
}

/**
 * Descarga el PDF de recomendaciones de visita en el navegador del usuario.
 */
export async function descargarRecomendacionesVisitaPdf({
  nombreArchivo = "Recomendaciones-Visitas-Cafe-UNA.pdf",
  logoUrl = "/logo.webp",
} = {}) {
  const logoData = await cargarLogoWebpParaPdf(logoUrl);
  const pdfString = construirPdfRecomendacionesVisita({ logoData });
  descargarArchivo(nombreArchivo, pdfString, "application/pdf", { binario: true });
}
