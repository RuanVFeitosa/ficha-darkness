import { ouvirPersonagens } from "./personagemApi";

jest.mock("./supabase", () => ({ supabaseConfigurado: false, supabase: null }));

const resposta = (coresToken) => ({
  ok: true,
  headers: { get: () => "application/json" },
  json: async () => ({ personagem: { nome: "Agente", coresToken } }),
});
const concluir = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

describe("sincronização das fichas da mesa sem Realtime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  test("recebe cores alteradas em outro dispositivo pela API e encerra a consulta ao sair", async () => {
    fetch.mockResolvedValueOnce(resposta(["#112233"])).mockResolvedValue(resposta(["#445566", "#778899"]));
    const atualizar = jest.fn();
    const parar = ouvirPersonagens(["agente"], atualizar);
    await concluir();
    expect(atualizar).toHaveBeenLastCalledWith("agente", expect.objectContaining({ coresToken: ["#112233"] }));
    jest.advanceTimersByTime(10000);
    await concluir();
    expect(atualizar).toHaveBeenLastCalledWith("agente", expect.objectContaining({ coresToken: ["#445566", "#778899"] }));
    parar();
    jest.advanceTimersByTime(10000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("uma consulta antiga não sobrescreve uma personalização recém-recebida", async () => {
    let resolver;
    fetch.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const atualizar = jest.fn();
    const parar = ouvirPersonagens(["agente"], atualizar);
    window.dispatchEvent(new CustomEvent("darkness:personagem-atualizado", {
      detail: { fichaId: "agente", personagem: { coresToken: ["#aabbcc"] } },
    }));
    resolver(resposta(["#112233"]));
    await concluir();
    expect(atualizar).toHaveBeenCalledTimes(1);
    expect(atualizar).toHaveBeenLastCalledWith("agente", { coresToken: ["#aabbcc"] });
    parar();
  });
});
