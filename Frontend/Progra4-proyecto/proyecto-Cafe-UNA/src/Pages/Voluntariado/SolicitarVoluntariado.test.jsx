
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SolicitarVoluntariado from "./SolicitarVoluntariado";

const crearSolicitudMock = vi.fn();
const consultarCedulaMock = vi.fn();
const obtenerFechasMock = vi.fn().mockResolvedValue([]);
const obtenerResumenMock = vi.fn().mockResolvedValue({});
const obtenerSeccionMock = vi.fn().mockResolvedValue(null);

let mockSessionUser = { id: 10, email: "voluntario@ejemplo.com", roles: ["Cliente"] };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("../../hooks/usePaintPublicPage", () => ({
  usePaintPublicPage: () => ({
    ref: { current: null },
    showLoading: false,
    showPrepaint: false,
    inert: false,
    loadingMessage: "",
  }),
}));

vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => mockSessionUser,
}));

vi.mock("../../services/informacionService", () => ({
  obtenerSeccion: (...args) => obtenerSeccionMock(...args),
}));

vi.mock("../../services/voluntariadoService", () => ({
  crearSolicitud: (...args) => crearSolicitudMock(...args),
}));

vi.mock("../../services/voluntariadoFechasService", () => ({
  obtenerFechasDisponibles: (...args) => obtenerFechasMock(...args),
  obtenerResumenTipos: (...args) => obtenerResumenMock(...args),
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: (...args) => consultarCedulaMock(...args),
}));

describe("SolicitarVoluntariado Characterization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite seleccionar Si en costarricense y escribir la cedula de 9 digitos", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarVoluntariado />);

    const radioSi = container.querySelector("input[name=\"esNacional\"][value=\"si\"]");
    expect(radioSi).toBeTruthy();
    await user.click(radioSi);

    const idInput = container.querySelector("#vol-identificacion");
    expect(idInput).toBeEnabled();

    await user.type(idInput, "117280334");
    expect(idInput.value).toBe("117280334");
  });

  it("permite seleccionar No en costarricense y escribir identificacion extranjera", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarVoluntariado />);

    const radioNo = container.querySelector("input[name=\"esNacional\"][value=\"no\"]");
    expect(radioNo).toBeTruthy();
    await user.click(radioNo);

    const idInput = container.querySelector("#vol-identificacion");
    expect(idInput).toBeEnabled();

    await user.type(idInput, "PASAPORTE12345");
    expect(idInput.value).toBe("PASAPORTE12345");
  });

  it("renderiza el nuevo orden de pasos iniciando por tipo de voluntariado y disponibilidad", () => {
    const { container } = render(<SolicitarVoluntariado />);

    const sectionCards = container.querySelectorAll(".section-card");
    expect(sectionCards.length).toBe(5); // individual: tipo, fecha, horario, personal, contacto

    const stepBadges = Array.from(sectionCards).map((card) =>
      card.querySelector(".section-card__paso")?.textContent?.trim()
    );
    expect(stepBadges).toEqual(["1", "2", "3", "4", "5"]);

    const titles = Array.from(sectionCards).map((card) =>
      card.querySelector("h4")?.textContent?.replace(/Paso\s+\d+\.\s*/i, "").trim()
    );
    expect(titles[0]).toBe("Tipo de voluntariado");
    expect(titles[1]).toBe("Fechas disponibles");
    expect(titles[2]).toBe("Horario disponible");
    expect(titles[3]).toBe("Información personal del solicitante");
    expect(titles[4]).toBe("Contacto del solicitante");
  });

  it("muestra las etiquetas de nacionalidad Costarricense y Extranjero", () => {
    render(<SolicitarVoluntariado />);

    expect(screen.getByText("Costarricense")).toBeTruthy();
    expect(screen.getByText("Extranjero")).toBeTruthy();
  });

  it("incluye el paso 6 de información del grupo cuando la modalidad es grupal", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarVoluntariado />);

    const radioGrupal = container.querySelector("input[name=\"modalidad\"][value=\"grupal\"]");
    expect(radioGrupal).toBeTruthy();
    await user.click(radioGrupal);

    const sectionCards = container.querySelectorAll(".section-card");
    expect(sectionCards.length).toBe(6); // grupal has 6 steps

    const stepBadges = Array.from(sectionCards).map((card) =>
      card.querySelector(".section-card__paso")?.textContent?.trim()
    );
    expect(stepBadges).toEqual(["1", "2", "3", "4", "5", "6"]);

    const groupTitle = sectionCards[5].querySelector("h4")?.textContent;
    expect(groupTitle).toContain("Información del grupo");
  });
});

