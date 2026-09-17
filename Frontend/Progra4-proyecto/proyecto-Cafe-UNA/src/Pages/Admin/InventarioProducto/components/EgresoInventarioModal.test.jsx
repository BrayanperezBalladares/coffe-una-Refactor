import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EgresoInventarioModal } from "./EgresoInventarioModal";

const product = {
  id: "42",
  nombre: "Café Orgánico 500g",
};

describe("EgresoInventarioModal", () => {
  it("renders correctly with product name and available stock", () => {
    render(
      <EgresoInventarioModal
        open={true}
        product={product}
        availableStock={25}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Registrar salida de inventario")).toBeInTheDocument();
    expect(screen.getAllByText("Café Orgánico 500g").length).toBeGreaterThan(0);
    expect(screen.getByText("25 disponibles")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar egreso" })).toBeInTheDocument();
  });

  it("blocks submission if quantity exceeds available stock", async () => {
    const onSave = vi.fn();
    render(
      <EgresoInventarioModal
        open={true}
        product={product}
        availableStock={5}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    const inputCantidad = screen.getByDisplayValue("1");
    await userEvent.clear(inputCantidad);
    await userEvent.type(inputCantidad, "10");

    const submitBtn = screen.getByRole("button", { name: "Registrar egreso" });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/La cantidad a egresar no puede superar el stock disponible/i),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("blocks submission when motivo is 'donacion' and recipient is empty", async () => {
    const onSave = vi.fn();
    render(
      <EgresoInventarioModal
        open={true}
        product={product}
        availableStock={15}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    // Default motive is "donacion"
    const submitBtn = screen.getByRole("button", { name: "Registrar egreso" });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("El nombre del destinatario es obligatorio para salidas por donación."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("allows submission when motivo is 'venta' without requiring a recipient", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(
      <EgresoInventarioModal
        open={true}
        product={product}
        availableStock={20}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    // Change motive to "venta"
    const selectMotivo = screen.getByDisplayValue("Donación");
    await userEvent.selectOptions(selectMotivo, "venta");

    const submitBtn = screen.getByRole("button", { name: "Registrar egreso" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        productoId: "42",
        cantidad: 1,
        motivo: "venta",
        destinatarioNombre: "",
        notas: "",
      });
    });
  });

  it("successfully calls onSave when valid donation with recipient is submitted", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(
      <EgresoInventarioModal
        open={true}
        product={product}
        availableStock={20}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    const inputDestinatario = screen.getByPlaceholderText(
      "Nombre de la persona, proyecto u organización beneficiaria...",
    );
    await userEvent.type(inputDestinatario, "Fundación Bienestar UNA");

    const inputCantidad = screen.getByDisplayValue("1");
    await userEvent.clear(inputCantidad);
    await userEvent.type(inputCantidad, "3");

    const submitBtn = screen.getByRole("button", { name: "Registrar egreso" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        productoId: "42",
        cantidad: 3,
        motivo: "donacion",
        destinatarioNombre: "Fundación Bienestar UNA",
        notas: "",
      });
    });
  });
});
