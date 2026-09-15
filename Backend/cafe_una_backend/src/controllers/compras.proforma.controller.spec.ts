import { StreamableFile } from '@nestjs/common';
import { PERMISOS_KEY } from '../common/requiere-permiso.decorator';
import { ComprasController } from './compras.controller';

describe('ComprasController proforma', () => {
  it('returns a downloadable application/pdf without creating a purchase', async () => {
    const comprasService = {};
    const generarMock: jest.MockedFunction<
      (body: Record<string, unknown>) => Promise<{
        pdf: Uint8Array;
        filename: 'proforma.pdf';
        resumen: Record<string, unknown>;
      }>
    > = jest.fn().mockResolvedValue({
      pdf: new Uint8Array([37, 80, 68, 70]),
      filename: 'proforma.pdf',
      resumen: {},
    });
    const proformasService = {
      generar: generarMock,
    };
    const controller = new ComprasController(
      comprasService as never,
      proformasService as never,
    );

    const result = await controller.generarProforma({
      clienteNombre: 'Ana Cliente',
      clienteCorreo: 'ana@una.cr',
      ubicacionCodigo: 'POS_FUNA_UNA',
      ubicacionId: 2,
      items: [{ id: '1', cantidad: 2 }],
    });

    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.options).toMatchObject({
      type: 'application/pdf',
      disposition: 'attachment; filename="proforma.pdf"',
    });
    expect(generarMock.mock.calls[0]?.[0]).toEqual({
      clienteNombre: 'Ana Cliente',
      clienteCorreo: 'ana@una.cr',
      ubicacionCodigo: 'POS_FUNA_UNA',
      ubicacionId: 2,
      items: [{ id: '1', cantidad: 2 }],
    });
  });

  it('requires the customer purchase permission', () => {
    const handler: object | undefined = Object.getOwnPropertyDescriptor(
      ComprasController.prototype,
      'generarProforma',
    )?.value as object | undefined;
    expect(Reflect.getMetadata(PERMISOS_KEY, handler ?? {})).toEqual([
      'comprar_productos',
    ]);
  });
});
