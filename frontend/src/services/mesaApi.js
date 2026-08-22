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
    return { cenas: CENAS_DEMO_PADRAO, cenaAtivaId: CENAS_DEMO_PADRAO[0].id, modo: "cena", membros: MEMBROS_DEMO, tokens: TOKENS_DEMO };
  }
  return { cenas: [], cenaAtivaId: null, modo: "cena", membros: [], tokens: [] };
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

const normalizarMidiasCena = (cena) => {
  const imagens = Array.isArray(cena.imagens_cena || cena.imagensCena) ? (cena.imagens_cena || cena.imagensCena) : [];
  const mapas = Array.isArray(cena.mapas_batalha || cena.mapasBatalha) ? (cena.mapas_batalha || cena.mapasBatalha) : [];
  const imagemAntiga = cena.imagem_url || cena.imagemUrl;
  const mapaAntigo = cena.mapa_url || cena.mapaUrl;
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
const aplicarPosicaoDoMapa = (tokens, campanha) => {
  const chave = chavePosicaoMapa(campanha.cena_ativa_id, campanha.midia_ativa_id);
  return tokens.map((token) => ({ ...token, ...(token.posicoes?.[chave] || {}) }));
};

const normalizarCampanha = (campanha, cenas = [], membros = [], tokens = [], rolagens = [], inimigos = []) => ({
  ...campanha,
  cenaAtiva: (cenas.map(normalizarMidiasCena).find((cena) => cena.id === campanha.cena_ativa_id) || cenas.map(normalizarMidiasCena)[0] || null),
  midiaAtivaId: campanha.midia_ativa_id || null,
  modo: campanha.modo || "cena",
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
    return { ...CAMPANHA_DEMO, ...campanha, modo: demo.modo, midiaAtivaId: demo.midiaAtivaId || null, cenas, membros: demo.membros || MEMBROS_DEMO, tokens, rolagens: demo.rolagens || CAMPANHA_DEMO.rolagens, inimigos: demo.inimigos || [], musicas: demo.musicas || [], musicaEstado: demo.musicaEstado || null, cenaAtiva: cenas.find((cena) => cena.id === demo.cenaAtivaId) || cenas[0] };
  }

  const { data: campanha, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("codigo", codigoNormalizado)
    .maybeSingle();
  if (error) throw error;
  if (!campanha) return null;

  const [cenas, membros, tokens, rolagens, inimigos] = await Promise.all([
    supabase.from("cenas").select("*").eq("campanha_id", campanha.id).order("ordem"),
    supabase.from("membros_campanha").select("*").eq("campanha_id", campanha.id),
    supabase.from("tokens_mapa").select("*").eq("campanha_id", campanha.id),
    supabase.from("rolagens").select("*").eq("campanha_id", campanha.id).order("criado_em", { ascending: false }).limit(30),
    supabase.from("inimigos_campanha").select("*").eq("campanha_id", campanha.id).order("criado_em"),
  ]);
  [cenas, membros, tokens, rolagens, inimigos].forEach(({ error: erro }) => {
    if (erro) throw erro;
  });

  return normalizarCampanha(campanha, cenas.data, membros.data, tokens.data, rolagens.data, inimigos.data);
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
    salvarDemo({ cenas: [], cenaAtivaId: null, modo: "cena", membros: [], tokens: [] }, campanha.id);
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
  const payload = {
    ...(cena.id ? { id: cena.id } : {}), campanha_id: campanhaId, nome: cena.nome,
    descricao: cena.descricao || "", imagem_url: cena.imagemUrl || cena.imagem_url || null,
    mapa_url: cena.mapaUrl || cena.mapa_url || null, largura_grade: Number(cena.larguraGrade || cena.largura_grade || 12),
    altura_grade: Number(cena.alturaGrade || cena.altura_grade || 8), ordem: Number(cena.ordem || 0),
    pasta: String(cena.pasta || "Sem pasta").trim() || "Sem pasta",
    imagens_cena: normalizada.imagensCena,
    mapas_batalha: normalizada.mapasBatalha,
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
  const caminho = `${campanhaId}/${tipo}-${Date.now()}.${extensao}`;
  const { error } = await supabase.storage.from("mapas").upload(caminho, arquivo, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("mapas").getPublicUrl(caminho).data.publicUrl;
};

export const moverToken = async (tokenId, x, y, mapaChave = "mapa-principal") => {
  if (!supabaseConfigurado || String(tokenId).startsWith("demo")) {
    const campanhaId = listarCampanhasDemo().find((campanha) => (carregarDemo(campanha.id).tokens || []).some((token) => token.id === tokenId))?.id || "demo";
    const estado = carregarDemo(campanhaId);
    salvarDemo({ ...estado, tokens: (estado.tokens || TOKENS_DEMO).map((token) => token.id === tokenId ? { ...token, x, y, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y } } } : token) }, campanhaId);
    return;
  }
  const { data: atual, error: erroConsulta } = await supabase.from("tokens_mapa").select("posicoes").eq("id", tokenId).single();
  if (erroConsulta) throw erroConsulta;
  const { error } = await supabase.from("tokens_mapa").update({ x, y, posicoes: { ...(atual?.posicoes || {}), [mapaChave]: { x, y } } }).eq("id", tokenId);
  if (error) throw error;
};

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
    const atualizado = { ...token, x, y, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y } } };
    salvarDemo({ ...demo, tokens: demo.tokens.map((item) => item.id === token.id ? atualizado : item) }, campanhaId);
    return atualizado;
  }
  const { data: token, error: erroToken } = await supabase.from("tokens_mapa").select("*").eq("campanha_id", campanhaId).eq("ficha_id", fichaId).maybeSingle();
  if (erroToken) throw erroToken;
  if (!token) throw new Error("Nao foi possivel criar o token desta ficha.");
  const { data, error } = await supabase.from("tokens_mapa").update({ x, y, posicoes: { ...(token.posicoes || {}), [mapaChave]: { x, y } } }).eq("id", token.id).select().single();
  if (error) throw error;
  return data;
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
      ? { ...existente, nome, imagem_url: imagemUrl, x, y, posicoes: { ...(existente.posicoes || {}), [mapaChave]: { x, y } } }
      : { id: `demo-token-inimigo-${Date.now()}-${referencia}`, ficha_id: fichaId, nome, imagem_url: imagemUrl, x, y, posicoes: { [mapaChave]: { x, y } } };
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
    const { data, error } = await supabase.from("tokens_mapa").update({ nome, imagem_url: imagemUrl, x, y, posicoes: { ...(existente.posicoes || {}), [mapaChave]: { x, y } } }).eq("id", existente.id).select().single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("tokens_mapa").insert({ campanha_id: campanhaId, ficha_id: fichaId, nome, imagem_url: imagemUrl, x, y, posicoes: { [mapaChave]: { x, y } } }).select().single();
  if (error) throw error;
  return data;
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
      aoMudar({ tipo: "tokens_sincronizados", tokens: data || [] });
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
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "rolagens", filter: `campanha_id=eq.${campanhaId}` }, aoMudar)
    .subscribe();
  iniciarFallback();
  return () => {
    pararFallback();
    supabase.removeChannel(canal);
  };
};
