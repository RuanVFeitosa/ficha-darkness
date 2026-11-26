import { freshProtocolSheet } from "../data/protocoloDarkness";
import { prepareTokenImage } from "../services/imageCompression";
import { externalizarImagens } from "../services/mediaStorage";
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { salvarPaletaFicha, PALETA_CLARA } from "../utils/playerAppearance";
import FichaEspiral from "./fichaEspiral";
import { buscarPersonagem } from "../services/personagemApi";
import DialogoGlobal from "../components/ui/DialogoGlobal";
import { listarCampanhasDaFicha } from "../services/mesaApi";
import { freshSheet } from "../data/espiral";
jest.mock("../services/imageCompression", () => ({
  ...jest.requireActual("../services/imageCompression"),
  prepareTokenImage: jest.fn(),
}));
jest.mock("../services/mediaStorage", () => ({
  ...jest.requireActual("../services/mediaStorage"),
  externalizarImagens: jest.fn((value) => Promise.resolve(value)),
}));
jest.mock("../services/mesaApi", () => ({ listarCampanhasDaFicha: jest.fn() }));

jest.mock("../services/personagemApi", () => ({ buscarPersonagem: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  jest.clearAllMocks();
});

test("abre a ficha compartilhada em um navegador sem cópia local", async () => {
  window.history.replaceState({}, "", "/?sistema=espiral&ficha=5258881");
  buscarPersonagem.mockResolvedValueOnce({
    ...freshSheet(),
    name: "Maya compartilhada",
    sistema: "espiral",
    espiralId: "5258881",
  });
  render(<FichaEspiral />);
  expect(buscarPersonagem).toHaveBeenCalledWith("espiral_5258881");
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem("espiral:sheet:v1:5258881")).name,
    ).toBe("Maya compartilhada"),
  );
  expect(
    screen.queryByText("ADAPTAÇÃO DARKNESS → ESPIRAL"),
  ).not.toBeInTheDocument();
});

test.each([
  [4, "Sucesso com consequência"],
  [5, "Sucesso"],
  [7, "Sucesso excepcional"],
])(
  "sobrevivência remove uma falha e mostra verde em %s / %s",
  async (difficulty, outcome) => {
    const sheet = freshSheet();
    sheet.integrity = 0;
    sheet.failures = 2;
    sheet.attributes.pulso = 5;
    sheet.resources["Propósito"] = 0;
    localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (array) => {
          array[0] = difficulty - 1;
          return array;
        },
      },
    });
    render(<FichaEspiral />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Rolar sobrevivência: Pulso + Propósito",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Pulso + Propósito" });
    await waitFor(() => expect(dialog).toHaveClass("es-survival-success"));
    expect(
      within(dialog).getByRole("heading", { name: outcome, exact: true }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).failures,
    ).toBe(1);
  },
);

test.each([
  [2, "Falha"],
  [0, "Falha grave"],
])(
  "sobrevivência com dado %s soma uma falha e destaca %s",
  async (value, outcome) => {
    const sheet = freshSheet();
    sheet.integrity = 0;
    sheet.resources["Propósito"] = 0;
    sheet.failures = 0;
    localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (array) => {
          array[0] = value;
          return array;
        },
      },
    });
    render(<FichaEspiral />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Rolar sobrevivência: Pulso + Propósito",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Pulso + Propósito" });
    await waitFor(() => expect(dialog).toHaveClass("es-survival-failed"));
    expect(
      within(dialog).getByRole("heading", { name: outcome, exact: true }),
    ).toBeInTheDocument();
    if (outcome === "Falha grave")
      expect(dialog).toHaveClass("es-survival-rupture");
    expect(
      JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).failures,
    ).toBe(1);
  },
);

test("falhas de sobrevivência aparecem ao lado da Integridade somente quando zerada", () => {
  const sheet = freshSheet();
  sheet.integrity = 1;
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  render(<FichaEspiral />);
  expect(
    screen.queryByRole("button", { name: "Aumentar Falhas de sobrevivência" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Diminuir Integridade" }));
  const increase = screen.getByRole("button", {
    name: "Aumentar Falhas de sobrevivência",
  });
  fireEvent.click(increase);
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).failures,
  ).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Integridade" }));
  expect(
    screen.queryByRole("button", { name: "Aumentar Falhas de sobrevivência" }),
  ).toBeNull();
});

test("Sanidade e Esperança mudam o estado visual na metade, abaixo e em zero", () => {
  render(<FichaEspiral />);
  for (const resource of ["Sanidade", "Esperança"]) {
    const marker = (number) =>
      screen.getByRole("button", {
        name: `${resource} ${number}`,
        exact: true,
      });
    const panel = marker(1).closest(".hero-vital");
    fireEvent.click(marker(6));
    expect(panel).toHaveAttribute("data-state", "half");
    fireEvent.click(marker(4));
    expect(panel).toHaveAttribute("data-state", "low");
    fireEvent.click(marker(1));
    expect(panel).toHaveAttribute("data-state", "empty");
    fireEvent.click(marker(10));
    expect(panel).toHaveAttribute("data-state", "stable");
  }
});

test("rolagem de dano do jogador mostra a lesão no resultado", async () => {
  const sheet = freshSheet();
  sheet.weapons = [
    { id: "test-weapon", name: "Pistola de teste", damage: "1d6+10" },
  ];
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 0;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  expect(
    screen.queryByRole("button", { name: "Rolar dano de Pistola de teste" }),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Ver arma Pistola de teste 1" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Rolar dano de Pistola de teste" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Lesão Crítica" }),
  ).toBeInTheDocument();
});

test("dano desconta apenas Impacto, registra gravidade por região e não cura ao remover", () => {
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Corpo & marcas/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Selecionar Braço esquerdo, saudável" }),
  );
  fireEvent.change(screen.getByLabelText("Dano rolado"), {
    target: { value: "18" },
  });
  fireEvent.change(screen.getByLabelText("Proteção aplicada"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Redução por outros efeitos"), {
    target: { value: "2" },
  });
  fireEvent.click(
    screen.getByLabelText("Sangramento confirmado neste ferimento"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Aplicar dano e registrar lesão" }),
  );
  const saved = () =>
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"));
  expect(saved().integrity).toBe(22);
  expect(saved().injuries[0]).toMatchObject({
    impact: 13,
    severity: "Catastrófica",
    region: "Braço esquerdo",
    bleeding: true,
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Remover lesão em Braço esquerdo" }),
  );
  expect(saved().integrity).toBe(22);
  expect(saved().injuries).toHaveLength(0);
});

test("dado clicável rola dados extras temporários sem alterar a categoria", async () => {
  let dieIndex = 0;
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = [2, 4][dieIndex++ % 2];
        return array;
      },
    },
  });
  const view = render(<FichaEspiral />);
  expect(screen.queryByLabelText("Estágio de Pulso")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar dado temporário de Pulso" }),
  );
  expect(
    screen.getByRole("button", { name: "Restaurar um dado de Pulso" }),
  ).toHaveTextContent("×2");
  fireEvent.click(screen.getByRole("button", { name: "Rolar somente Pulso" }));
  const dialog = screen.getByRole("dialog", {
    name: "Pulso · somente atributo",
  });
  expect(
    within(dialog).getByText("Pulso · somente atributo"),
  ).toBeInTheDocument();
  expect(within(dialog).getByText("ROLAGEM DE ATRIBUTO")).toBeInTheDocument();
  expect(await within(dialog).findByText("Maior dado")).toBeInTheDocument();
  expect(dialog.querySelector("strong")).toHaveTextContent("5");
  expect(within(dialog).queryByText("Rolagem de dano")).toBeNull();
  expect(within(dialog).queryByText("Dano total")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Restaurar um dado de Pulso" }),
  ).toBeNull();
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).attributes
      .pulso,
  ).toBe(2);
  view.unmount();
});

test("ficha antiga sem Investigação recupera grau zero e rola um dado válido", async () => {
  const sheet = {
    ...freshSheet(),
    name: "Maya",
    attributes: { pulso: 4 },
    resources: { Armas: 2 },
  };
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 0;
        return array;
      },
    },
  });
  const onRoll = jest.fn();
  render(<FichaEspiral onRoll={onRoll} />);
  expect(
    screen.getByRole("button", {
      name: "Adicionar grau temporário a Investigação",
    }),
  ).toHaveTextContent("0 · Sem preparo");
  fireEvent.click(screen.getByRole("button", { name: "Rolar Investigação" }));
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "Investigação" })).getByRole(
      "button",
      { name: /Pulso/ },
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Rolar Pulso \+ Investigação/ }),
  );
  await waitFor(() => expect(onRoll).toHaveBeenCalled());
  const result = onRoll.mock.calls[0][0];
  expect(result.dice).toEqual([1]);
  expect(Number.isFinite(result.best)).toBe(true);
  expect(Number.isFinite(result.margin)).toBe(true);
  expect(document.body).not.toHaveTextContent("Infinity");
});

test("rolagem consome pressão e exibe o resultado", () => {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 0;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  fireEvent.change(screen.getByLabelText("Dados de Pressão", { exact: true }), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Rolar Investigação" }));
  fireEvent.click(
    screen.getByRole("button", { name: /Rolar Sentido \+ Investigação/ }),
  );
  expect(
    screen.getByRole("spinbutton", { name: "Dados de Pressão" }),
  ).toHaveValue(0);
  expect(
    screen.getByRole("heading", { name: "Falha grave" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Crise")).toBeInTheDocument();
  jest.restoreAllMocks();
});

test("identidade e anotações podem ser editadas", () => {
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Editar identidade/ }));
  fireEvent.change(screen.getByLabelText("Nome do personagem"), {
    target: { value: "Helena" },
  });
  expect(
    screen.getByRole("link", { name: /ESPIRAL Helena/ }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Anotações/ }));
  fireEvent.change(screen.getByLabelText("Seu motivo para continuar"), {
    target: { value: "Encontrar respostas." },
  });
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).purpose,
  ).toBe("Encontrar respostas.");
});

test("oferece tela inicial quando a ficha não veio do Darkness", () => {
  render(<FichaEspiral />);
  expect(
    screen.getByRole("button", { name: /Ir para tela inicial/ }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Trocar foto")).toHaveAttribute("type", "file");
});

test("identifica a ficha Darkness vinculada", () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify({
      version: 1,
      migratedFrom: "darkness",
      migratedFromId: "mara-01",
    }),
  );
  render(<FichaEspiral />);
  expect(
    screen.getByRole("button", { name: /Abrir ficha Darkness/ }),
  ).toBeInTheDocument();
});

test("carrega a adaptação criada com o identificador anterior", () => {
  window.history.replaceState({}, "", "/?ficha=121212");
  localStorage.setItem(
    "espiral:sheet:v1:darkness-121212",
    JSON.stringify({
      version: 1,
      name: "L",
      migratedFrom: "darkness",
      migratedFromId: "121212",
    }),
  );
  render(<FichaEspiral />);
  expect(screen.getByRole("link", { name: /ESPIRAL L/ })).toBeInTheDocument();
});

test("vincula automaticamente uma ficha Darkness ao abrir pelo código", async () => {
  window.history.replaceState({}, "", "/?ficha=121212");
  buscarPersonagem.mockResolvedValue({
    nome: "L",
    fichaId: "121212",
    atributos: {
      forca: 30,
      fonitude: 20,
      inteligencia: 10,
      reflexos: 10,
      vontade: 10,
    },
    inventario: [],
  });
  render(
    <React.StrictMode>
      <DialogoGlobal />
      <FichaEspiral />
    </React.StrictMode>,
  );
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("Referência para Pulso"), {
    target: { value: "forca" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar →" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar →" }));
  fireEvent.change(screen.getByLabelText("Grau de Controle Mental"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("Grau de Propósito"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar →" }));
  fireEvent.change(screen.getByLabelText("Vertente da adaptação"), {
    target: { value: "Adaptável" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar e abrir Espiral ↗" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: /ESPIRAL L/ })).toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: /Abrir ficha Darkness/ }),
  ).toBeInTheDocument();
});

test("graus temporários acumulam no recurso e expiram após as rolagens", async () => {
  render(
    <>
      <DialogoGlobal />
      <FichaEspiral />
    </>,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar grau temporário a Armas" }),
  );
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  fireEvent.change(within(screen.getByRole("dialog")).getByRole("textbox"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar grau" }));

  await waitFor(() =>
    expect(screen.getByText(/\+1 TEMP\. · 1 teste/)).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Rolar Armas" }));
  fireEvent.click(
    screen.getByRole("button", { name: /Rolar Sentido \+ Armas/ }),
  );

  await waitFor(() =>
    expect(screen.queryByText(/\+1 TEMP\./)).not.toBeInTheDocument(),
  );
});

test("personaliza e preserva as cores da ficha", () => {
  const view = render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Personalização/ }));
  fireEvent.change(screen.getByLabelText("Cor primária"), {
    target: { value: "#ff0000" },
  });

  expect(view.container.querySelector(".espiral-app")).toHaveStyle({
    "--es-accent": "#ff0000",
  });
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).temaFicha
      .primaria,
  ).toBe("#ff0000");
});

test("aplicar paleta da biblioteca atualiza uma ficha ESPIRAL já aberta e preserva recursos", async () => {
  const ficha = { ...freshSheet(), name: "Maya", sanity: 7, hope: 6 };
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(ficha));
  const view = render(<FichaEspiral />);
  await act(async () => {
    await salvarPaletaFicha(
      { id: "principal", sistema: "espiral" },
      { ...PALETA_CLARA, primaria: "#ff0000" },
    );
  });
  const raiz = view.container.querySelector(".espiral-app");
  expect(raiz).toHaveStyle({
    "--es-accent": "#ff0000",
    "--es-bg": "#ffffff",
    "--es-surface": "#f0f0f0",
    "--es-text": "#151515",
    "--es-line": "#b8b8b8",
  });
  const salva = JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"));
  expect(salva.sanity).toBe(7);
  expect(salva.hope).toBe(6);
  expect(salva.name).toBe("Maya");
});
test("bloqueia entrada no tabletop sem corpo inteiro mesmo com foto de perfil", () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify({
      ...freshSheet(),
      profileImage: "https://example.com/portrait.png",
    }),
  );
  render(<FichaEspiral />);
  listarCampanhasDaFicha.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "Entrar no tabletop" }));
  const dialog = screen.getByRole("dialog", { name: "Entrar no tabletop" });
  expect(within(dialog).getByRole("alert")).toHaveTextContent(
    "Falta a imagem de corpo inteiro",
  );
  expect(listarCampanhasDaFicha).not.toHaveBeenCalled();
  fireEvent.click(
    within(dialog).getByRole("button", {
      name: "Adicionar imagem de corpo inteiro",
    }),
  );
  expect(screen.getByLabelText("Background do personagem")).toBeInTheDocument();
});

test("oferece campanhas 3D vinculadas quando a ficha possui imagem de corpo inteiro", async () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify({
      ...freshSheet(),
      tabletopTokenImage: "https://example.com/body.png",
    }),
  );
  listarCampanhasDaFicha.mockResolvedValue([
    { id: "c1", codigo: "ABCD", nome: "Investigação", tabletop_tipo: "3d" },
    { id: "c2", codigo: "EFGH", nome: "Mesa antiga", tabletop_tipo: "2d" },
  ]);
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: "Entrar no tabletop" }));
  expect(
    await screen.findByRole("button", { name: "Investigação" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Mesa antiga" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "A imagem de corpo inteiro da sua ficha será usada como token.",
    ),
  ).toBeInTheDocument();
  expect(listarCampanhasDaFicha).toHaveBeenCalledWith("espiral:principal");
});
test("ficha integrada ao tabletop usa o personagem solicitado e salva alterações", () => {
  localStorage.setItem(
    "espiral:sheet:v1:ana",
    JSON.stringify({ ...freshSheet(), name: "Ana" }),
  );
  const updated = jest.fn();
  const title = document.title;
  render(<FichaEspiral sheetId="ana" embedded onSheetChange={updated} />);
  expect(screen.getByRole("link", { name: /ESPIRAL Ana/ })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Entrar no tabletop" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Ir para tela inicial/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Diminuir Integridade" }));
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:ana")).integrity,
  ).toBe(freshSheet().integrity - 1);
  expect(updated).toHaveBeenLastCalledWith(
    "ana",
    expect.objectContaining({
      name: "Ana",
      integrity: freshSheet().integrity - 1,
    }),
  );
  expect(document.title).toBe(title);
});
test("corpo inteiro permanece acessível ao alternar identidade e Background e salva sem acesso remoto", async () => {
  prepareTokenImage.mockResolvedValue("data:image/webp;base64,dGVzdA==");
  externalizarImagens.mockRejectedValueOnce(
    new Error("Entre na sua conta para enviar arquivos ao R2."),
  );
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Editar identidade/ }));
  fireEvent.click(screen.getByRole("button", { name: /Background/ }));
  fireEvent.click(screen.getByRole("button", { name: /Fechar edição/ }));
  const input = screen.getByLabelText("Enviar imagem de corpo inteiro");
  expect(
    screen.getAllByLabelText("Enviar imagem de corpo inteiro"),
  ).toHaveLength(1);
  const click = jest.spyOn(input, "click");
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar imagem de corpo inteiro" }),
  );
  expect(click).toHaveBeenCalledTimes(1);
  const file = new File(["body"], "body.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"))
        .tabletopTokenImage,
    ).toBe("data:image/webp;base64,dGVzdA=="),
  );
  expect(screen.getByAltText("Corpo inteiro de personagem")).toHaveAttribute(
    "src",
    "data:image/webp;base64,dGVzdA==",
  );
  expect(
    screen.getByText(/Imagem salva neste dispositivo/),
  ).toBeInTheDocument();
  click.mockRestore();
});

test("Protocolo conta êxitos e limita a reserva completa a seis dados", async () => {
  const sheet = freshProtocolSheet();
  sheet.name = "Investigadora";
  sheet.resources.Investigação = 4;
  sheet.pressure = 5;
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 3;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  expect(screen.getByText("Investigadora")).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Defesa" }).closest(".es-hero-vitals"),
  ).not.toBeNull();
  expect(screen.queryByRole("heading", { name: "Preparar teste" })).toBeNull();
  expect(
    screen.getByRole("img", { name: "Monitor cardíaco — Estável" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Rolar Investigação" }));
  const preparation = screen.getByRole("dialog");
  expect(
    within(preparation).getByRole("button", { name: "Usar d12 adicional" }),
  ).toBeInTheDocument();
  fireEvent.click(
    within(preparation).getByRole("button", { name: "3 dados adicionais" }),
  );
  expect(within(preparation).getByText("3/3")).toBeInTheDocument();
  expect(
    within(preparation).queryByRole("button", { name: "4 dados adicionais" }),
  ).toBeNull();
  fireEvent.click(
    within(preparation).getByRole("button", { name: "1 dado adicional" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Rolar Sentido \+ Investigação/ }),
  );
  const dialog = screen.getByRole("dialog", { name: "Sentido + Investigação" });
  await waitFor(
    () => expect(within(dialog).getAllByText("✓ Êxito")).toHaveLength(6),
    { timeout: 2500 },
  );
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    "6 êxito(s). Sucesso",
  );
});

test("arsenal do Protocolo exibe duas armas por página sem apagar as demais", () => {
  const sheet = freshProtocolSheet();
  sheet.weapons = [
    { id: "a", name: "Primeira", damage: "1d6" },
    { id: "b", name: "Segunda", damage: "1d6" },
    { id: "c", name: "Terceira", damage: "1d6" },
  ];
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  render(<FichaEspiral />);
  expect(
    screen.getByRole("button", { name: /Ver arma Primeira/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Ver arma Segunda/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Ver arma Terceira/ }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Próximas armas" }));
  expect(
    screen.getByRole("button", { name: /Ver arma Terceira/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Ver arma Primeira/ }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Próximas armas" })).toBeDisabled();
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).weapons,
  ).toHaveLength(3);
});

test("menu mobile seleciona uma seção e recolhe suas opções", () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify(freshProtocolSheet()),
  );
  const { container } = render(<FichaEspiral />);
  const trigger = screen.getByRole("button", {
    name: /Atributos & estado.*Menu/,
  });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(trigger);
  const menu = screen.getByRole("navigation", { name: "Navegação mobile" });
  fireEvent.click(
    within(menu).getByRole("button", { name: "Habilidades", exact: true }),
  );
  expect(
    screen.queryByRole("navigation", { name: "Navegação mobile" }),
  ).toBeNull();
  expect(container.querySelector(".protocolo-app")).toHaveAttribute(
    "data-mobile-panel",
    "content",
  );
  expect(
    screen.getByRole("heading", { name: /O que você aprendeu/ }),
  ).toBeInTheDocument();
});

test("Pavor anula todos os dados e produz falha crítica sem somar o dado de medo", async () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify(freshProtocolSheet()),
  );
  let calls = 0;
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = calls++ === 0 ? 0 : 5;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: "Receber Pavor" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar e ativar Pavor" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Rolar somente Pulso" }));
  const dialog = screen.getByRole("dialog", {
    name: /Pulso.*somente atributo/,
  });
  await waitFor(
    () =>
      expect(within(dialog).getByRole("status")).toHaveTextContent(
        "0 êxito(s). Falha crítica",
      ),
    { timeout: 2500 },
  );
  expect(within(dialog).getByText("Anulado")).toBeInTheDocument();
  expect(
    within(dialog).getByRole("img", { name: "d6: 6" }),
  ).toBeInTheDocument();
});
test("controlar Pavor gasta uma Esperança e tirar 1 encerra o efeito", async () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify(freshProtocolSheet()),
  );
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 0;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: "Receber Pavor" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar e ativar Pavor" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Pavor" }));
  fireEvent.click(screen.getByRole("button", { name: "Controlar · 1 PE" }));
  let saved = JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"));
  expect(saved.hope).toBe(9);
  expect(saved.pavor).toEqual({
    active: true,
    sides: 6,
    colors: { primary: "#db5b52", glow: "#e14d43" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Rolar somente Pulso" }));
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).pavor
        .active,
    ).toBe(false),
  );
});

test("relação pendente rola d12 junto a adicionais d6, respeita seis dados e é consumida", async () => {
  const sheet = freshProtocolSheet();
  sheet.resources.Investigação = 4;
  sheet.relationships = [{ id: "ana", name: "Ana", grade: 3, used: true }];
  sheet.relationshipBonus = { relationId: "ana", name: "Ana", sides: 12 };
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array) => {
        array[0] = 3;
        return array;
      },
    },
  });
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: "Rolar Investigação" }));
  const prepare = screen.getByRole("dialog");
  fireEvent.click(
    within(prepare).getByRole("button", { name: "3 dados adicionais" }),
  );
  fireEvent.click(
    within(prepare).getByRole("button", {
      name: /Rolar Sentido \+ Investigação/,
    }),
  );
  const dialog = screen.getByRole("dialog", { name: "Sentido + Investigação" });
  await waitFor(
    () =>
      expect(within(dialog).getByRole("status")).toHaveTextContent(
        "6 êxito(s). Sucesso",
      ),
    { timeout: 2500 },
  );
  expect(
    within(dialog).getByRole("img", { name: "d12: 4" }),
  ).toBeInTheDocument();
  expect(within(dialog).getByText("Relação")).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"))
      .relationshipBonus,
  ).toBeNull();
});

test("corpo inteiro aparece antes do envio remoto e não é bloqueado por armazenamento cheio", async () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify({ ...freshProtocolSheet(), name: "Alessandra" }),
  );
  prepareTokenImage.mockResolvedValue("data:image/webp;base64,Ym9keQ==");
  let finishUpload;
  externalizarImagens.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
  );
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Background/ }));
  const store = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
  try {
    fireEvent.change(screen.getByLabelText("Enviar imagem de corpo inteiro"), {
      target: {
        files: [new File(["body"], "body.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
      expect(
        screen.getByAltText("Corpo inteiro de Alessandra"),
      ).toHaveAttribute("src", "data:image/webp;base64,Ym9keQ=="),
    );
    expect(screen.getByText("Enviando imagem…")).toBeDisabled();
    await act(async () => {
      finishUpload("https://example.com/body.webp");
    });
    expect(screen.getByAltText("Corpo inteiro de Alessandra")).toHaveAttribute(
      "src",
      "https://example.com/body.webp",
    );
    expect(
      screen.getByText(/Armazenamento local cheio; o salvamento/),
    ).toBeInTheDocument();
  } finally {
    store.mockRestore();
  }
});

test("erro ao preparar corpo inteiro aparece no próprio Background", async () => {
  prepareTokenImage.mockRejectedValueOnce(
    new Error("Escolha um arquivo PNG, JPG ou WebP válido."),
  );
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify(freshProtocolSheet()),
  );
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Background/ }));
  fireEvent.change(screen.getByLabelText("Enviar imagem de corpo inteiro"), {
    target: { files: [new File(["bad"], "bad.png", { type: "image/png" })] },
  });
  expect(
    await screen.findByText("Escolha um arquivo PNG, JPG ou WebP válido."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Escolher imagem" })).toBeEnabled();
});

test("jogador encontra campanha vinculada pelo código remoto Darkness", async () => {
  window.history.replaceState({}, "", "/?sistema=espiral&ficha=44085861");
  const sheet = {
    ...freshProtocolSheet(),
    name: "Alessandra",
    tabletopTokenImage: "/corpo.png",
  };
  localStorage.setItem("espiral:sheet:v1:44085861", JSON.stringify(sheet));
  buscarPersonagem.mockResolvedValue(sheet);
  listarCampanhasDaFicha.mockImplementation(async (code) =>
    code === "espiral_44085861"
      ? [
          {
            id: "mesa-remota",
            codigo: "MESA",
            nome: "Mesa da Alessandra",
            tabletop_tipo: "3d",
          },
        ]
      : [],
  );
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: "Entrar no tabletop" }));
  expect(
    await screen.findByRole("button", { name: "Mesa da Alessandra" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/Esta ficha ainda não está vinculada/),
  ).not.toBeInTheDocument();
});

test("embedded defenses appear once above the tabs and remain visible across sections", async () => {
  const sheet = freshProtocolSheet();
  localStorage.setItem(
    "espiral:sheet:v1:embedded-defense",
    JSON.stringify(sheet),
  );
  buscarPersonagem.mockResolvedValueOnce(null);
  const { container } = render(
    <FichaEspiral sheetId="embedded-defense" embedded />,
  );
  const defense = screen.getByRole("region", { name: "Defesa" });
  const tabs = container.querySelector(".es-tabs");
  expect(
    defense.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Corpo & marcas/ }));
  expect(screen.getAllByRole("region", { name: "Defesa" })).toHaveLength(1);
  expect(container.querySelector(".es-sidebar .es-defense-card")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Background/ }));
  expect(screen.getByRole("region", { name: "Defesa" })).toBeVisible();
});

test("cura da ficha reduz lesão e a remove quando o impacto restante zera", () => {
  const sheet = freshProtocolSheet();
  sheet.integrity = 20;
  sheet.injuries = [
    {
      id: "a",
      region: "Torso",
      impact: 8,
      severity: "Grave",
      criticalRegion: true,
    },
  ];
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Corpo & marcas/ }));
  fireEvent.click(screen.getByRole("button", { name: "Cura", exact: true }));
  fireEvent.change(screen.getByLabelText("Pontos de cura"), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar cura" }));
  let saved = JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"));
  expect(saved.integrity).toBe(23);
  expect(saved.injuries[0]).toMatchObject({
    severity: "Moderada",
    remainingImpact: 5,
  });
  fireEvent.change(screen.getByLabelText("Pontos de cura"), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar cura" }));
  saved = JSON.parse(localStorage.getItem("espiral:sheet:v1:principal"));
  expect(saved.integrity).toBe(28);
  expect(saved.injuries).toHaveLength(0);
});

test("resumo na visão geral abre cura sem trocar de aba e atualiza os ferimentos", () => {
  const sheet = freshProtocolSheet();
  sheet.integrity = 20;
  sheet.injuries = [
    { id: "a", region: "Torso", impact: 5, severity: "Moderada" },
  ];
  localStorage.setItem("espiral:sheet:v1:principal", JSON.stringify(sheet));
  render(<FichaEspiral />);
  const overview = screen.getByRole("button", { name: /Visão geral/ });
  const quick = screen.getByRole("region", {
    name: "Resumo de Corpo e marcas",
  });
  expect(within(quick).getByText("Torso")).toBeInTheDocument();
  fireEvent.click(within(quick).getByRole("button", { name: "Cura" }));
  const dialog = screen.getByRole("dialog", { name: "Corpo e marcas" });
  expect(overview).toHaveAttribute("aria-current", "page");
  fireEvent.change(within(dialog).getByLabelText("Pontos de cura"), {
    target: { value: "5" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Aplicar cura" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Fechar ×" }));
  expect(screen.queryByRole("dialog", { name: "Corpo e marcas" })).toBeNull();
  expect(within(quick).getByText("Sem ferimentos")).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).integrity,
  ).toBe(25);
});

test("rolagem da ficha incorporada abre o resultado normalmente na ficha", () => {
  localStorage.setItem(
    "espiral:sheet:v1:embedded-roll",
    JSON.stringify(freshProtocolSheet()),
  );
  render(<FichaEspiral sheetId="embedded-roll" embedded />);
  fireEvent.click(screen.getByRole("button", { name: "Rolar somente Pulso" }));
  expect(
    screen.getByRole("dialog", { name: /Pulso.*somente atributo/ }),
  ).toBeInTheDocument();
});

test("temas prontos persistem cores, trocam o símbolo e restauram Darkness", () => {
  localStorage.setItem(
    "espiral:sheet:v1:principal",
    JSON.stringify(freshProtocolSheet()),
  );
  const { container } = render(<FichaEspiral />);
  fireEvent.click(screen.getByRole("button", { name: /Personalização/ }));
  fireEvent.click(screen.getByRole("button", { name: "Aplicar tema Espiral" }));
  expect(container.querySelector(".es-hero-art > .es-spiral")).toHaveAttribute(
    "src",
    "/simbolo-espiral.svg",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Aplicar tema Absoluto" }),
  );
  expect(container.querySelector(".es-hero-art > .es-spiral")).toHaveAttribute(
    "src",
    "/simbolo-absoluto.png",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Aplicar tema ATO III · Julgamento" }),
  );
  expect(
    container.querySelector(".pd-portrait-theme-backdrop img"),
  ).toHaveAttribute("src", "/tema-ato-iii-julgamento.png");
  fireEvent.click(screen.getByRole("button", { name: "Orgulho LGBTQI+" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Aplicar tema Não binário" }),
  );
  expect(
    screen.getByRole("img", { name: "Bandeira Não binário" }),
  ).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem("espiral:sheet:v1:principal")).themePreset,
  ).toBe("pride-nonbinary");
  fireEvent.click(
    screen.getByRole("button", { name: "Restaurar tema padrão" }),
  );
  expect(container.querySelector(".es-hero-art > .es-spiral")).toHaveAttribute(
    "src",
    "/simbolo-darkness.png",
  );
  expect(container.querySelector(".pd-portrait-theme-backdrop")).toBeNull();
});

test('Colapso e Desamparo ocupam a própria linha das barras e somem ao recuperar',()=>{
 const sheet={...freshProtocolSheet(),sanity:0,hope:0};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 const {container}=render(<FichaEspiral/>);
 const collapse=screen.getByText('Colapso',{exact:true});
 const helpless=screen.getByText('Desamparo',{exact:true});
 expect(collapse.parentElement).toHaveClass('hero-dots');
 expect(helpless.parentElement).toHaveClass('hero-dots');
 expect(container.querySelectorAll('.hero-sanity>.pd-reserve-condition,.hero-hope>.pd-reserve-condition')).toHaveLength(0);
 fireEvent.click(screen.getByRole('button',{name:'Esperança 1',exact:true}));
 expect(screen.queryByText('Desamparo',{exact:true})).not.toBeInTheDocument();
 expect(collapse).toBeInTheDocument();
});

test('Estado Mental removido: dados antigos não bloqueiam testes nem aplicam modificadores ou perdas',()=>{
 const sheet={...freshProtocolSheet(),sanity:5,hope:5,psychology:{nextPenalty:2,nextBonus:1,pending:[{id:1,kind:'rupture'}],conditions:[{id:'disconnect'}]},pendingHopeCost:{ability:'Antiga',cost:[4,2]}};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=0;return array;}}});
 render(<FichaEspiral/>);
 expect(screen.queryByRole('button',{name:/Estado mental/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Rolar Controle Mental'}));
 fireEvent.click(screen.getByRole('button',{name:/Rolar Sentido \+ Controle Mental/}));
 expect(screen.getByRole('dialog',{name:'Sentido + Controle Mental'})).toBeInTheDocument();
 const saved=JSON.parse(localStorage.getItem('espiral:sheet:v1:principal'));
 expect(saved.sanity).toBe(5);expect(saved.hope).toBe(5);
 expect(saved.psychology).toBeUndefined();expect(saved.pendingHopeCost).toBeUndefined();
});
test('reservas zeradas exibem só as condições e não adicionam Pressão automática',()=>{
 const sheet={...freshProtocolSheet(),sanity:0,hope:0,pressure:0,occupationBenefit:{}};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=0;return array;}}});
 const {container}=render(<FichaEspiral/>);
 expect(screen.getByText('Colapso',{exact:true})).toBeInTheDocument();expect(screen.getByText('Desamparo',{exact:true})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Rolar Propósito'}));
 expect(screen.queryByText(/Estado mental ·/)).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Rolar Sentido \+ Propósito/}));
 expect(container.querySelectorAll('.pd-roll-die.pressure')).toHaveLength(0);
 expect(screen.queryByRole('dialog',{name:'O que permanece'})).not.toBeInTheDocument();
});

test('efeitos de Pressão ficam na faixa e Abalo reduz automaticamente a próxima rolagem',async()=>{
 const sheet={...freshProtocolSheet(),pressure:1};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=0;return array;}}});
 render(<FichaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'Rolar Investigação'}));fireEvent.click(screen.getByRole('button',{name:/Rolar Sentido \+ Investigação/}));
 expect(within(screen.getByRole('region',{name:'Penalidades e efeitos de Pressão'})).getByText('Abalo')).toBeInTheDocument();
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).sanity).toBe(10);
 const dialog=screen.getByRole('dialog',{name:'Sentido + Investigação'});
 await waitFor(()=>expect(within(dialog).getByRole('button',{name:'Fechar rolagem'})).toBeEnabled(),{timeout:2500});
 fireEvent.click(within(dialog).getByRole('button',{name:'Fechar rolagem'}));
 fireEvent.click(screen.getByRole('button',{name:'Rolar Investigação'}));fireEvent.click(screen.getByRole('button',{name:/Rolar Sentido \+ Investigação/}));
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).pressureEffects.nextPenalty).toBe(0);
 expect(screen.getByRole('dialog',{name:'Sentido + Investigação'}).querySelectorAll('.pd-roll-die')).toHaveLength(2);
 expect(screen.queryByRole('dialog',{name:'O que permanece'})).toBeNull();
});

test('falha de sobrevivência oferece d20 de Lesão puro, sem Pavor, Pressão ou modificadores',async()=>{
 const sheet={...freshProtocolSheet(),integrity:0,pavor:{active:true,sides:6},pressure:1};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=0;return array;}}});
 render(<FichaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'Rolar sobrevivência: Pulso + Propósito'}));
 expect(screen.queryByRole('button',{name:'Rolar Dado de Lesão · d20'})).not.toBeInTheDocument();
 await waitFor(()=>expect(screen.getByRole('button',{name:'Rolar Dado de Lesão · d20'})).toBeInTheDocument(),{timeout:2500});
 const failures=JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).failures;
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=19;return array;}}});
 fireEvent.click(screen.getByRole('button',{name:'Rolar Dado de Lesão · d20'}));
 const dialog=screen.getByRole('dialog',{name:'Dado de Lesão · 1d20'});
 await waitFor(()=>expect(within(dialog).getByRole('img',{name:'d20: 20'})).toBeInTheDocument(),{timeout:2500});
 expect(within(dialog).getByRole('status')).toHaveTextContent('Total: 20');
 expect(dialog.querySelectorAll('.pd-roll-die')).toHaveLength(1);
 expect(dialog.querySelector('.dread')).toBeNull();expect(dialog.querySelector('.pressure')).toBeNull();
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).failures).toBe(failures);
 expect(screen.queryByRole('button',{name:'Rolar Dado de Lesão · d20'})).not.toBeInTheDocument();
});
test('sucesso de sobrevivência não oferece Dado de Lesão',async()=>{
 const sheet={...freshProtocolSheet(),integrity:0};
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify(sheet));
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=3;return array;}}});
 render(<FichaEspiral/>);fireEvent.click(screen.getByRole('button',{name:'Rolar sobrevivência: Pulso + Propósito'}));
 const dialog=screen.getByRole('dialog',{name:'Pulso + Propósito'});
 await waitFor(()=>expect(within(dialog).getByRole('button',{name:'Fechar rolagem'})).toBeEnabled(),{timeout:2500});
 expect(screen.queryByRole('button',{name:'Rolar Dado de Lesão · d20'})).not.toBeInTheDocument();
});
