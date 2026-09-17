
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SolicitarDonacion from "./SolicitarDonacion";

const enviarSolicitudMock = vi.fn();
const consultarCedulaMock = vi.fn();
const obtenerFechasMock = vi.fn().mockResolvedValue([]);
const obtenerNecesidadesMock = vi.fn().mockResolvedValue([]);
const obtenerSeccionMock = vi.fn().mockResolvedValue(null);

let mockSessionUser = { id: 10, email: "donante@ejemplo.com", roles: ["Cliente"] };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useRouterState: () => ({ location: { pathname: "/donaciones/solicitar" } }),
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

vi.mock("../../services/donacionesService", () => ({
  enviarSolicitudDonacion: (...args) => enviarSolicitudMock(...args),
  obtenerFechasRecepcionDisponibles: (...args) => obtenerFechasMock(...args),
  obtenerNecesidadesPublicas: (...args) => obtenerNecesidadesMock(...args),
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: (...args) => consultarCedulaMock(...args),
}));

describe("SolicitarDonacion Characterization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite escribir cédula física en modo persona", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarDonacion />);

    const idInput = container.querySelector("#don-identificacion");
    expect(idInput).toBeInTheDocument();

    await user.type(idInput, "117280334");
    expect(idInput.value).toBe("117280334");
  });

  it("permite escribir identificación en modo organización", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarDonacion />);

    const radioOrg = container.querySelector("input[name=\"tipoDonante\"][value=\"organizacion\"]");
    expect(radioOrg).toBeTruthy();
    await user.click(radioOrg);

    const idInput = container.querySelector("#don-identificacion");
    expect(idInput).toBeInTheDocument();

    await user.type(idInput, "3-101-123456");
    expect(idInput.value).toBe("3-101-123456");
  });
});

