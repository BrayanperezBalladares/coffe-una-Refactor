
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
});

