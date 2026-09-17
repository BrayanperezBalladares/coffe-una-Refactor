import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  obtenerActivosFijos: vi.fn(),
  crearActivoFijo: vi.fn(),
  actualizarActivoFijo: vi.fn(),
  cambiarEstadoActivoFijo: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn().mockReturnValue({
    id: 1,
    roles: ["Admin"],
    nombre: "Admin User",
  }),
}));

vi.mock("../../../services/activosFijosService", () => serviceMocks);
vi.mock("../../../services/sessionService", () => sessionMocks);
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <div>{children}</div>,
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <main>{children}</main>,
}));

vi.mock("../../../Components/ui/Select", () => ({
  UiSelect: ({ ariaLabel, value, onChange, options = [] }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  ),
}));

import AdminActivosFijos from "./ActivosFijos";

const mockActivos = [
  {
    id: "1",
    codigo: "ACT-001",
    nombre: "Molino de Café Industrial",
    modelo: "M-500",
    numeroSerie: "SN-9988",
    fechaCompra: "2024-01-15",
    valorEnLibro: 1500000,
    codigoProyecto: "PROY-01",
    nombreCompleto: "Finca La Montana",
    descripcionResponsable: "Carlos Rodriguez",
    descripcionProyecto: "Area de Beneficiado",
    origen: "UNA",
    activo: true,
  },
  {
    id: "2",
    codigo: "ACT-002",
    nombre: "Tostadora de Café Especial",
    modelo: "T-200",
    numeroSerie: "SN-7744",
    fechaCompra: "2024-02-20",
    valorEnLibro: 3200000,
    codigoProyecto: "PROY-02",
    nombreCompleto: "Laboratorio de Calidad",
    descripcionResponsable: "Ana Mora",
    descripcionProyecto: "Procesamiento",
    origen: "FUNDAUNA",
    activo: true,
  },
  {
    id: "3",
    codigo: "ACT-003",
    nombre: "Medidor de Humedad Portátil",
    modelo: "H-80",
    numeroSerie: "SN-1122",
    fechaCompra: "2024-03-10",
    valorEnLibro: 450000,
    codigoProyecto: "PROY-03",
    nombreCompleto: "Recepcion",
    descripcionResponsable: "Luis Perez",
    descripcionProyecto: "Control de Ingreso",
    origen: "Donación",
    activo: true,
  },
];

describe("AdminActivosFijos - Feature 5.2 Origen Contable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.obtenerActivosFijos.mockResolvedValue([...mockActivos]);
  });

  it("renders the table headers including Origen, and displays origin badges for UNA, FUNDAUNA and Donación", async () => {
    render(<AdminActivosFijos />);

    await waitFor(() => {
      expect(screen.getByText("Molino de Café Industrial")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: /Origen/i })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: /^Código$/i })).toBeInTheDocument();

    // Check origin badges in rows
    expect(within(table).getByText("UNA")).toBeInTheDocument();
    expect(within(table).getByText("FUNDAUNA")).toBeInTheDocument();
    expect(within(table).getByText("Donación")).toBeInTheDocument();
  });

  it("filters table rows by origen when selecting from the toolbar", async () => {
    const user = userEvent.setup();
    render(<AdminActivosFijos />);

    await waitFor(() => {
      expect(screen.getByText("Molino de Café Industrial")).toBeInTheDocument();
    });

    // Filter by FUNDAUNA
    const origenSelect = screen.getByRole("combobox", { name: /Origen/i });
    await user.selectOptions(origenSelect, "FUNDAUNA");

    expect(screen.queryByText("Molino de Café Industrial")).not.toBeInTheDocument();
    expect(screen.getByText("Tostadora de Café Especial")).toBeInTheDocument();
    expect(screen.queryByText("Medidor de Humedad Portátil")).not.toBeInTheDocument();

    // Filter by Donación
    await user.selectOptions(origenSelect, "Donación");

    expect(screen.queryByText("Molino de Café Industrial")).not.toBeInTheDocument();
    expect(screen.queryByText("Tostadora de Café Especial")).not.toBeInTheDocument();
    expect(screen.getByText("Medidor de Humedad Portátil")).toBeInTheDocument();

    // Reset to todos
    await user.selectOptions(origenSelect, "todos");
    expect(screen.getByText("Molino de Café Industrial")).toBeInTheDocument();
    expect(screen.getByText("Tostadora de Café Especial")).toBeInTheDocument();
    expect(screen.getByText("Medidor de Humedad Portátil")).toBeInTheDocument();
  });

  it("opens create modal with default origen UNA and allows selecting FUNDAUNA", async () => {
    const user = userEvent.setup();
    serviceMocks.crearActivoFijo.mockResolvedValue({
      id: "4",
      codigo: "ACT-004",
      nombre: "Balanza de Precisión",
      origen: "FUNDAUNA",
      activo: true,
    });

    render(<AdminActivosFijos />);

    await waitFor(() => {
      expect(screen.getByText("Molino de Café Industrial")).toBeInTheDocument();
    });

    // Open create modal
    const addBtn = screen.getByRole("button", { name: /Agregar activo/i });
    await user.click(addBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Check Origen select in modal
    const modalOrigenSelect = within(dialog).getByLabelText(/Origen contable/i);
    expect(modalOrigenSelect).toBeInTheDocument();
    expect(modalOrigenSelect.value).toBe("UNA");

    // Change to FUNDAUNA
    await user.selectOptions(modalOrigenSelect, "FUNDAUNA");
    expect(modalOrigenSelect.value).toBe("FUNDAUNA");

    // Fill required fields
    const codigoInput = dialog.querySelector('input[name="codigo"]');
    const nombreInput = dialog.querySelector('input[name="nombre"]');
    fireEvent.change(codigoInput, { target: { value: "ACT-004" } });
    fireEvent.change(nombreInput, { target: { value: "Balanza de Precisión" } });

    // Save
    const submitBtn = within(dialog).getByRole("button", { name: /Crear activo/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(serviceMocks.crearActivoFijo).toHaveBeenCalledTimes(1);
    });

    expect(serviceMocks.crearActivoFijo).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: "ACT-004",
        nombre: "Balanza de Precisión",
        origen: "FUNDAUNA",
      })
    );
  });

  it("opens edit modal with existing asset's origen and saves successfully", async () => {
    const user = userEvent.setup();
    serviceMocks.actualizarActivoFijo.mockResolvedValue({
      ...mockActivos[2],
      origen: "Donación",
    });

    render(<AdminActivosFijos />);

    await waitFor(() => {
      expect(screen.getByText("Medidor de Humedad Portátil")).toBeInTheDocument();
    });

    // Find row for ACT-003 and click edit
    const row = screen.getByText("ACT-003").closest("tr");
    const editBtn = within(row).getByRole("button", { name: /Editar/i });
    await user.click(editBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const modalOrigenSelect = within(dialog).getByLabelText(/Origen contable/i);
    expect(modalOrigenSelect.value).toBe("Donación");

    // Submit without changing
    const submitBtn = within(dialog).getByRole("button", { name: /Guardar cambios/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(serviceMocks.actualizarActivoFijo).toHaveBeenCalledTimes(1);
    });

    expect(serviceMocks.actualizarActivoFijo).toHaveBeenCalledWith(
      "3",
      expect.objectContaining({
        codigo: "ACT-003",
        origen: "Donación",
      })
    );
  });
});
