import { ativarCena, buscarCampanhaPorCodigo, criarCampanhaMesa, desvincularFicha, excluirCena, listarCampanhas, moverToken, salvarCena, validarArquivoImagem, vincularFicha } from "./mesaApi";

describe("biblioteca local da mesa", () => {
  test("limita o tamanho das cenas e mapas antes do upload", () => {
    expect(() => validarArquivoImagem(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "cena.webp", { type: "image/webp" }), "cena")).toThrow("2 MB");
    expect(() => validarArquivoImagem(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "mapa.webp", { type: "image/webp" }), "mapa")).toThrow("5 MB");
    expect(() => validarArquivoImagem(new File(["svg"], "cena.svg", { type: "image/svg+xml" }), "cena")).toThrow("Formato nao permitido");
  });
  beforeEach(() => localStorage.clear());

  test("salva uma cena e a reabre como mapa ativo", async () => {
    const novaCena = await salvarCena("demo", {
      nome: "Galeria subterranea",
      descricao: "Um corredor inundado.",
      imagemUrl: "/cena.webp",
      mapaUrl: "/mapa.webp",
      larguraGrade: 16,
      alturaGrade: 10,
    });

    await ativarCena("demo", novaCena.id, "mapa");
    const campanha = await buscarCampanhaPorCodigo("DARK26");

    expect(campanha.cenaAtiva.nome).toBe("Galeria subterranea");
    expect(campanha.modo).toBe("mapa");
    expect(campanha.cenas).toContainEqual(expect.objectContaining({ id: novaCena.id }));
  });

  test("remove uma cena salva da biblioteca", async () => {
    const novaCena = await salvarCena("demo", { nome: "Temporaria" });
    await excluirCena("demo", novaCena.id);
    const campanha = await buscarCampanhaPorCodigo("DARK26");

    expect(campanha.cenas.some((cena) => cena.id === novaCena.id)).toBe(false);
  });

  test("vincula uma ficha e cria seu token", async () => {
    await vincularFicha("demo", "agente-7", { nome: "Agente Sete" });
    let campanha = await buscarCampanhaPorCodigo("DARK26");
    expect(campanha.membros).toContainEqual(expect.objectContaining({ ficha_id: "agente-7" }));
    expect(campanha.tokens).toContainEqual(expect.objectContaining({ ficha_id: "agente-7" }));

    await desvincularFicha("demo", "agente-7");
    campanha = await buscarCampanhaPorCodigo("DARK26");
    expect(campanha.membros.some((item) => item.ficha_id === "agente-7")).toBe(false);
    expect(campanha.tokens.some((item) => item.ficha_id === "agente-7")).toBe(false);
  });

  test("salva a nova posicao de um token", async () => {
    const campanhaInicial = await buscarCampanhaPorCodigo("DARK26");
    const token = campanhaInicial.tokens[0];
    await moverToken(token.id, 72.5, 31.25);
    const campanhaAtualizada = await buscarCampanhaPorCodigo("DARK26");

    expect(campanhaAtualizada.tokens.find((item) => item.id === token.id)).toEqual(
      expect.objectContaining({ x: 72.5, y: 31.25 }),
    );
  });

  test("restaura a posicao do token ao voltar para um mapa", async () => {
    const cena = await salvarCena("demo", {
      nome: "Dois andares",
      mapasBatalha: [
        { id: "andar-1", nome: "Primeiro andar", url: "/andar-1.webp" },
        { id: "andar-2", nome: "Segundo andar", url: "/andar-2.webp" },
      ],
    });
    const token = (await buscarCampanhaPorCodigo("DARK26")).tokens[0];

    await ativarCena("demo", cena.id, "mapa", "andar-1");
    await moverToken(token.id, 18, 27, `${cena.id}:andar-1`);
    await ativarCena("demo", cena.id, "mapa", "andar-2");
    await moverToken(token.id, 76, 63, `${cena.id}:andar-2`);
    await ativarCena("demo", cena.id, "mapa", "andar-1");

    expect((await buscarCampanhaPorCodigo("DARK26")).tokens.find((item) => item.id === token.id))
      .toEqual(expect.objectContaining({ x: 18, y: 27 }));
  });

  test("organiza e move cenas entre pastas", async () => {
    const cena = await salvarCena("demo", { nome: "Cela 12", pasta: "Prisão" });
    expect(cena.pasta).toBe("Prisão");

    await salvarCena("demo", { ...cena, pasta: "Subsolo" });
    const campanha = await buscarCampanhaPorCodigo("DARK26");
    expect(campanha.cenas.find((item) => item.id === cena.id)?.pasta).toBe("Subsolo");
  });

  test("cria campanhas com bibliotecas independentes", async () => {
    const campanha = await criarCampanhaMesa("Arquivo Vermelho");
    await salvarCena(campanha.id, { nome: "Laboratorio", pasta: "Ato 1" });
    const aberta = await buscarCampanhaPorCodigo(campanha.codigo);
    const todas = await listarCampanhas();

    expect(todas).toContainEqual(expect.objectContaining({ id: campanha.id }));
    expect(aberta.cenas).toHaveLength(1);
    expect(aberta.cenas[0].nome).toBe("Laboratorio");
    expect((await buscarCampanhaPorCodigo("DARK26")).cenas.some((cena) => cena.nome === "Laboratorio")).toBe(false);
  });

  test("salva varias cenas estaticas e mapas na mesma cena", async () => {
    const cena = await salvarCena("demo", {
      nome: "Complexo",
      imagensCena: [
        { id: "estatica-1", nome: "Corredor vazio", url: "/vazio.webp" },
        { id: "estatica-2", nome: "Emboscada", url: "/emboscada.webp" },
      ],
      mapasBatalha: [
        { id: "mapa-1", nome: "Piso superior", url: "/piso.webp", larguraGrade: 14, alturaGrade: 9 },
        { id: "mapa-2", nome: "Subsolo", url: "/subsolo.webp", larguraGrade: 18, alturaGrade: 12 },
      ],
    });
    await ativarCena("demo", cena.id, "mapa", "mapa-2");
    const campanha = await buscarCampanhaPorCodigo("DARK26");

    expect(campanha.cenaAtiva.imagensCena).toHaveLength(2);
    expect(campanha.cenaAtiva.mapasBatalha).toHaveLength(2);
    expect(campanha.midiaAtivaId).toBe("mapa-2");
  });
});
