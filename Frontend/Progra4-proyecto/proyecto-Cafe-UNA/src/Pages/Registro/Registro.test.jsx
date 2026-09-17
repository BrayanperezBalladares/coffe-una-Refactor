import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Registro from './Registro';
import * as authService from '../../services/authService';
import * as cedulaService from '../../services/cedulaService';
import * as informacionService from '../../services/informacionService';
import * as sessionService from '../../services/sessionService';

// Mocks
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

vi.mock('../../services/authService', () => ({
  completarCliente: vi.fn(),
  limpiarIntentRegistroCliente: vi.fn(),
  mapAuthenticatedUser: vi.fn(),
  puedeAbrirRegistroCliente: vi.fn(() => true),
  puedeComprar: vi.fn(() => false),
  registrarCliente: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/cedulaService', () => ({
  consultarCedulaDetallada: vi.fn(),
}));

vi.mock('../../services/informacionService', () => ({
  obtenerNavbar: vi.fn().mockResolvedValue({ logoUrl: '' }),
}));

vi.mock('../../services/sessionService', () => ({
  getActiveSessionUser: vi.fn(() => null),
  saveAuthenticatedUser: vi.fn(),
}));

describe('Registro.jsx - Feature 1 Document Selection, Countries and shadcn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders all 3 document options: Cédula, DIMEX, and Pasaporte', () => {
    render(<Registro />);

    expect(screen.getByRole('radio', { name: /cédula/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dimex/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /pasaporte/i })).toBeInTheDocument();
  });

  it('shows CountryCombobox when DIMEX or Pasaporte is selected', async () => {
    const user = userEvent.setup();
    render(<Registro />);

    // By default, Cédula is selected -> CountryCombobox is not visible
    expect(screen.queryByRole('combobox', { name: /país de procedencia/i })).not.toBeInTheDocument();

    // Select DIMEX
    const dimexBtn = screen.getByRole('radio', { name: /dimex/i });
    await user.click(dimexBtn);

    // CountryCombobox must now appear
    const countryPicker = screen.getByRole('combobox', { name: /país de procedencia/i });
    expect(countryPicker).toBeInTheDocument();
  });

  it('allows searching and selecting a country from the CountryCombobox', async () => {
    const user = userEvent.setup();
    render(<Registro />);

    // Click Pasaporte
    const pasaporteBtn = screen.getByRole('radio', { name: /pasaporte/i });
    await user.click(pasaporteBtn);

    // Open Country Combobox
    const countryPicker = screen.getByRole('combobox', { name: /país de procedencia/i });
    await user.click(countryPicker);

    // Search input should be present
    const searchInput = screen.getByPlaceholderText(/escribí para buscar país/i);
    expect(searchInput).toBeInTheDocument();

    // Type "Espa" to find "España"
    await user.type(searchInput, 'Espa');

    // Click "España"
    const optionEspana = screen.getByRole('option', { name: /españa/i });
    expect(optionEspana).toBeInTheDocument();
    await user.click(optionEspana);

    // Should display selected country
    expect(countryPicker).toHaveTextContent(/españa/i);
  });

  it('autocompletes names when entering 9 digits for Costa Rican Cédula', async () => {
    const user = userEvent.setup();
    cedulaService.consultarCedulaDetallada.mockResolvedValueOnce({
      nombre: 'JUAN',
      primerApellido: 'MORA',
      segundoApellido: 'FERNANDEZ',
    });

    render(<Registro />);

    const idInput = screen.getByLabelText(/cédula nacional/i);
    await user.type(idInput, '117890123');

    await waitFor(() => {
      expect(cedulaService.consultarCedulaDetallada).toHaveBeenCalledWith('117890123');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('JUAN');
      expect(screen.getByLabelText(/primer apellido/i)).toHaveValue('MORA');
      expect(screen.getByLabelText(/segundo apellido/i)).toHaveValue('FERNANDEZ');
    });
  });

  it('handles DIMEX autocomplete for 11-12 digits and gracefully falls back on error', async () => {
    const user = userEvent.setup();
    cedulaService.consultarCedulaDetallada.mockRejectedValueOnce(new Error('No encontrado'));

    render(<Registro />);

    // Select DIMEX
    await user.click(screen.getByRole('radio', { name: /dimex/i }));

    const idInput = screen.getByLabelText(/dimex/i);
    await user.type(idInput, '155823456789');

    await waitFor(() => {
      expect(cedulaService.consultarCedulaDetallada).toHaveBeenCalledWith('155823456789');
    });

    await waitFor(() => {
      expect(screen.getByText(/completar los datos manualmente/i)).toBeInTheDocument();
    });
  });

  it('validates and submits foreign user payload with country and document type', async () => {
    const user = userEvent.setup();
    authService.registrarCliente.mockResolvedValueOnce({ ok: true });

    render(<Registro />);

    // Choose Pasaporte
    await user.click(screen.getByRole('radio', { name: /pasaporte/i }));

    // Select Country
    const countryPicker = screen.getByRole('combobox', { name: /país de procedencia/i });
    await user.click(countryPicker);
    const searchInput = screen.getByPlaceholderText(/escribí para buscar país/i);
    await user.type(searchInput, 'Canad');
    await user.click(screen.getByRole('option', { name: /canadá/i }));

    // Fill passport and details
    await user.type(screen.getByLabelText(/pasaporte/i), 'A12345678');
    await user.type(screen.getByLabelText(/^nombre$/i), 'John');
    await user.type(screen.getByLabelText(/primer apellido/i), 'Doe');
    await user.type(screen.getByLabelText(/correo/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/teléfono móvil/i), '88887777');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

    // Accept checkboxes
    await user.click(screen.getByLabelText(/términos y condiciones/i));
    await user.click(screen.getByLabelText(/políticas de privacidad/i));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /crear cuenta de cliente/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authService.registrarCliente).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'persona',
          esNacional: 'no',
          tipoDocumento: 'pasaporte',
          identificacion: 'A12345678',
          nombre: 'John',
          apellido1: 'Doe',
          pais: 'Canadá',
          correo: 'john.doe@example.com',
        })
      );
    });
  });
});
