import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FeaturedCafesCarousel from "./FeaturedCafesCarousel";

vi.mock("../../hooks/useTraducir", () => ({
  useTraducir: (value) => value,
}));

vi.mock("../../services/productosService", () => ({
  calcularPrecioConIVA: (value) => value,
}));

describe("FeaturedCafesCarousel", () => {
  it("cycles through CMS products with labelled controls", async () => {
    const user = userEvent.setup();
    const products = [
      { nombre: "Tueste medio", descripcion: "Balanceado", precioNormal: 4200, stock: 4 },
      { nombre: "Tueste oscuro", descripcion: "Intenso", precioNormal: 4500, stock: 2 },
      { nombre: "Tueste claro", descripcion: "Aromático", precioNormal: 4100, stock: 0 },
    ];

    render(<FeaturedCafesCarousel products={products} />);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Ver Tueste medio" })).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByRole("button", { name: "Ver Tueste oscuro" })).toHaveAttribute("aria-current", "true");
  });
});
