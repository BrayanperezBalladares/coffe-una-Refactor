import { BadRequestException } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { ProformasService } from './proformas.service';

describe('ProformasService', () => {
  const productosRepository = { find: jest.fn() };
  const ubicacionesRepository = { findOne: jest.fn() };
  const stockRepository = { find: jest.fn() };

  let service: ProformasService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProformasService(
      productosRepository as never,
      ubicacionesRepository as never,
      stockRepository as never,
    );
  });

  it('uses product prices from the database and includes the active pickup point', async () => {
    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 2,
      Codigo: 'POS_FUNA_UNA',
      Nombre: 'FUNA-UNA',
      Activo: true,
    });
    productosRepository.find.mockResolvedValue([
      {
        Id: '1',
        Nombre: 'Café molido',
        PrecioNormal: '5309.73',
        PrecioConIVA: '6000.00',
        Estado: 'Habilitado',
        Disponible: true,
      },
    ]);
    stockRepository.find.mockResolvedValue([
      { ProductoId: '1', UbicacionId: 2, Stock: 2 },
    ]);

    const result = await service.generar(
      {
        clienteNombre: 'Ana Cliente',
        clienteCorreo: 'ana@una.cr',
        ubicacionCodigo: 'POS_FUNA_UNA',
        items: [{ productoId: '1', cantidad: 2, precioUnitario: 1 }],
      },
      { nombre: 'Ana Cliente', correo: 'ana@una.cr' },
    );

    const pdf = await PDFDocument.load(result.pdf);
    expect(result.filename).toBe('proforma.pdf');
    const firstPage = pdf.getPages()[0];
    expect(firstPage.getWidth()).toBeCloseTo(841.89, 1);
    expect(firstPage.getHeight()).toBeCloseTo(595.28, 1);
    expect(firstPage.getWidth()).toBeGreaterThan(firstPage.getHeight());
    expect(pdf.getTitle()).toBe('Proforma de compra - Café UNA');
    expect(pdf.getSubject()).toContain('Proforma informativa no vinculante');
    expect(pdf.getSubject()).toContain('No reserva inventario ni crea una compra');
    const serializedPdf = Buffer.from(result.pdf).toString('latin1');
    expect(serializedPdf).toContain('/Subtype /Image');
    expect(serializedPdf).toContain('/DCTDecode');
    expect(result.resumen).toEqual({
      clienteNombre: 'Ana Cliente',
      clienteCorreo: 'ana@una.cr',
      ubicacionCodigo: 'POS_FUNA_UNA',
      ubicacionNombre: 'FUNA-UNA',
      items: [
        {
          productoId: '1',
          nombre: 'Café molido',
          cantidad: 2,
          precioUnitario: 6000,
          subtotal: 12000,
        },
      ],
      subtotal: 10619.46,
      impuestos: 1380.54,
      total: 12000,
    });
    expect(pdf.getSubject()).toContain('POS_FUNA_UNA');
    expect(productosRepository.find).toHaveBeenCalledTimes(1);
    expect(ubicacionesRepository.findOne).toHaveBeenCalledWith({
      where: { Codigo: 'POS_FUNA_UNA' },
    });
    expect(stockRepository.find).toHaveBeenCalledTimes(1);
  });

  it('rejects empty items and inactive or non-POS pickup points', async () => {
    await expect(
      service.generar(
        {
          clienteNombre: 'Ana Cliente',
          clienteCorreo: 'ana@una.cr',
          ubicacionCodigo: 'POS_FUNA_UNA',
          items: [],
        },
        { nombre: 'Ana Cliente', correo: 'ana@una.cr' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 1,
      Codigo: 'BODEGA_CENTRAL',
      Nombre: 'Bodega Central',
      Activo: true,
    });
    stockRepository.find.mockResolvedValue([]);
    await expect(
      service.generar(
        {
          clienteNombre: 'Ana Cliente',
          clienteCorreo: 'ana@una.cr',
          ubicacionCodigo: 'BODEGA_CENTRAL',
          items: [{ productoId: '1', cantidad: 1 }],
        },
        { nombre: 'Ana Cliente', correo: 'ana@una.cr' },
      ),
    ).rejects.toThrow('punto de venta válido');
  });

  it('does not receive purchase or inventory mutation collaborators', () => {
    expect(Object.keys(service)).not.toContain('dataSource');
    expect(Object.keys(service)).not.toContain('comprasRepository');
  });

  it('rejects a product that is unavailable at the selected pickup point', async () => {
    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 2,
      Codigo: 'POS_FUNA_UNA',
      Nombre: 'FUNA-UNA',
      Activo: true,
    });
    productosRepository.find.mockResolvedValue([
      {
        Id: '1',
        Nombre: 'Café molido',
        PrecioNormal: '5309.73',
        PrecioConIVA: '6000.00',
        Estado: 'Habilitado',
        Disponible: true,
      },
    ]);
    stockRepository.find.mockResolvedValue([
      { ProductoId: '1', UbicacionId: 2, Stock: 1 },
    ]);

    await expect(
      service.generar(
        {
          ubicacionCodigo: 'POS_FUNA_UNA',
          items: [{ id: '1', cantidad: 2 }],
        },
        { nombre: 'Ana Cliente', correo: 'ana@una.cr' },
      ),
    ).rejects.toThrow('No hay stock suficiente');
  });

  it('rejects products that are disabled or unavailable in the catalog', async () => {
    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 2,
      Codigo: 'POS_FUNA_UNA',
      Nombre: 'FUNA-UNA',
      Activo: true,
    });
    productosRepository.find.mockResolvedValue([
      {
        Id: '1',
        Nombre: 'Café molido',
        PrecioNormal: '5309.73',
        PrecioConIVA: '6000.00',
        Estado: 'Habilitado',
        Disponible: false,
      },
    ]);
    stockRepository.find.mockResolvedValue([
      { ProductoId: '1', UbicacionId: 2, Stock: 2 },
    ]);

    await expect(
      service.generar(
        { ubicacionCodigo: 'POS_FUNA_UNA', items: [{ id: '1', cantidad: 1 }] },
        { nombre: 'Ana Cliente', correo: 'ana@una.cr' },
      ),
    ).rejects.toThrow('no está disponible');
  });

  it('generates paginated landscape PDFs for long names and many products', async () => {
    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 2,
      Codigo: 'POS_FUNA_UNA',
      Nombre: 'FUNA-UNA',
      Activo: true,
    });
    const products = Array.from({ length: 60 }, (_, index) => ({
      Id: String(index + 1),
      Nombre: `Café de especialidad de nombre muy largo para verificar el salto de línea ${index + 1}`,
      PrecioNormal: '1000',
      PrecioConIVA: '1130',
      Estado: 'Habilitado',
      Disponible: true,
    }));
    productosRepository.find.mockResolvedValue(products);
    stockRepository.find.mockResolvedValue(
      products.map((product) => ({
        ProductoId: product.Id,
        UbicacionId: 2,
        Stock: 10,
      })),
    );

    const result = await service.generar({
      clienteNombre: 'Cliente con un nombre suficientemente largo para el encabezado',
      clienteCorreo: 'cliente-proforma-con-un-correo-largo@ejemplo.una.cr',
      ubicacionCodigo: 'POS_FUNA_UNA',
      items: products.map((product) => ({ id: product.Id, cantidad: 1 })),
    });

    const pdf = await PDFDocument.load(result.pdf);
    expect(pdf.getPages().length).toBeGreaterThan(1);
    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(841.89, 1);
      expect(page.getHeight()).toBeCloseTo(595.28, 1);
      expect(page.getWidth()).toBeGreaterThan(page.getHeight());
    }
    expect(result.resumen.items).toHaveLength(60);
  });

  it('splits an exceptionally long product name across pages without overflowing the footer', async () => {
    ubicacionesRepository.findOne.mockResolvedValue({
      Id: 2,
      Codigo: 'POS_FUNA_UNA',
      Nombre: 'FUNA-UNA',
      Activo: true,
    });
    productosRepository.find.mockResolvedValue([
      {
        Id: '1',
        Nombre: Array.from(
          { length: 400 },
          () => 'Café especial de origen',
        ).join(' '),
        PrecioNormal: '1000',
        PrecioConIVA: '1130',
        Estado: 'Habilitado',
        Disponible: true,
      },
    ]);
    stockRepository.find.mockResolvedValue([
      { ProductoId: '1', UbicacionId: 2, Stock: 1 },
    ]);

    const result = await service.generar({
      ubicacionCodigo: 'POS_FUNA_UNA',
      items: [{ id: '1', cantidad: 1 }],
    });

    const pdf = await PDFDocument.load(result.pdf);
    expect(pdf.getPages().length).toBeGreaterThan(1);
    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(841.89, 1);
      expect(page.getHeight()).toBeCloseTo(595.28, 1);
    }
  });
});
