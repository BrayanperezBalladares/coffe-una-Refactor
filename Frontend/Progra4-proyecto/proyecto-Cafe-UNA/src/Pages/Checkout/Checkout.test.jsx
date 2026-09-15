import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  solicitarProforma: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Coffee: () => null,
  FileText: () => null,
  ShoppingCart: () => null,
  Store: () => null,
  UploadCloud: () => null,
}));
vi.mock('../../Components/PublicPageGate/PublicPageGate', () => ({ PublicPageGate: ({ children }) => children }));
vi.mock('../../Components/ui/Switch', () => ({ Switch: ({ label }) => <label>{label}</label> }));
vi.mock('../../hooks/usePublicPageLoadingGate', () => ({ usePublicPageLoadingGate: () => false }));
vi.mock('../../hooks/useTraducir', () => ({
  useTraducir: (text) => text,
  useTraducirLista: (items) => items,
}));
vi.mock('../../Components/T/ST', () => ({ ST: ({ children }) => children }));
vi.mock('../../lib/t', () => ({ t: (text) => text }));
vi.mock('../../lib/pageLoadingMessages', () => ({ getLoadingMessageForCacheKey: () => '' }));
vi.mock('../../lib/imageUtils', () => ({ normalizeImageUrl: (url) => url }));
vi.mock('../../services/productosService', () => ({
  calcularPrecioConIVA: (price) => price * 1.13,
  obtenerDisponibilidadPuntosVenta: vi.fn().mockResolvedValue({
    puntosVenta: [{ id: 7, code: 'POS_FUNA_UNA', name: 'Campus UNA' }],
    porProducto: [{ productoId: 'cafe-1', puntos: [{ code: 'POS_FUNA_UNA', stock: 4 }] }],
  }),
}));
vi.mock('../../services/informacionService', () => ({ obtenerNavbar: vi.fn().mockResolvedValue({}) }));
vi.mock('../../services/comprasService', () => ({
  registrarCompra: vi.fn(),
  solicitarProforma: (...args) => mocks.solicitarProforma(...args),
}));
vi.mock('../../services/sessionService', () => ({
  getActiveSessionUser: () => ({ name: 'Ana Cliente', email: 'ana@example.com', token: 'jwt' }),
}));
vi.mock('../../services/authService', () => ({ marcarIntentRegistroCliente: vi.fn(), puedeComprar: () => true }));
vi.mock('../../lib/cartStorage', () => ({
  clearCart: mocks.clearCart,
  getStoredCart: () => [{ id: 'cafe-1', nombre: 'Café', precioNormal: 1000, units: 2 }],
}));

import Checkout from './Checkout';

describe('Checkout proforma action', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.solicitarProforma.mockReset();
    mocks.clearCart.mockReset();
  });

  it('requires the selected pickup point before requesting a proforma', async () => {
    render(<Checkout />);

    await screen.findByRole('button', { name: /Campus UNA/i });
    fireEvent.click(screen.getByRole('button', { name: /Generar proforma/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Seleccioná el punto de venta para generar la proforma.');
    expect(mocks.solicitarProforma).not.toHaveBeenCalled();
  });

  it('shows a generating state and keeps the cart when proforma generation fails', async () => {
    let rejectRequest;
    mocks.solicitarProforma.mockImplementation(
      () => new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );
    render(<Checkout />);

    fireEvent.click(await screen.findByRole('button', { name: /Campus UNA/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generar proforma/i }));

    expect(screen.getByRole('button', { name: /Generando proforma/i })).toBeDisabled();
    expect(mocks.solicitarProforma).toHaveBeenCalledWith({
      clienteNombre: 'Ana Cliente',
      clienteCorreo: 'ana@example.com',
      ubicacionCodigo: 'POS_FUNA_UNA',
      ubicacionId: 7,
      items: [{ id: 'cafe-1', cantidad: 2 }],
    });

    await act(async () => rejectRequest(new Error('No se pudo generar la proforma.')));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo generar la proforma.');
    });
    expect(mocks.clearCart).not.toHaveBeenCalled();
  });

  it('downloads the generated PDF without creating a purchase or clearing the cart', async () => {
    const createObjectURL = vi.fn(() => 'blob:proforma');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mocks.solicitarProforma.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

    render(<Checkout />);
    fireEvent.click(await screen.findByRole('button', { name: /Campus UNA/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generar proforma/i }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(mocks.clearCart).not.toHaveBeenCalled();
  });
});
