import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Hero from "./Hero";

vi.mock("../../hooks/useTraducir", () => ({
  useTraducirObjeto: (value) => value,
}));

describe("Hero", () => {
  it("keeps CMS copy, media, and both calls to action accessible", () => {
    const onBackgroundReady = vi.fn();
    render(
      <Hero
        data={{
          eyebrow: "Café con propósito",
          title: "El mejor café\npara la comunidad",
          subtitle: "Cultivado con dedicación.",
          primaryButtonText: "Ver productos",
          primaryButtonUrl: "https://example.com/productos",
          buttonText: "Conocenos",
          buttonUrl: "https://example.com/historia",
          backgroundImage: "https://example.com/cafe.jpg",
        }}
        onBackgroundReady={onBackgroundReady}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("El mejor cafépara la comunidad");
    expect(screen.getByText("Cultivado con dedicación.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver productos" })).toHaveAttribute("href", "https://example.com/productos");
    expect(screen.getByRole("link", { name: "Conocenos" })).toHaveAttribute("href", "https://example.com/historia");

    fireEvent.load(document.querySelector(".hero__bg"));
    expect(onBackgroundReady).toHaveBeenCalledTimes(1);
  });
});
