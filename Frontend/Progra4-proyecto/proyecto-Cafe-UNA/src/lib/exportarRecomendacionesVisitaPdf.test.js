import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  construirPdfRecomendacionesVisita,
  descargarRecomendacionesVisitaPdf,
} from "./exportarRecomendacionesVisitaPdf";
import * as donacionesPdfModule from "./exportarDonacionesPdf";

describe("exportarRecomendacionesVisitaPdf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("construye un PDF válido con cabecera %PDF-1.4 y fin %%EOF", () => {
    const pdf = construirPdfRecomendacionesVisita({
      fechaEmision: "17/09/2026",
    });

    expect(typeof pdf).toBe("string");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.includes("%%EOF")).toBe(true);
  });

  it("incrusta el logo oficial de Café UNA (/ImLogo) en el documento", () => {
    const pdf = construirPdfRecomendacionesVisita();
    expect(pdf).toContain("/ImLogo");
    expect(pdf).toContain("/XObject << /ImLogo");
  });

  it("contiene los textos principales de las recomendaciones y normativas institucionales", () => {
    const pdf = construirPdfRecomendacionesVisita({
      fechaEmision: "17/09/2026",
    });

    // Validar títulos y contenido clave
    expect(pdf).toContain("Recomendaciones para Visitas a Campo");
    expect(pdf).toContain("Finca Experimental Santa Luc");
    expect(pdf).toContain("Caf");
    expect(pdf).toContain("UNIVERSIDAD NACIONAL DE COSTA RICA");
    expect(pdf).toContain("Calzado cerrado");
    expect(pdf).toContain("Repelente de insectos");
    expect(pdf).toContain("Barva de Heredia");
  });

  it("descargarRecomendacionesVisitaPdf invoca la descarga de archivo con el nombre correcto", async () => {
    const descargarSpy = vi.spyOn(donacionesPdfModule, "descargarArchivo").mockImplementation(() => {});
    vi.spyOn(donacionesPdfModule, "cargarLogoWebpParaPdf").mockResolvedValue({
      binary: "fakelogo",
      width: 100,
      height: 50,
      aspectRatio: 2,
    });

    await descargarRecomendacionesVisitaPdf({
      nombreArchivo: "Recomendaciones-Visita-Test.pdf",
    });

    expect(descargarSpy).toHaveBeenCalledTimes(1);
    expect(descargarSpy).toHaveBeenCalledWith(
      "Recomendaciones-Visita-Test.pdf",
      expect.stringContaining("%PDF-1.4"),
      "application/pdf",
      { binario: true }
    );
  });
});
