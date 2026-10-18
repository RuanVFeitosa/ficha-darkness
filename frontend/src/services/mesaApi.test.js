import { registrarRolagem, salvarTokenCustom3D, salvarEstadoToken3D, obterEstadoToken3D, ativarCena, atualizarEstadoMusica, atualizarRevelacaoDocumentoInvestigacao, buscarCampanhaPorCodigo, criarCampanhaMesa, desvincularFicha, excluirCena, listarCampanhas, listarCampanhasDaFicha, moverToken, salvarCena, salvarClima3DCampanha, salvarEvidenciaInterativa, salvarMusicasCampanha, salvarMapas3DCampanha, validarArquivoImagem, vincularFicha } from "./mesaApi";

describe("biblioteca local da mesa", () => {
  test('salva e reabre a animação individual das imagens narrativas', async()=>{
    const animation={enabled:true,breathing:.01,sway:.005,closedImage:'data:image/webp;base64,YQ==',region:{x:.2,y:.15,width:.5,height:.2}};
    const cena=await salvarCena('demo',{nome:'Boss',imagensCena:[{id:'boss',nome:'O guardião',url:'/boss.webp',animation},{id:'local',nome:'Sala',url:'/sala.webp'}],mapasBatalha:[]});
    await ativarCena('demo',cena.id,'cena','boss');
    const campanha=await buscarCampanhaPorCodigo('DARK26');
    expect(campanha.cenaAtiva.imagensCena[0].animation).toEqual(animation);
    expect(campanha.cenaAtiva.imagensCena[1].animation).toBeUndefined();
  });
  test("limita o tamanho das cenas e mapas antes do upload", () => {
    expect(() => validarArquivoImagem(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "cena.webp", { type: "image/webp" }), "cena")).toThrow("2 MB");
    expect(() => validarArquivoImagem(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "mapa.webp", { type: "image/webp" }), "mapa")).toThrow("5 MB");
    expect(() => validarArquivoImagem(new File(["svg"], "cena.svg", { type: "image/svg+xml" }), "cena")).toThrow("Formato nao permitido");
  });
  beforeEach(() => localStorage.clear());

  test("mantem evidencia preparada oculta ate o mestre envia-la", async () => {
    const preparada = await salvarEvidenciaInterativa("demo", {
      nome: "Computador do arquivo",
      modeloInterativo: "modern-pc",
      revelada: false,
    });

    expect(preparada.revelada).toBe(false);
    await atualizarRevelacaoDocumentoInvestigacao("demo", preparada.id, true);

    const campanha = await buscarCampanhaPorCodigo("DARK26");
    expect(campanha.documentosInvestigacao.find((item) => item.id === preparada.id))
      .toEqual(expect.objectContaining({ revelada: true }));
  });

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

  test("lista somente as campanhas vinculadas a ficha", async () => {
    await vincularFicha("demo", "agente-mobile", { nome: "Agente Mobile" });
    const campanhas = await listarCampanhasDaFicha("agente-mobile");

    expect(campanhas).toHaveLength(1);
    expect(campanhas[0]).toEqual(expect.objectContaining({ codigo: "DARK26" }));
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
    const campanha = await criarCampanhaMesa("Arquivo Vermelho", "3d");
    await salvarCena(campanha.id, { nome: "Laboratorio", pasta: "Ato 1" });
    await salvarMapas3DCampanha(campanha.id, [{ id: "mapa3d-1", nome: "Laboratório 3D", assets: [{ instanceId: "mesa-1" }] }]);
    const aberta = await buscarCampanhaPorCodigo(campanha.codigo);
    const todas = await listarCampanhas();

    expect(todas).toContainEqual(expect.objectContaining({ id: campanha.id }));
    expect(aberta.tabletop_tipo).toBe("3d");
    expect(aberta.mapas3D).toEqual([expect.objectContaining({ id: "mapa3d-1", nome: "Laboratório 3D" })]);
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
        { id: "mapa3d-cena-mapa3d-1", nome: "Laboratório 3D", url: "", origem: "tabletop3d", mapa3dId: "mapa3d-1", exibirGrade: false },
      ],
    });
    await ativarCena("demo", cena.id, "mapa", "mapa-2");
    const campanha = await buscarCampanhaPorCodigo("DARK26");

    expect(campanha.cenaAtiva.imagensCena).toHaveLength(2);
    expect(campanha.cenaAtiva.mapasBatalha).toHaveLength(3);
    expect(campanha.cenaAtiva.mapasBatalha).toContainEqual(expect.objectContaining({ origem: "tabletop3d", mapa3dId: "mapa3d-1" }));
    expect(campanha.midiaAtivaId).toBe("mapa-2");
  });

  test("salva a playlist manual da campanha", async () => {
    await salvarMusicasCampanha("demo", [
      { id: "tema-1", nome: "Tema da convergencia", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", capa: "https://exemplo.com/capa.webp" },
    ]);
    expect((await buscarCampanhaPorCodigo("DARK26")).musicas).toContainEqual(expect.objectContaining({
      id: "tema-1",
      nome: "Tema da convergencia",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    }));
  });

  test("compartilha o estado atual da musica com a campanha", async () => {
    await atualizarEstadoMusica("demo", {
      indice: 2,
      tempo: 37,
      tocando: true,
      volume: 54,
      repetindo: true,
    });

    expect((await buscarCampanhaPorCodigo("DARK26")).musicaEstado).toEqual(expect.objectContaining({
      indice: 2,
      tempo: 37,
      tocando: true,
      volume: 54,
      repetindo: true,
      atualizadoEm: expect.any(String),
    }));
  });

  test("sincroniza o clima do tabletop 3D", async () => {
    await salvarClima3DCampanha("demo", {
      preset: "ato3",
      skyColor: "#53070a",
      rain: 0.2,
      snow: 0,
    });

    expect((await buscarCampanhaPorCodigo("DARK26")).clima3D).toEqual(expect.objectContaining({
      preset: "ato3",
      skyColor: "#53070a",
      rain: 0.2,
      atualizadoEm: expect.any(String),
    }));
  });
});

test('sincroniza a posição 3D da ficha entre leitores sem alterar a posição 2D', async () => {
 localStorage.clear();
 await vincularFicha('demo','espiral:ana',{nome:'Ana'});
 const before=await buscarCampanhaPorCodigo('DARK26');
 const token=before.tokens.find(t => t.ficha_id==='espiral:ana');
 await salvarEstadoToken3D(token.id,'mapa-a',{x:2,z:3,elevation:4,scale:0.5,image:'body',origin:'jogador'});
 const after=await buscarCampanhaPorCodigo('DARK26');
 const shared=after.tokens.find(t => t.id===token.id);
 expect(obterEstadoToken3D(shared,'mapa-a')).toMatchObject({x:2,z:3,elevation:4,scale:0.5,origin:'jogador'});
 expect(shared.x).toBe(token.x);
 expect(shared.y).toBe(token.y);
 await salvarEstadoToken3D(token.id,'mapa-a',{x:8,z:9,origin:'mestre'});
 const updated=await buscarCampanhaPorCodigo('DARK26');
 expect(obterEstadoToken3D(updated.tokens.find(t => t.id===token.id),'mapa-a')).toMatchObject({x:8,z:9,elevation:4,image:'body',origin:'mestre'});
 expect(obterEstadoToken3D(shared,'outro-mapa')).toBeNull();
});
test('token importado pelo mestre publica imagem e posição para outros leitores', async () => {
 localStorage.clear();
 await salvarTokenCustom3D('demo','mapa-a',{id:'token-importado',name:'NPC',image:'body',x:4,z:5,scale:0.8},'mestre');
 const campaign=await buscarCampanhaPorCodigo('DARK26');
 const shared=campaign.tokens.find(token => token.ficha_id==='custom3d:token-importado');
 expect(obterEstadoToken3D(shared,'mapa-a')).toMatchObject({id:'token-importado',image:'body',x:4,z:5,scale:0.8});
});
 test('registra o maior dado dos testes ESPIRAL sem converter em zero',async()=>{
  localStorage.clear();
  const roll=await registrarRolagem('demo','Victoria',{type:'test',label:'Pulso + Atletismo',best:12,dice:[4,12],pressure:[],margin:3});
  expect(roll.resultado).toBe(12);
  expect(roll.expressao).toBe('Pulso + Atletismo');
  expect(roll.detalhes.margin).toBe(3);
 });
 test('preserva totais e resultados zero ao registrar fórmulas',async()=>{
  const roll=await registrarRolagem('demo','Victoria',{total:0,best:12,formula:'1d6-6'});
  expect(roll.resultado).toBe(0);
 });

test('persiste as dificuldades das três categorias na cena',async()=>{
 localStorage.clear();
 const scene=await salvarCena('demo',{nome:'Perseguição',dificuldades:{ambiente:6,combateAmbiente:9,conflitos:12}});
 const campanha=await buscarCampanhaPorCodigo('DARK26');
 expect(campanha.cenas.find(item=>item.id===scene.id).dificuldades).toEqual({ambiente:6,combateAmbiente:9,conflitos:12});
});
test("sincroniza a lanterna do token 3D e preserva a posição", async () => {
  localStorage.clear();
  await vincularFicha("demo", "lanterna-test", { nome: "Personagem" });
  const initial = await buscarCampanhaPorCodigo("DARK26");
  const token = initial.tokens.find(item => item.ficha_id === "lanterna-test");
  await salvarEstadoToken3D(token.id, "mapa-lanterna", { x: 2, z: 3 });
  const lanterna = { ativa: true, alcance: 18, direcao: 90, abertura: 50, cor: "#ffffff" };
  await salvarEstadoToken3D(token.id, "mapa-lanterna", { lanterna });
  const refreshed = await buscarCampanhaPorCodigo("DARK26");
  const state = obterEstadoToken3D(refreshed.tokens.find(item => item.id === token.id), "mapa-lanterna");
  expect(state).toEqual(expect.objectContaining({ x: 2, z: 3, lanterna }));
});

test("agrupa posições pendentes sem perder ajustes do token", async () => {
 localStorage.clear();
 await vincularFicha("demo", "movimento-fluido", {nome:"Movimento"});
 const campaign=await buscarCampanhaPorCodigo("DARK26");
 const token=campaign.tokens.find(item => item.ficha_id==="movimento-fluido");
 await Promise.all([
   salvarEstadoToken3D(token.id,"fluido",{x:1,z:1}),
   salvarEstadoToken3D(token.id,"fluido",{scale:0.5,x:2,z:2}),
   salvarEstadoToken3D(token.id,"fluido",{x:3,z:3}),
   salvarEstadoToken3D(token.id,"fluido",{x:4,z:4}),
 ]);
 const refreshed=await buscarCampanhaPorCodigo("DARK26");
 expect(obterEstadoToken3D(refreshed.tokens.find(item => item.id===token.id),"fluido")).toEqual(expect.objectContaining({x:4,z:4,scale:0.5}));
});
