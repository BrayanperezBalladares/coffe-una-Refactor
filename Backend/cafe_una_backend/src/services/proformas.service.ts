import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  PageSizes,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventarioStockUbicacion } from '../entities/inventario-stock-ubicacion.entity';
import { InventarioUbicacion } from '../entities/inventario-ubicacion.entity';
import { Producto } from '../entities/producto.entity';
import { LOGO_CAFE_UNA_JPEG_BASE64 } from '../assets/logo-cafe-una';
import { esPuntoVentaCliente } from './inventario.service';

type ProformaItemInput = {
  id?: unknown;
  productoId?: unknown;
  ProductoId?: unknown;
  cantidad?: unknown;
  Cantidad?: unknown;
};

export type ProformaBody = {
  clienteNombre?: unknown;
  clienteCorreo?: unknown;
  ubicacionCodigo?: unknown;
  ubicacionId?: unknown;
  items?: unknown;
};

export type ProformaUser = {
  nombre?: unknown;
  correo?: unknown;
};

export type ProformaResumen = {
  clienteNombre: string;
  clienteCorreo: string;
  ubicacionCodigo: string;
  ubicacionNombre: string;
  items: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  impuestos: number;
  total: number;
};

export type ProformaResult = {
  pdf: Uint8Array;
  filename: 'proforma.pdf';
  resumen: ProformaResumen;
};

@Injectable()
export class ProformasService {
  constructor(
    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,
    @InjectRepository(InventarioUbicacion)
    private readonly ubicacionesRepository: Repository<InventarioUbicacion>,
    @InjectRepository(InventarioStockUbicacion)
    private readonly stockRepository: Repository<InventarioStockUbicacion>,
  ) {}

  async generar(
    body: ProformaBody,
    usuario: ProformaUser = {},
  ): Promise<ProformaResult> {
    const itemsSolicitados = this.validarItems(body?.items);
    const ubicacion = await this.resolverUbicacion(body);
    const productos = await this.productosRepository.find({
      where: { Id: In(itemsSolicitados.map((item) => item.productoId)) },
    });
    const porId = new Map(
      productos.map((producto) => [String(producto.Id), producto]),
    );
    const saldos = await this.stockRepository.find({
      where: {
        ProductoId: In(itemsSolicitados.map((item) => item.productoId)),
        UbicacionId: ubicacion.Id,
      },
    });
    const stockPorProducto = new Map(
      saldos.map((saldo) => [
        String(saldo.ProductoId),
        Number(saldo.Stock) || 0,
      ]),
    );

    let subtotal = 0;
    const items = itemsSolicitados.map((solicitado) => {
      const producto = porId.get(solicitado.productoId);
      if (!producto) {
        throw new BadRequestException(
          `No se encontró el producto con id ${solicitado.productoId}.`,
        );
      }
      if (String(producto.Estado || '').toLowerCase() === 'deshabilitado') {
        throw new BadRequestException(
          `El producto ${producto.Nombre} está deshabilitado.`,
        );
      }
      if (producto.Disponible === false) {
        throw new BadRequestException(
          `El producto ${producto.Nombre} no está disponible.`,
        );
      }

      const stock = stockPorProducto.get(solicitado.productoId) ?? 0;
      if (stock < solicitado.cantidad) {
        throw new BadRequestException(
          `No hay stock suficiente de ${producto.Nombre} en ${ubicacion.Nombre}. Disponible: ${stock}.`,
        );
      }

      const precioNormal = this.numero(producto.PrecioNormal);
      const precioConIva = this.numero(producto.PrecioConIVA, precioNormal);
      const precioUnitario = precioConIva > 0 ? precioConIva : precioNormal;
      const lineSubtotal = this.redondear(precioUnitario * solicitado.cantidad);
      const baseUnitario = precioNormal > 0 ? precioNormal : precioUnitario;
      subtotal += this.redondear(baseUnitario * solicitado.cantidad);

      return {
        productoId: String(producto.Id),
        nombre: String(producto.Nombre || ''),
        cantidad: solicitado.cantidad,
        precioUnitario,
        subtotal: lineSubtotal,
      };
    });

    subtotal = this.redondear(subtotal);
    const total = this.redondear(
      items.reduce((sum, item) => sum + item.subtotal, 0),
    );
    const impuestos = this.redondear(Math.max(0, total - subtotal));
    const clienteNombre = this.texto(
      body?.clienteNombre,
      this.texto(usuario?.nombre, 'Cliente'),
    );
    const clienteCorreo = this.texto(
      body?.clienteCorreo,
      this.texto(usuario?.correo, ''),
    );
    const resumen: ProformaResumen = {
      clienteNombre,
      clienteCorreo,
      ubicacionCodigo: ubicacion.Codigo,
      ubicacionNombre: ubicacion.Nombre,
      items,
      subtotal,
      impuestos,
      total,
    };

    return {
      pdf: await this.generarPdf(resumen),
      filename: 'proforma.pdf',
      resumen,
    };
  }

  private async resolverUbicacion(
    body: ProformaBody,
  ): Promise<InventarioUbicacion> {
    const codigo = this.texto(body?.ubicacionCodigo, '').toUpperCase();
    const id = Number(body?.ubicacionId);
    const ubicacion = codigo
      ? await this.ubicacionesRepository.findOne({ where: { Codigo: codigo } })
      : Number.isInteger(id) && id > 0
        ? await this.ubicacionesRepository.findOne({ where: { Id: id } })
        : null;

    if (!ubicacion || !esPuntoVentaCliente(ubicacion.Codigo)) {
      throw new BadRequestException('Seleccioná un punto de venta válido.');
    }
    if (ubicacion.Activo === false) {
      throw new BadRequestException(
        'El punto de venta seleccionado está inactivo.',
      );
    }
    return ubicacion;
  }

  private validarItems(
    raw: unknown,
  ): Array<{ productoId: string; cantidad: number }> {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new BadRequestException(
        'La proforma debe incluir al menos un producto.',
      );
    }
    if (raw.length > 100) {
      throw new BadRequestException(
        'La proforma no puede incluir más de 100 productos.',
      );
    }
    const parsed = raw.map((item) => {
      const value = (item ?? {}) as ProformaItemInput;
      const productoIdRaw = value.productoId ?? value.ProductoId ?? value.id;
      const productoId =
        typeof productoIdRaw === 'string' || typeof productoIdRaw === 'number'
          ? String(productoIdRaw).trim()
          : '';
      const cantidad = Number(value.cantidad ?? value.Cantidad ?? 0);
      if (!productoId) {
        throw new BadRequestException(
          'Cada ítem requiere un identificador de producto.',
        );
      }
      if (!/^\d+$/.test(productoId) || BigInt(productoId) <= 0n) {
        throw new BadRequestException(
          'El identificador del producto no es válido.',
        );
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new BadRequestException(
          'La cantidad debe ser un entero positivo.',
        );
      }
      return { productoId, cantidad };
    });
    const acumulados = new Map<string, number>();
    for (const item of parsed) {
      acumulados.set(
        item.productoId,
        (acumulados.get(item.productoId) ?? 0) + item.cantidad,
      );
    }
    return Array.from(acumulados, ([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));
  }

  private numero(value: unknown, fallback = 0): number {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  private redondear(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private texto(value: unknown, fallback: string): string {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
  }

  private async generarPdf(resumen: ProformaResumen): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    pdf.setTitle('Proforma de compra - Café UNA');
    pdf.setSubject(
      `Proforma informativa no vinculante - ${resumen.ubicacionCodigo}. No reserva inventario ni crea una compra.`,
    );
    pdf.setAuthor('Café UNA');
    pdf.setCreator('Café UNA');
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const officialLogo = await pdf.embedJpg(LOGO_CAFE_UNA_JPEG_BASE64);
    const margin = 42;
    const [pageWidth, pageHeight] = [PageSizes.A4[1], PageSizes.A4[0]];
    const contentBottom = 66;
    const ink = rgb(0.12, 0.12, 0.12);
    const muted = rgb(0.31, 0.31, 0.31);
    const headerInk = rgb(0.16, 0.16, 0.16);
    const accent = rgb(0.72, 0.06, 0.08);
    const rowFill = rgb(0.95, 0.95, 0.95);
    const pages: PDFPage[] = [];

    let page = pdf.addPage([pageWidth, pageHeight]);
    pages.push(page);
    let y = pageHeight - margin;

    const drawText = (
      target: PDFPage,
      text: string,
      x: number,
      baseline: number,
      size: number,
      textFont: PDFFont = font,
      color = ink,
    ) => {
      target.drawText(this.limpiarPdf(text), {
        x,
        y: baseline,
        size,
        font: textFont,
        color,
      });
    };
    const drawRight = (
      target: PDFPage,
      text: string,
      right: number,
      baseline: number,
      size: number,
      textFont: PDFFont = font,
      color = ink,
    ) => {
      const clean = this.limpiarPdf(text);
      drawText(
        target,
        clean,
        right - textFont.widthOfTextAtSize(clean, size),
        baseline,
        size,
        textFont,
        color,
      );
    };
    const logoHeight = 36;
    const logoWidth = logoHeight * (officialLogo.width / officialLogo.height);
    const headerTextX = margin + logoWidth + 16;
    const headerTextWidth = pageWidth - margin - headerTextX;
    const drawLogo = (target: PDFPage) => {
      const logoX = margin;
      const logoY = pageHeight - margin - logoHeight;
      target.drawImage(officialLogo, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
    };
    const drawWrapped = (
      target: PDFPage,
      text: string,
      x: number,
      top: number,
      size: number,
      maxWidth: number,
      textFont: PDFFont = font,
      lineHeight = size + 3,
      color = ink,
      maxLines?: number,
    ) => {
      const lines = this.envolverTexto(
        text,
        textFont,
        size,
        maxWidth,
        maxLines,
      );
      lines.forEach((line, index) =>
        drawText(target, line, x, top - index * lineHeight, size, textFont, color),
      );
      return lines.length * lineHeight;
    };
    const drawHeader = (target: PDFPage, continuation = false) => {
      drawLogo(target);
      drawText(
        target,
        continuation ? 'Proforma de compra (continuación)' : 'Proforma de compra',
        headerTextX,
        pageHeight - margin - 2,
        18,
        bold,
        ink,
      );
      drawText(
        target,
        'Cotización informativa no vinculante',
        headerTextX,
        pageHeight - margin - 24,
        10,
        font,
        muted,
      );
      let metaY = pageHeight - margin - 45;
      metaY -= drawWrapped(
        target,
        `Cliente: ${resumen.clienteNombre}`,
        headerTextX,
        metaY,
        9,
        headerTextWidth,
        font,
        12,
        muted,
        2,
      );
      metaY -= drawWrapped(
        target,
        `Correo: ${resumen.clienteCorreo || 'No indicado'}`,
        headerTextX,
        metaY,
        9,
        headerTextWidth,
        font,
        12,
        muted,
        2,
      );
      metaY -= drawWrapped(
        target,
        `Punto de retiro: ${resumen.ubicacionCodigo} - ${resumen.ubicacionNombre}`,
        headerTextX,
        metaY,
        9,
        headerTextWidth,
        font,
        12,
        muted,
        2,
      );
      const dividerY = metaY - 6;
      target.drawLine({
        start: { x: margin, y: dividerY },
        end: { x: pageWidth - margin, y: dividerY },
        thickness: 0.8,
        color: rgb(0.63, 0.63, 0.63),
      });
      return dividerY - 16;
    };
    const columns = {
      productX: margin + 7,
      productWidth: 440,
      quantityRight: 590,
      unitRight: 712,
      subtotalRight: pageWidth - margin - 7,
    };
    const drawTableHeader = (target: PDFPage, top: number) => {
      target.drawRectangle({
        x: margin,
        y: top - 24,
        width: pageWidth - margin * 2,
        height: 24,
        color: headerInk,
      });
      drawText(target, 'PRODUCTO', columns.productX, top - 16, 9, bold, rgb(1, 1, 1));
      drawRight(target, 'CANT.', columns.quantityRight, top - 16, 9, bold, rgb(1, 1, 1));
      drawRight(target, 'PRECIO UNIT.', columns.unitRight, top - 16, 9, bold, rgb(1, 1, 1));
      drawRight(target, 'SUBTOTAL', columns.subtotalRight, top - 16, 9, bold, rgb(1, 1, 1));
      return top - 34;
    };
    const startContinuationPage = () => {
      page = pdf.addPage([pageWidth, pageHeight]);
      pages.push(page);
      return drawTableHeader(page, drawHeader(page, true));
    };
    const startSummaryPage = () => {
      page = pdf.addPage([pageWidth, pageHeight]);
      pages.push(page);
      return drawHeader(page, true) - 12;
    };
    y = drawTableHeader(page, drawHeader(page));
    for (const [index, item] of resumen.items.entries()) {
      const productLines = this.envolverTexto(
        item.nombre,
        font,
        8.5,
        columns.productWidth,
      );
      let lineIndex = 0;
      while (lineIndex < productLines.length) {
        if (y - 22 < contentBottom) {
          y = startContinuationPage();
        }
        const availableLineCount = Math.max(
          1,
          Math.floor((y - contentBottom - 8) / 11),
        );
        const linesForSegment = productLines.slice(
          lineIndex,
          lineIndex + availableLineCount,
        );
        const rowHeight = Math.max(22, linesForSegment.length * 11 + 8);
        if (index % 2 === 1) {
          page.drawRectangle({
            x: margin,
            y: y - rowHeight,
            width: pageWidth - margin * 2,
            height: rowHeight,
            color: rowFill,
          });
        }
        linesForSegment.forEach((line, segmentIndex) =>
          drawText(
            page,
            line,
            columns.productX,
            y - 14 - segmentIndex * 11,
            8.5,
            font,
            ink,
          ),
        );
        if (lineIndex === 0) {
          drawRight(
            page,
            String(item.cantidad),
            columns.quantityRight,
            y - 14,
            8.5,
            font,
            ink,
          );
          drawRight(
            page,
            this.moneda(item.precioUnitario),
            columns.unitRight,
            y - 14,
            8.5,
            font,
            ink,
          );
          drawRight(
            page,
            this.moneda(item.subtotal),
            columns.subtotalRight,
            y - 14,
            8.5,
            font,
            ink,
          );
        }
        page.drawLine({
          start: { x: margin, y: y - rowHeight },
          end: { x: pageWidth - margin, y: y - rowHeight },
          thickness: 0.35,
          color: rgb(0.82, 0.82, 0.82),
        });
        y -= rowHeight;
        lineIndex += linesForSegment.length;
      }
    }

    if (y - 100 < contentBottom) {
      y = startSummaryPage();
    }
    y -= 14;
    const totalsX = 610;
    drawRight(page, `Subtotal: ${this.moneda(resumen.subtotal)}`, columns.subtotalRight, y, 10, font, ink);
    y -= 16;
    drawRight(page, `Impuestos: ${this.moneda(resumen.impuestos)}`, columns.subtotalRight, y, 10, font, ink);
    y -= 7;
    page.drawLine({
      start: { x: totalsX, y },
      end: { x: columns.subtotalRight, y },
      thickness: 0.8,
      color: rgb(0.55, 0.55, 0.55),
    });
    y -= 17;
    drawRight(page, `Total: ${this.moneda(resumen.total)}`, columns.subtotalRight, y, 12, bold, accent);
    y -= 28;
    drawWrapped(
      page,
      'Esta proforma es informativa y no vinculante. No reserva inventario, no descuenta stock, no crea una Compra y no constituye una obligación de venta.',
      margin,
      y,
      8,
      535,
      font,
      11,
      muted,
    );

    const pageCount = pages.length;
    pages.forEach((target, index) => {
      target.drawLine({
        start: { x: margin, y: 42 },
        end: { x: pageWidth - margin, y: 42 },
        thickness: 0.6,
        color: rgb(0.63, 0.63, 0.63),
      });
      drawText(
        target,
        'Café UNA - Proforma informativa para consulta del cliente.',
        margin,
        25,
        8,
        font,
        muted,
      );
      drawRight(target, `Página ${index + 1} de ${pageCount}`, pageWidth - margin, 25, 8, bold, muted);
    });

    return pdf.save();
  }

  private envolverTexto(
    value: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    maxLines = Number.POSITIVE_INFINITY,
  ): string[] {
    const words = this.limpiarPdf(value).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
      }
      current = '';
      let fragment = '';
      for (const character of word) {
        const next = fragment + character;
        if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = next;
        }
      }
      current = fragment;
    }
    if (current) {
      lines.push(current);
    }
    if (lines.length <= maxLines) {
      return lines.length ? lines : [''];
    }

    const visibleLines = lines.slice(0, maxLines);
    const hiddenText = lines.slice(maxLines - 1).join(' ');
    visibleLines[maxLines - 1] = this.acortarTexto(
      hiddenText,
      font,
      size,
      maxWidth,
    );
    return visibleLines;
  }

  private acortarTexto(
    value: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
  ): string {
    const suffix = '...';
    let shortened = value;
    while (
      shortened.length > 0 &&
      font.widthOfTextAtSize(`${shortened}${suffix}`, size) > maxWidth
    ) {
      shortened = shortened.slice(0, -1);
    }
    return `${shortened.trimEnd()}${suffix}`;
  }

  private limpiarPdf(value: string): string {
    return value
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
      .trim();
  }

  private moneda(value: number): string {
    return `CRC ${value.toFixed(2)}`;
  }
}
