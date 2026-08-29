import { supabase, supabaseConfigurado, supabaseObrigatorioAusente } from "./supabase";

const CENAS_DEMO_PADRAO = [
  { id: "sala-marcos", nome: "A sala de Marcos", descricao: "A chuva bate contra os vidros. Algo se move no corredor.", imagemUrl: "/SalaMarcos.webp", mapaUrl: "/SalaMarcos.webp", larguraGrade: 12, alturaGrade: 8, ordem: 0 },
  { id: "o-absoluto", nome: "O Absoluto", descricao: "O silencio termina quando a presenca se revela.", imagemUrl: "/OAbsoluto.webp", mapaUrl: "/OAbsoluto.webp", larguraGrade: 14, alturaGrade: 9, ordem: 1 },
  { id: "loja-helena", nome: "Loja de Helena", descricao: "Prateleiras antigas escondem artefatos de procedencia duvidosa.", imagemUrl: "/loja-helena.webp", mapaUrl: "/loja-helena.webp", larguraGrade: 12, alturaGrade: 8, ordem: 2 },
];
const DEMO_STORAGE_KEY = "darkness_mesa_demo";
const DEMO_CAMPAIGNS_KEY = "darkness_campanhas_demo";
const MEMBROS_DEMO = [
  { id: "demo-m1", ficha_id: "marcos", nome: "Marcos", papel: "jogador" },
  { id: "demo-m2", ficha_id: "helena", nome: "Helena", papel: "jogador" },
];
const TOKENS_DEMO = [
  { id: "demo-t1", ficha_id: "marcos", nome: "Marcos", x: 34, y: 58 },
  { id: "demo-t2", ficha_id: "helena", nome: "Helena", x: 46, y: 46 },
];
const chaveDemo = (campanhaId = "demo") => campanhaId === "demo" ? DEMO_STORAGE_KEY : `${DEMO_STORAGE_KEY}:${campanhaId}`;
const carregarDemo = (campanhaId = "demo") => {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveDemo(campanhaId)));
    if (salvo && Array.isArray(salvo.cenas)) return salvo;
  } catch {}
  if (campanhaId === "demo") {
    return { cenas: CENAS_DEMO_PADRAO, cenaAtivaId: CENAS_DEMO_PADRAO[0].id, modo: "cena", combateAtivo: false, investigacaoAtiva: false, iniciativas: {}, documentosInvestigacao: [], membros: MEMBROS_DEMO, tokens: TOKENS_DEMO };
  }
  return { cenas: [], cenaAtivaId: null, modo: "cena", combateAtivo: false, investigacaoAtiva: false, iniciativas: {}, documentosInvestigacao: [], membros: [], tokens: [] };
};
const salvarDemo = (estado, campanhaId = "demo") => {
  localStorage.setItem(chaveDemo(campanhaId), JSON.stringify(estado));
  window.dispatchEvent(new CustomEvent("darkness:campanha-demo", { detail: { campanhaId, estado } }));
};

const CAMPANHA_DEMO = {
  id: "demo",
  codigo: "DARK26",
  nome: "Ecos na Escuridao",
  modo: "cena",
  rolagens: [
    { id: "demo-r1", autor_nome: "Marcos", expressao: "2d10 + Razao", resultado: 14 },
    { id: "demo-r2", autor_nome: "Helena", expressao: "1d20", resultado: 17 },
  ],
};

const listarCampanhasDemo = () => {
  try {
    const campanhas = JSON.parse(localStorage.getItem(DEMO_CAMPAIGNS_KEY));
    if (Array.isArray(campanhas)) return campanhas;
  } catch {}
  const iniciais = [{ id: "demo", codigo: "DARK26", nome: CAMPANHA_DEMO.nome, modo: "cena", criado_em: new Date().toISOString() }];
  localStorage.setItem(DEMO_CAMPAIGNS_KEY, JSON.stringify(iniciais));
  return iniciais;
};
const salvarCampanhasDemo = (campanhas) => localStorage.setItem(DEMO_CAMPAIGNS_KEY, JSON.stringify(campanhas));

const IMAGENS_DB = "darkness-tabletop-arquivos";
const IMAGENS_STORE = "imagens";
const urlsImagensLocais = new Map();
const abrirBancoImagens = () => new Promise((resolve, reject) => {
  const requisicao = indexedDB.open(IMAGENS_DB, 1);
  requisicao.onupgradeneeded = () => requisicao.result.createObjectStore(IMAGENS_STORE);
  requisicao.onsuccess = () => resolve(requisicao.result);
  requisicao.onerror = () => reject(requisicao.error);
});
const guardarImagemLocal = async (arquivo, chave) => {
  const banco = await abrirBancoImagens();
  await new Promise((resolve, reject) => {
    const transacao = banco.transaction(IMAGENS_STORE, "readwrite");
    transacao.objectStore(IMAGENS_STORE).put(arquivo, chave);
    transacao.oncomplete = resolve;
    transacao.onerror = () => reject(transacao.error);
  });
  banco.close();
  return `local-image://${chave}`;
};
const resolverImagemLocal = async (url) => {
  if (!String(url || "").startsWith("local-image://") || typeof indexedDB === "undefined") return url;
  const chave = url.slice("local-image://".length);
  if (urlsImagensLocais.has(chave)) return urlsImagensLocais.get(chave);
  const banco = await abrirBancoImagens();
  const arquivo = await new Promise((resolve, reject) => {
    const requisicao = banco.transaction(IMAGENS_STORE, "readonly").objectStore(IMAGENS_STORE).get(chave);
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
  });
  banco.close();
  if (!arquivo) return "";
  const resolvida = URL.createObjectURL(arquivo);
  urlsImagensLocais.set(chave, resolvida);
  return resolvida;
};

const normalizarMidiasCena = (cena = {}) => {
  // Durante a edição existem, ao mesmo tempo, os campos vindos do Supabase
  // (imagens_cena/mapas_batalha) e os campos usados pela interface
  // (imagensCena/mapasBatalha). A interface precisa ter prioridade, inclusive
  // quando o array está vazio, para que adicionar/remover mídias seja persistido.
  const temImagensDaInterface = Object.prototype.hasOwnProperty.call(cena, "imagensCena");
  const temMapasDaInterface = Object.prototype.hasOwnProperty.call(cena, "mapasBatalha");
  const imagensOrigem = temImagensDaInterface ? cena.imagensCena : cena.imagens_cena;
  const mapasOrigem = temMapasDaInterface ? cena.mapasBatalha : cena.mapas_batalha;
  const imagens = Array.isArray(imagensOrigem) ? imagensOrigem : [];
  const mapas = Array.isArray(mapasOrigem) ? mapasOrigem : [];
  const imagemAntiga = cena.imagemUrl || cena.imagem_url;
  const mapaAntigo = cena.mapaUrl || cena.mapa_url;
  return {
    ...cena,
    imagensCena: imagens.length ? imagens : imagemAntiga ? [{ id: `cena-${cena.id || "nova"}-1`, nome: "Cena principal", url: imagemAntiga }] : [],
    mapasBatalha: mapas.length ? mapas : mapaAntigo ? [{ id: `mapa-${cena.id || "nova"}-1`, nome: "Mapa principal", url: mapaAntigo, larguraGrade: cena.largura_grade || cena.larguraGrade || 12, alturaGrade: cena.altura_grade || cena.alturaGrade || 8 }] : [],
  };
};
const resolverMidiasLocais = async (cena) => {
  const normalizada = normalizarMidiasCena(cena);
  const [imagensCena, mapasBatalha] = await Promise.all([
    Promise.all(normalizada.imagensCena.map(async (midia) => ({ ...midia, urlPersistida: midia.url, url: await resolverImagemLocal(midia.url) }))),
    Promise.all(normalizada.mapasBatalha.map(async (midia) => ({ ...midia, urlPersistida: midia.url, url: await resolverImagemLocal(midia.url) }))),
  ]);
  return { ...normalizada, imagensCena, mapasBatalha };
};

export const chavePosicaoMapa = (cenaId, midiaId = null) => `${cenaId || "sem-cena"}:${midiaId || "mapa-principal"}`;
const chaveEstadoTokenMapa = (mapaChave = "mapa-principal") => `__estado:${mapaChave}`;
const consolidarTokens = (tokens = []) => {
  const unicos = new Map();
  tokens.forEach((token) => {
    const chave = token.ficha_id
      ? `${token.campanha_id || "campanha"}:${token.ficha_id}`
      : token.id;
    const existente = unicos.get(chave);
    const dataExistente = Date.parse(existente?.atualizado_em || "") || 0;
    const dataToken = Date.parse(token?.atualizado_em || "") || 0;
    if (!existente || dataToken >= dataExistente) unicos.set(chave, token);
  });
  return [...unicos.values()];
};
const aplicarPosicaoDoMapa = (tokens, campanha) => {
  const chave = chavePosicaoMapa(campanha.cena_ativa_id, campanha.midia_ativa_id);
  const chaveEstado = chaveEstadoTokenMapa(chave);
  return consolidarTokens(tokens).map((token) => ({
    ...token,
    ...(token.posicoes?.[chave] || {}),
    ...(token.posicoes?.[chaveEstado] || {}),
  }));
};

const normalizarCampanha = (campanha, cenas = [], membros = [], tokens = [], rolagens = [], inimigos = [], iniciativas = [], documentosInvestigacao = []) => ({
  ...campanha,
  cenaAtiva: (cenas.map(normalizarMidiasCena).find((cena) => cena.id === campanha.cena_ativa_id) || cenas.map(normalizarMidiasCena)[0] || null),
  midiaAtivaId: campanha.midia_ativa_id || null,
  modo: campanha.modo || "cena",
  combateAtivo: Boolean(campanha.combate_ativo),
  investigacaoAtiva: Boolean(campanha.investigacao_ativa),
  iniciativas: Object.fromEntries((iniciativas || []).map((item) => [item.ficha_id, Number(item.valor) || 0])),
  documentosInvestigacao: (documentosInvestigacao || []).map((item) => ({
    ...item,
    categoria: item.categoria || "evidencia",
    mimeType: item.mime_type || item.mimeType || "",
    arquivoNome: item.arquivo_nome || item.arquivoNome || "",
    storagePath: item.storage_path || item.storagePath || "",
    criadoEm: item.criado_em || item.criadoEm || null,
    visualizarTodos:
      item.visualizar_todos ?? item.visualizarTodos ?? true,
    jogadoresVisiveis: Array.isArray(item.jogadores_visiveis)
      ? item.jogadores_visiveis.map(String)
      : Array.isArray(item.jogadoresVisiveis)
        ? item.jogadoresVisiveis.map(String)
        : [],
  })),
  cenas: cenas.map(normalizarMidiasCena),
  membros,
  tokens: aplicarPosicaoDoMapa(tokens, campanha),
  rolagens,
  inimigos: inimigos.map((item) => ({ ...(item.dados || {}), ...item })),
  musicas: Array.isArray(campanha.musicas) ? campanha.musicas : [],
  musicaEstado: campanha.musica_estado || null,
});

export const buscarCampanhaPorCodigo = async (codigo) => {
  const codigoNormalizado = String(codigo || "").trim().toUpperCase();

  if (!supabaseConfigurado) {
    const campanha = listarCampanhasDemo().find((item) => item.codigo === codigoNormalizado);
    if (!campanha) return null;
    const demo = carregarDemo(campanha.id);
    const cenas = await Promise.all(demo.cenas.map(resolverMidiasLocais));
    const tokens = aplicarPosicaoDoMapa(demo.tokens || TOKENS_DEMO, { cena_ativa_id: demo.cenaAtivaId, midia_ativa_id: demo.midiaAtivaId });
    const documentosInvestigacao = await Promise.all((demo.documentosInvestigacao || []).map(async (documento) => ({
      ...documento,
      urlPersistida: documento.urlPersistida || documento.url,
      url: await resolverImagemLocal(documento.urlPersistida || documento.url),
    })));
    return { ...CAMPANHA_DEMO, ...campanha, modo: demo.modo, combateAtivo: Boolean(demo.combateAtivo), investigacaoAtiva: Boolean(demo.investigacaoAtiva), iniciativas: demo.iniciativas || {}, documentosInvestigacao, midiaAtivaId: demo.midiaAtivaId || null, cenas, membros: demo.membros || MEMBROS_DEMO, tokens, rolagens: demo.rolagens || CAMPANHA_DEMO.rolagens, inimigos: demo.inimigos || [], musicas: demo.musicas || [], musicaEstado: demo.musicaEstado || null, cenaAtiva: cenas.find((cena) => cena.id === demo.cenaAtivaId) || cenas[0] };
  }

  const { data: campanha, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("codigo", codigoNormalizado)
    .maybeSingle();
  if (error) throw error;
  if (!campanha) return null;

  const [cenas, membros, tokens, rolagens, inimigos, iniciativas, documentosInvestigacao] = await Promise.all([
    supabase.from("cenas").select("*").eq("campanha_id", campanha.id).order("ordem"),
    supabase.from("membros_campanha").select("*").eq("campanha_id", campanha.id),
    supabase.from("tokens_mapa").select("*").eq("campanha_id", campanha.id),
    supabase.from("rolagens").select("*").eq("campanha_id", campanha.id).order("criado_em", { ascending: false }).limit(30),
    supabase.from("inimigos_campanha").select("*").eq("campanha_id", campanha.id).order("criado_em"),
    supabase.from("iniciativas_campanha").select("*").eq("campanha_id", campanha.id),
    supabase.from("documentos_investigacao").select("*").eq("campanha_id", campanha.id).order("criado_em", { ascending: false }),
  ]);
  [cenas, membros, tokens, rolagens, inimigos, iniciativas, documentosInvestigacao].forEach(({ error: erro }) => {
    if (erro) throw erro;
  });

  return normalizarCampanha(campanha, cenas.data, membros.data, tokens.data, rolagens.data, inimigos.data, iniciativas.data, documentosInvestigacao.data);
};

export const listarCampanhas = async () => {
  if (!supabaseConfigurado) return listarCampanhasDemo();
  const { data, error } = await supabase.from("campanhas").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listarCampanhasDaFicha = async (fichaId) => {
  const id = String(fichaId || "").trim();
  if (!id) return [];
  if (supabaseObrigatorioAusente) {
    throw new Error("O tabletop online nao esta conectado ao Supabase. Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no Vercel e publique novamente.");
  }
  if (!supabaseConfigurado) {
    const campanhas = listarCampanhasDemo();
    const completas = await Promise.all(campanhas.map((campanha) => buscarCampanhaPorCodigo(campanha.codigo)));
    return completas.filter((campanha) => campanha?.membros?.some((membro) => membro.ficha_id === id));
  }

  const { data: vinculos, error } = await supabase
    .from("membros_campanha")
    .select("campanha_id")
    .eq("ficha_id", id);
  if (error) throw error;
  const ids = [...new Set((vinculos || []).map((item) => item.campanha_id).filter(Boolean))];
  if (!ids.length) return [];

  const { data: campanhas, error: erroCampanhas } = await supabase
    .from("campanhas")
    .select("codigo")
    .in("id", ids)
    .order("criado_em", { ascending: false });
  if (erroCampanhas) throw erroCampanhas;
  return Promise.all((campanhas || []).map((campanha) => buscarCampanhaPorCodigo(campanha.codigo)));
};

export const criarCampanhaMesa = async (nome) => {
  const codigo = `${String(nome || "CAMP").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase().padEnd(4, "X")}${Math.floor(10 + Math.random() * 90)}`;
  if (!supabaseConfigurado) {
    const campanhas = listarCampanhasDemo();
    const campanha = { id: `demo-${Date.now()}`, codigo, nome: String(nome).trim(), modo: "cena", criado_em: new Date().toISOString() };
    salvarCampanhasDemo([campanha, ...campanhas]);
    salvarDemo({ cenas: [], cenaAtivaId: null, modo: "cena", combateAtivo: false, investigacaoAtiva: false, iniciativas: {}, documentosInvestigacao: [], membros: [], tokens: [] }, campanha.id);
    return campanha;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("campanhas").insert({ nome: String(nome).trim(), codigo, mestre_id: user?.id || null }).select().single();
  if (error) throw error;
  return data;
};

export const excluirCampanhaMesa = async (campanhaId) => {
  if (!supabaseConfigurado) {
    salvarCampanhasDemo(listarCampanhasDemo().filter((item) => item.id !== campanhaId));
    localStorage.removeItem(chaveDemo(campanhaId));
    return;
  }
  const { error } = await supabase.from("campanhas").delete().eq("id", campanhaId);
  if (error) throw error;
};

export const atualizarModoCampanha = async (campanhaId, modo) => {
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId); salvarDemo({ ...demo, modo }, campanhaId); return;
  }
  const { error } = await supabase.from("campanhas").update({ modo }).eq("id", campanhaId);
  if (error) throw error;
};

export const atualizarModoCombate = async (campanhaId, ativo, limparIniciativas = false) => {
  const combateAtivo = Boolean(ativo);
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({
      ...demo,
      combateAtivo,
      investigacaoAtiva: combateAtivo ? false : Boolean(demo.investigacaoAtiva),
      iniciativas: limparIniciativas ? {} : (demo.iniciativas || {}),
    }, campanhaId);
    return;
  }
  const payload = { combate_ativo: combateAtivo };
  if (combateAtivo) payload.investigacao_ativa = false;
  const { error } = await supabase.from("campanhas").update(payload).eq("id", campanhaId);
  if (error) throw error;
  if (limparIniciativas) {
    const { error: erroLimpeza } = await supabase.from("iniciativas_campanha").delete().eq("campanha_id", campanhaId);
    if (erroLimpeza) throw erroLimpeza;
  }
};

export const atualizarModoInvestigacao = async (campanhaId, ativo, limparIniciativas = false) => {
  const investigacaoAtiva = Boolean(ativo);
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({
      ...demo,
      investigacaoAtiva,
      combateAtivo: investigacaoAtiva ? false : Boolean(demo.combateAtivo),
      iniciativas: limparIniciativas ? {} : (demo.iniciativas || {}),
    }, campanhaId);
    return;
  }
  const payload = { investigacao_ativa: investigacaoAtiva };
  if (investigacaoAtiva) payload.combate_ativo = false;
  const { error } = await supabase.from("campanhas").update(payload).eq("id", campanhaId);
  if (error) throw error;
  if (limparIniciativas) {
    const { error: erroLimpeza } = await supabase.from("iniciativas_campanha").delete().eq("campanha_id", campanhaId);
    if (erroLimpeza) throw erroLimpeza;
  }
};

export const definirIniciativa = async (campanhaId, fichaId, valor, nome = "") => {
  const ficha = String(fichaId || "").trim();
  if (!ficha) throw new Error("Ficha invalida para iniciativa.");
  const iniciativa = Math.max(0, Number(valor) || 0);

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({
      ...demo,
      iniciativas: { ...(demo.iniciativas || {}), [ficha]: iniciativa },
    }, campanhaId);
    return { campanha_id: campanhaId, ficha_id: ficha, valor: iniciativa, nome };
  }

  const { data, error } = await supabase
    .from("iniciativas_campanha")
    .upsert({ campanha_id: campanhaId, ficha_id: ficha, valor: iniciativa, nome: String(nome || "") }, { onConflict: "campanha_id,ficha_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removerIniciativa = async (campanhaId, fichaId) => {
  const ficha = String(fichaId || "").trim();
  if (!ficha) return;
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    const iniciativas = { ...(demo.iniciativas || {}) };
    delete iniciativas[ficha];
    salvarDemo({ ...demo, iniciativas }, campanhaId);
    return;
  }
  const { error } = await supabase.from("iniciativas_campanha").delete().eq("campanha_id", campanhaId).eq("ficha_id", ficha);
  if (error) throw error;
};

export const ativarCena = async (campanhaId, cenaId, modo = "cena", midiaId = null) => {
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId); salvarDemo({ ...demo, cenaAtivaId: cenaId, modo, midiaAtivaId: midiaId }, campanhaId); return;
  }
  const { error } = await supabase.from("campanhas").update({ cena_ativa_id: cenaId, modo, midia_ativa_id: midiaId }).eq("id", campanhaId);
  if (error) throw error;
};

export const salvarMusicasCampanha = async (campanhaId, musicas) => {
  const normalizadas = (musicas || []).map((musica, indice) => ({
    id: musica.id || `musica-${Date.now()}-${indice}`,
    nome: String(musica.nome || `Musica ${indice + 1}`).trim(),
    url: String(musica.url || "").trim(),
    capa: String(musica.capa || "").trim(),
  })).filter((musica) => musica.url);
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({ ...demo, musicas: normalizadas }, campanhaId);
    return normalizadas;
  }
  const { error } = await supabase.from("campanhas").update({ musicas: normalizadas }).eq("id", campanhaId);
  if (error) throw error;
  return normalizadas;
};

export const atualizarEstadoMusica = async (campanhaId, estado) => {
  const musicaEstado = { ...estado, atualizadoEm: new Date().toISOString() };
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({ ...demo, musicaEstado }, campanhaId);
    return musicaEstado;
  }
  const { error } = await supabase.from("campanhas").update({ musica_estado: musicaEstado }).eq("id", campanhaId);
  if (error) throw error;
  return musicaEstado;
};

export const salvarCena = async (campanhaId, cena) => {
  const normalizada = normalizarMidiasCena(cena);
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId);
    const id = cena.id || `cena-${Date.now()}`;
    const nova = {
      ...normalizada,
      imagensCena: normalizada.imagensCena.map((midia) => ({ ...midia, url: String(midia.url || "").startsWith("local-image://") ? midia.url : (midia.urlPersistida || midia.url) })),
      mapasBatalha: normalizada.mapasBatalha.map((midia) => ({ ...midia, url: String(midia.url || "").startsWith("local-image://") ? midia.url : (midia.urlPersistida || midia.url) })),
      id,
      ordem: cena.ordem ?? demo.cenas.length,
    };
    const cenas = demo.cenas.some((item) => item.id === id) ? demo.cenas.map((item) => item.id === id ? nova : item) : [...demo.cenas, nova];
    salvarDemo({ ...demo, cenas }, campanhaId); return nova;
  }
  const imagensPersistidas = normalizada.imagensCena.map(({ urlPersistida, ...midia }) => ({
    ...midia,
    url: urlPersistida || midia.url,
  }));
  const mapasPersistidos = normalizada.mapasBatalha.map(({ urlPersistida, ...midia }) => ({
    ...midia,
    url: urlPersistida || midia.url,
    larguraGrade: Number(midia.larguraGrade || cena.larguraGrade || cena.largura_grade || 12),
    alturaGrade: Number(midia.alturaGrade || cena.alturaGrade || cena.altura_grade || 8),
  }));
  const payload = {
    ...(cena.id ? { id: cena.id } : {}), campanha_id: campanhaId, nome: cena.nome,
    descricao: cena.descricao || "", imagem_url: imagensPersistidas[0]?.url || null,
    mapa_url: mapasPersistidos[0]?.url || null, largura_grade: Number(cena.larguraGrade || cena.largura_grade || 12),
    altura_grade: Number(cena.alturaGrade || cena.altura_grade || 8), ordem: Number(cena.ordem || 0),
    pasta: String(cena.pasta || "Sem pasta").trim() || "Sem pasta",
    imagens_cena: imagensPersistidas,
    mapas_batalha: mapasPersistidos,
  };
  const { data, error } = await supabase.from("cenas").upsert(payload).select().single();
  if (error) throw error; return data;
};

export const excluirCena = async (campanhaId, cenaId) => {
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId);
    const cenas = demo.cenas.filter((item) => item.id !== cenaId);
    salvarDemo({ ...demo, cenas, cenaAtivaId: demo.cenaAtivaId === cenaId ? cenas[0]?.id : demo.cenaAtivaId }, campanhaId); return;
  }
  const { error } = await supabase.from("cenas").delete().eq("id", cenaId).eq("campanha_id", campanhaId);
  if (error) throw error;
};

export const LIMITES_UPLOAD_IMAGEM = {
  cena: { bytes: 2 * 1024 * 1024, rotulo: "2 MB" },
  mapa: { bytes: 5 * 1024 * 1024, rotulo: "5 MB" },
};
const TIPOS_IMAGEM_PERMITIDOS = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);

export const validarArquivoImagem = (arquivo, tipo = "cena") => {
  if (!arquivo) return null;
  const limite = LIMITES_UPLOAD_IMAGEM[tipo] || LIMITES_UPLOAD_IMAGEM.cena;
  if (!TIPOS_IMAGEM_PERMITIDOS.has(arquivo.type)) throw new Error("Formato nao permitido. Use WebP, JPEG, PNG ou AVIF.");
  if (arquivo.size > limite.bytes) throw new Error(`${tipo === "mapa" ? "O mapa de batalha" : "A cena estatica"} deve ter no maximo ${limite.rotulo}. Converta a imagem para WebP antes de enviar.`);
  return arquivo;
};

export const enviarImagemCena = async (campanhaId, arquivo, tipo) => {
  if (!arquivo) return null;
  validarArquivoImagem(arquivo, tipo);
  if (!supabaseConfigurado || campanhaId === "demo") {
    if (typeof indexedDB !== "undefined") {
      const chave = `${campanhaId}-${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return guardarImagemLocal(arquivo, chave);
    }
    return new Promise((resolve, reject) => { const leitor = new FileReader(); leitor.onload = () => resolve(leitor.result); leitor.onerror = reject; leitor.readAsDataURL(arquivo); });
  }
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "webp";
  const sufixo = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
  const caminho = `${campanhaId}/${tipo}-${Date.now()}-${sufixo}.${extensao}`;
  const { error } = await supabase.storage.from("mapas").upload(caminho, arquivo, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("mapas").getPublicUrl(caminho).data.publicUrl;
};

export const LIMITE_DOCUMENTO_INVESTIGACAO = { bytes: 12 * 1024 * 1024, rotulo: "12 MB" };
const TIPOS_DOCUMENTO_INVESTIGACAO = new Set([
  "application/pdf",
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
]);

export const validarArquivoInvestigacao = (arquivo) => {
  if (!arquivo) return null;
  if (!TIPOS_DOCUMENTO_INVESTIGACAO.has(arquivo.type)) {
    throw new Error("Formato nao permitido. Envie PDF, WebP, JPEG, PNG ou AVIF.");
  }
  if (arquivo.size > LIMITE_DOCUMENTO_INVESTIGACAO.bytes) {
    throw new Error(`A evidencia deve ter no maximo ${LIMITE_DOCUMENTO_INVESTIGACAO.rotulo}.`);
  }
  return arquivo;
};

export const salvarDocumentoInvestigacao = async (campanhaId, arquivo, metadados = {}) => {
  validarArquivoInvestigacao(arquivo);
  const categoria = metadados.categoria === "item" ? "item" : "evidencia";
  const nomeBase = String(metadados.nome || arquivo?.name || "Documento").trim() || "Documento";
  const descricao = String(metadados.descricao || "").trim();
  const mimeType = arquivo?.type || "application/octet-stream";
  const visualizarTodos = metadados.visualizarTodos !== false;
  const jogadoresVisiveis = visualizarTodos
    ? []
    : [...new Set((metadados.jogadoresVisiveis || []).map((id) => String(id || "").trim()).filter(Boolean))];

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    let url = "";
    if (typeof indexedDB !== "undefined") {
      const chave = `${campanhaId}-investigacao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      url = await guardarImagemLocal(arquivo, chave);
    } else {
      url = await new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
      });
    }
    const documento = {
      id: `documento-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      campanha_id: campanhaId,
      nome: nomeBase,
      descricao,
      categoria,
      mime_type: mimeType,
      mimeType,
      arquivo_nome: arquivo?.name || "",
      arquivoNome: arquivo?.name || "",
      url,
      urlPersistida: url,
      visualizar_todos: visualizarTodos,
      visualizarTodos,
      jogadores_visiveis: jogadoresVisiveis,
      jogadoresVisiveis,
      criado_em: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    };
    salvarDemo({
      ...demo,
      documentosInvestigacao: [documento, ...(demo.documentosInvestigacao || [])],
    }, campanhaId);
    return { ...documento, url: await resolverImagemLocal(url) };
  }

  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || (mimeType === "application/pdf" ? "pdf" : "bin");
  const sufixo = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
  const storagePath = `${campanhaId}/investigacao/documento-${Date.now()}-${sufixo}.${extensao}`;
  const { error: erroUpload } = await supabase.storage
    .from("evidencias")
    .upload(storagePath, arquivo, { upsert: false, contentType: mimeType });
  if (erroUpload) throw erroUpload;

  const url = supabase.storage.from("evidencias").getPublicUrl(storagePath).data.publicUrl;
  const { data, error } = await supabase
    .from("documentos_investigacao")
    .insert({
      campanha_id: campanhaId,
      nome: nomeBase,
      descricao,
      categoria,
      mime_type: mimeType,
      arquivo_nome: arquivo.name,
      url,
      storage_path: storagePath,
      visualizar_todos: visualizarTodos,
      jogadores_visiveis: jogadoresVisiveis,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("evidencias").remove([storagePath]).catch(() => {});
    throw error;
  }
  return {
    ...data,
    mimeType: data.mime_type,
    arquivoNome: data.arquivo_nome,
    storagePath: data.storage_path,
    criadoEm: data.criado_em,
    visualizarTodos: data.visualizar_todos ?? true,
    jogadoresVisiveis: Array.isArray(data.jogadores_visiveis)
      ? data.jogadores_visiveis.map(String)
      : [],
  };
};

export const atualizarVisibilidadeDocumentoInvestigacao = async (
  campanhaId,
  documentoId,
  visibilidade = {},
) => {
  if (!campanhaId || !documentoId) {
    throw new Error("Documento invalido para atualizar a visibilidade.");
  }

  const visualizarTodos = visibilidade.visualizarTodos !== false;
  const jogadoresVisiveis = visualizarTodos
    ? []
    : [...new Set(
        (visibilidade.jogadoresVisiveis || [])
          .map((id) => String(id || "").trim())
          .filter(Boolean),
      )];

  if (!visualizarTodos && !jogadoresVisiveis.length) {
    throw new Error("Selecione pelo menos um jogador para visualizar o documento.");
  }

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    let atualizado = null;
    const documentos = (demo.documentosInvestigacao || []).map((item) => {
      if (String(item.id) !== String(documentoId)) return item;
      atualizado = {
        ...item,
        visualizar_todos: visualizarTodos,
        visualizarTodos,
        jogadores_visiveis: jogadoresVisiveis,
        jogadoresVisiveis,
      };
      return atualizado;
    });
    if (!atualizado) throw new Error("Documento nao encontrado.");
    salvarDemo({ ...demo, documentosInvestigacao: documentos }, campanhaId);
    return atualizado;
  }

  const { data, error } = await supabase
    .from("documentos_investigacao")
    .update({
      visualizar_todos: visualizarTodos,
      jogadores_visiveis: jogadoresVisiveis,
    })
    .eq("id", documentoId)
    .eq("campanha_id", campanhaId)
    .select()
    .single();
  if (error) throw error;

  return {
    ...data,
    mimeType: data.mime_type,
    arquivoNome: data.arquivo_nome,
    storagePath: data.storage_path,
    criadoEm: data.criado_em,
    visualizarTodos: data.visualizar_todos ?? true,
    jogadoresVisiveis: Array.isArray(data.jogadores_visiveis)
      ? data.jogadores_visiveis.map(String)
      : [],
  };
};

export const excluirDocumentoInvestigacao = async (campanhaId, documento) => {
  const id = typeof documento === "string" ? documento : documento?.id;
  if (!id) return;

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({
      ...demo,
      documentosInvestigacao: (demo.documentosInvestigacao || []).filter((item) => item.id !== id),
    }, campanhaId);
    return;
  }

  const registro = typeof documento === "object" ? documento : null;
  const storagePath = registro?.storagePath || registro?.storage_path;
  const { error } = await supabase
    .from("documentos_investigacao")
    .delete()
    .eq("id", id)
    .eq("campanha_id", campanhaId);
  if (error) throw error;
  if (storagePath) {
    const { error: erroStorage } = await supabase.storage.from("evidencias").remove([storagePath]);
    if (erroStorage) console.warn("Documento removido da mesa, mas o arquivo nao pode ser apagado do Storage.", erroStorage);
  }
};

export const moverToken = async (tokenId, x, y, mapaChave = "mapa-principal") => {
  if (!supabaseConfigurado || String(tokenId).startsWith("demo")) {
    const campanhaId = listarCampanhasDemo().find((campanha) => (carregarDemo(campanha.id).tokens || []).some((token) => token.id === tokenId))?.id || "demo";
    const estado = carregarDemo(campanhaId);
    salvarDemo({ ...estado, tokens: (estado.tokens || TOKENS_DEMO).map((token) => token.id === tokenId ? { ...token, x, y, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y } } } : token) }, campanhaId);
    return;
  }
  const { data, error } = await supabase.rpc("mover_token_tabletop", {
    token_alvo: tokenId,
    nova_x: x,
    nova_y: y,
    mapa_chave: mapaChave,
  });
  if (error) {
    const { data: tokenAtual, error: erroConsulta } = await supabase
      .from("tokens_mapa")
      .select("*")
      .eq("id", tokenId)
      .single();
    if (erroConsulta) throw error;
    const { data: atualizado, error: erroAtualizacao } = await supabase
      .from("tokens_mapa")
      .update({
        x,
        y,
        posicoes: {
          ...(tokenAtual.posicoes || {}),
          [mapaChave]: { x, y },
        },
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", tokenId)
      .select()
      .maybeSingle();
    if (erroAtualizacao) throw erroAtualizacao;
    if (!atualizado) {
      throw new Error("O Supabase recusou a gravacao do token. Aplique a migracao 016 de permissoes.");
    }
    return atualizado;
  }
  const tokenAtualizado = Array.isArray(data) ? data[0] : data;
  if (!tokenAtualizado) throw new Error("O Supabase nao confirmou a nova posicao do token.");
  return tokenAtualizado;
};

const atualizarEstadoTokenMapa = async (tokenId, mapaChave, mudanca) => {
  const chaveEstado = chaveEstadoTokenMapa(mapaChave);

  if (!supabaseConfigurado || String(tokenId).startsWith("demo")) {
    const campanhaId = listarCampanhasDemo().find((campanha) =>
      (carregarDemo(campanha.id).tokens || []).some((token) => token.id === tokenId)
    )?.id || "demo";
    const estado = carregarDemo(campanhaId);
    let atualizado = null;
    const tokens = (estado.tokens || TOKENS_DEMO).map((token) => {
      if (token.id !== tokenId) return token;
      const estadoAtual = token.posicoes?.[chaveEstado] || {};
      atualizado = {
        ...token,
        posicoes: {
          ...(token.posicoes || {}),
          [chaveEstado]: { ...estadoAtual, ...mudanca },
        },
      };
      return atualizado;
    });
    salvarDemo({ ...estado, tokens }, campanhaId);
    return atualizado;
  }

  const { data: tokenAtual, error: erroConsulta } = await supabase
    .from("tokens_mapa")
    .select("*")
    .eq("id", tokenId)
    .single();
  if (erroConsulta) throw erroConsulta;

  const estadoAtual = tokenAtual.posicoes?.[chaveEstado] || {};
  const { data, error } = await supabase
    .from("tokens_mapa")
    .update({
      posicoes: {
        ...(tokenAtual.posicoes || {}),
        [chaveEstado]: { ...estadoAtual, ...mudanca },
      },
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", tokenId)
    .select()
    .single();
  if (error) throw error;
  return { ...data, ...mudanca };
};

export const definirVisibilidadeToken = (tokenId, oculto, mapaChave = "mapa-principal") =>
  atualizarEstadoTokenMapa(tokenId, mapaChave, { oculto: Boolean(oculto), removido: false });

export const configurarLanternaToken = (tokenId, lanterna, mapaChave = "mapa-principal") =>
  atualizarEstadoTokenMapa(tokenId, mapaChave, {
    lanterna: {
      ativa: Boolean(lanterna?.ativa),
      alcance: Math.max(4, Math.min(60, Number(lanterna?.alcance) || 18)),
      cor: String(lanterna?.cor || "#f4c76b"),
      direcao: Number(lanterna?.direcao) || 0,
      abertura: Math.max(20, Math.min(140, Number(lanterna?.abertura) || 70)),
    },
  });

export const definirRotacaoToken = (tokenId, rotacao, mapaChave = "mapa-principal") =>
  atualizarEstadoTokenMapa(tokenId, mapaChave, {
    rotacao: Number(rotacao) || 0,
  });

export const removerTokenDoMapa = (tokenId, mapaChave = "mapa-principal") =>
  atualizarEstadoTokenMapa(tokenId, mapaChave, { removido: true });

export const registrarRolagem = async (campanhaId, autorNome, rolagem) => {
  const registro = {
    id: `rolagem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    campanha_id: campanhaId,
    autor_nome: autorNome || "Jogador",
    expressao: rolagem.formula || rolagem.nome || rolagem.tipo || "Teste",
    resultado: Number(rolagem.total ?? rolagem.resultado ?? rolagem.maiorResultado) || 0,
    detalhes: rolagem,
    criado_em: new Date().toISOString(),
  };

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({ ...demo, rolagens: [registro, ...(demo.rolagens || [])].slice(0, 30) }, campanhaId);
    return registro;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { id, criado_em, ...dados } = registro;
  const { data, error } = await supabase.from("rolagens").insert({ ...dados, usuario_id: user?.id || null }).select().single();
  if (error) throw error;
  return data;
};

export const vincularFicha = async (campanhaId, fichaId, personagem) => {
  const nome = personagem?.nome || fichaId;
  const hashFicha = Array.from(String(fichaId)).reduce(
    (total, caractere) => ((total * 31) + caractere.charCodeAt(0)) >>> 0,
    7,
  );
  const posicaoToken = {
    x: 22 + (hashFicha % 5) * 14,
    y: 24 + (Math.floor(hashFicha / 5) % 4) * 17,
  };
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId);
    const membroExistente = demo.membros?.find((item) => item.ficha_id === fichaId);
    const tokenExistente = demo.tokens?.some((item) => item.ficha_id === fichaId);
    const membro = membroExistente || { id: `demo-m-${Date.now()}-${fichaId}`, ficha_id: fichaId, nome, papel: "jogador" };
    const token = { id: `demo-t-${Date.now()}-${fichaId}`, ficha_id: fichaId, nome, ...posicaoToken };
    salvarDemo({
      ...demo,
      membros: membroExistente ? demo.membros : [...(demo.membros || []), membro],
      tokens: tokenExistente ? demo.tokens : [...(demo.tokens || []), token],
    }, campanhaId);
    return membro;
  }

  const [consultaMembro, consultaToken] = await Promise.all([
    supabase.from("membros_campanha").select("*").eq("campanha_id", campanhaId).eq("ficha_id", fichaId).maybeSingle(),
    supabase.from("tokens_mapa").select("id").eq("campanha_id", campanhaId).eq("ficha_id", fichaId).maybeSingle(),
  ]);
  if (consultaMembro.error || consultaToken.error) throw consultaMembro.error || consultaToken.error;

  let membro = consultaMembro.data;
  if (!membro) {
    const resultadoMembro = await supabase.from("membros_campanha").insert({ campanha_id: campanhaId, ficha_id: fichaId, nome, papel: "jogador" }).select().single();
    if (resultadoMembro.error) throw resultadoMembro.error;
    membro = resultadoMembro.data;
  }
  if (!consultaToken.data) {
    const { error: tokenError } = await supabase.from("tokens_mapa").insert({ campanha_id: campanhaId, ficha_id: fichaId, nome, ...posicaoToken });
    if (tokenError) throw tokenError;
  }
  return membro;
};

export const posicionarFichaNoMapa = async (campanhaId, fichaId, personagem, x, y, mapaChave = "mapa-principal") => {
  await vincularFicha(campanhaId, fichaId, personagem);
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    const token = (demo.tokens || []).find((item) => item.ficha_id === fichaId);
    if (!token) throw new Error("Nao foi possivel criar o token desta ficha.");
    const chaveEstado = chaveEstadoTokenMapa(mapaChave);
    const atualizado = { ...token, x, y, oculto: false, removido: false, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y }, [chaveEstado]: { oculto: false, removido: false } } };
    salvarDemo({ ...demo, tokens: demo.tokens.map((item) => item.id === token.id ? atualizado : item) }, campanhaId);
    return atualizado;
  }
  const { data: token, error: erroToken } = await supabase.from("tokens_mapa").select("*").eq("campanha_id", campanhaId).eq("ficha_id", fichaId).maybeSingle();
  if (erroToken) throw erroToken;
  if (!token) throw new Error("Nao foi possivel criar o token desta ficha.");
  const chaveEstado = chaveEstadoTokenMapa(mapaChave);
  const { data, error } = await supabase.from("tokens_mapa").update({ x, y, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y }, [chaveEstado]: { oculto: false, removido: false } } }).eq("id", token.id).select().single();
  if (error) throw error;
  return { ...data, oculto: false, removido: false };
};

export const posicionarInimigoNoMapa = async (campanhaId, inimigo, x, y, mapaChave = "mapa-principal") => {
  const referencia = String(inimigo?.inimigo_ref || inimigo?.id || "inimigo");
  const fichaId = `inimigo:${referencia}`;
  const nome = inimigo?.nome || "Inimigo";
  const imagemUrl = inimigo?.fotoPerfil || inimigo?.imagem || inimigo?.imagem_url || "/OAbsoluto.webp";

  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    const existente = (demo.tokens || []).find((item) => item.ficha_id === fichaId);
    const token = existente
      ? { ...existente, nome, imagem_url: imagemUrl, x, y, oculto: false, removido: false, posicoes: { ...(existente.posicoes || {}), [mapaChave]: { x, y }, [chaveEstadoTokenMapa(mapaChave)]: { oculto: false, removido: false } } }
      : { id: `demo-token-inimigo-${Date.now()}-${referencia}`, ficha_id: fichaId, nome, imagem_url: imagemUrl, x, y, oculto: false, removido: false, posicoes: { [mapaChave]: { x, y }, [chaveEstadoTokenMapa(mapaChave)]: { oculto: false, removido: false } } };
    salvarDemo({
      ...demo,
      tokens: existente
        ? demo.tokens.map((item) => item.id === existente.id ? token : item)
        : [...(demo.tokens || []), token],
    }, campanhaId);
    return token;
  }

  const { data: existente, error: erroConsulta } = await supabase
    .from("tokens_mapa")
    .select("*")
    .eq("campanha_id", campanhaId)
    .eq("ficha_id", fichaId)
    .maybeSingle();
  if (erroConsulta) throw erroConsulta;

  if (existente) {
    const chaveEstado = chaveEstadoTokenMapa(mapaChave);
    const { data, error } = await supabase.from("tokens_mapa").update({ nome, imagem_url: imagemUrl, x, y, posicoes: { ...(existente.posicoes || {}), [mapaChave]: { x, y }, [chaveEstado]: { oculto: false, removido: false } } }).eq("id", existente.id).select().single();
    if (error) throw error;
    return { ...data, oculto: false, removido: false };
  }

  const chaveEstado = chaveEstadoTokenMapa(mapaChave);
  const { data, error } = await supabase.from("tokens_mapa").insert({ campanha_id: campanhaId, ficha_id: fichaId, nome, imagem_url: imagemUrl, x, y, posicoes: { [mapaChave]: { x, y }, [chaveEstado]: { oculto: false, removido: false } } }).select().single();
  if (error) throw error;
  return { ...data, oculto: false, removido: false };
};

export const desvincularFicha = async (campanhaId, fichaId) => {
  if (!supabaseConfigurado || campanhaId === "demo") {
    const demo = carregarDemo(campanhaId);
    salvarDemo({ ...demo, membros: (demo.membros || []).filter((item) => item.ficha_id !== fichaId), tokens: (demo.tokens || []).filter((item) => item.ficha_id !== fichaId) }, campanhaId);
    return;
  }
  const [{ error: membroError }, { error: tokenError }] = await Promise.all([
    supabase.from("membros_campanha").delete().eq("campanha_id", campanhaId).eq("ficha_id", fichaId),
    supabase.from("tokens_mapa").delete().eq("campanha_id", campanhaId).eq("ficha_id", fichaId),
  ]);
  if (membroError || tokenError) throw membroError || tokenError;
};

export const vincularInimigo = async (campanhaId, inimigo) => {
  const referencia = String(inimigo.id || inimigo.fichaId);
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    if ((demo.inimigos || []).some((item) => String(item.inimigo_ref || item.id) === referencia)) return;
    const registro = { ...inimigo, id: `inimigo-mesa-${Date.now()}`, inimigo_ref: referencia };
    salvarDemo({ ...demo, inimigos: [...(demo.inimigos || []), registro] }, campanhaId);
    return registro;
  }
  const { data, error } = await supabase.from("inimigos_campanha").insert({ campanha_id: campanhaId, inimigo_ref: referencia, nome: inimigo.nome || "Inimigo", dados: inimigo }).select().single();
  if (error) throw error;
  return { ...(data.dados || {}), ...data };
};

export const desvincularInimigo = async (campanhaId, inimigoId) => {
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    salvarDemo({ ...demo, inimigos: (demo.inimigos || []).filter((item) => item.id !== inimigoId) }, campanhaId);
    return;
  }
  const { error } = await supabase.from("inimigos_campanha").delete().eq("id", inimigoId).eq("campanha_id", campanhaId);
  if (error) throw error;
};

export const atualizarInimigoCampanha = async (campanhaId, inimigo) => {
  const { id, campanha_id, inimigo_ref, criado_em, dados, ...conteudo } = inimigo || {};
  const novosDados = {
    ...(dados || {}),
    ...conteudo,
    id: inimigo_ref || dados?.id || conteudo.fichaId,
  };
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const demo = carregarDemo(campanhaId);
    const atualizado = { ...inimigo, dados: novosDados };
    salvarDemo({
      ...demo,
      inimigos: (demo.inimigos || []).map((item) => item.id === id ? atualizado : item),
    }, campanhaId);
    return atualizado;
  }
  const { data, error } = await supabase
    .from("inimigos_campanha")
    .update({ nome: conteudo.nome || "Inimigo", dados: novosDados })
    .eq("id", id)
    .eq("campanha_id", campanhaId)
    .select()
    .single();
  if (error) throw error;
  return { ...(data.dados || {}), ...data };
};

export const ouvirCampanha = (campanhaId, aoMudar) => {
  if (!supabaseConfigurado || campanhaId === "demo" || String(campanhaId).startsWith("demo-")) {
    const chave = chaveDemo(campanhaId);
    const aoAlterarStorage = (event) => { if (event.key === chave) aoMudar(event); };
    const aoAlterarLocal = (event) => { if (event.detail?.campanhaId === campanhaId) aoMudar(event); };
    window.addEventListener("storage", aoAlterarStorage);
    window.addEventListener("darkness:campanha-demo", aoAlterarLocal);
    return () => {
      window.removeEventListener("storage", aoAlterarStorage);
      window.removeEventListener("darkness:campanha-demo", aoAlterarLocal);
    };
  }
  let intervaloFallback = null;
  let consultaTokensEmAndamento = false;
  const sincronizarTokens = async () => {
    if (consultaTokensEmAndamento || document.visibilityState !== "visible") return;
    consultaTokensEmAndamento = true;
    try {
      const { data, error } = await supabase
        .from("tokens_mapa")
        .select("*")
        .eq("campanha_id", campanhaId);
      if (error) throw error;
      aoMudar({ tipo: "tokens_sincronizados", tokens: consolidarTokens(data || []) });
    } catch (error) {
      console.warn("Nao foi possivel sincronizar os tokens da mesa.", error);
    } finally {
      consultaTokensEmAndamento = false;
    }
  };
  const iniciarFallback = () => {
    if (intervaloFallback) return;
    sincronizarTokens();
    intervaloFallback = window.setInterval(sincronizarTokens, 3000);
  };
  const pararFallback = () => {
    if (!intervaloFallback) return;
    window.clearInterval(intervaloFallback);
    intervaloFallback = null;
  };
  const canal = supabase
    .channel(`mesa:${campanhaId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "campanhas", filter: `id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "tokens_mapa", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "cenas", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "membros_campanha", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "inimigos_campanha", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "iniciativas_campanha", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "*", schema: "public", table: "documentos_investigacao", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "rolagens", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .subscribe();
  iniciarFallback();
  return () => {
    pararFallback();
    supabase.removeChannel(canal);
  };
};
