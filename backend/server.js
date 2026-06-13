const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const BUILD_DIR = path.join(__dirname, "..", "build");
const DEFAULT_FICHA_ID = "principal";
const PARTY_PREFIX = "party-";
const SHOP_CATALOG_FILE = path.join(DATA_DIR, "loja-catalogo.json");
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_TABLE = (process.env.SUPABASE_TABLE || "personagens").trim();
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const IS_VERCEL = Boolean(process.env.VERCEL);

const assertStorageConfigured = () => {
  if (IS_VERCEL && !USE_SUPABASE) {
    throw new Error(
      "Supabase nao configurado na Vercel. Adicione SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_TABLE=personagens nas Environment Variables.",
    );
  }
};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const defaultCatalogoLoja = [
  {
    id: "pistola-sable",
    nome: "Pistola Sable 9mm",
    categoria: "armas",
    preco: 180,
    detalhe: "Leve, discreta e confiavel em corredores apertados.",
    entrega: "1 pente extra",
  },
  {
    id: "carabina-helena",
    nome: "Carabina Helena-7",
    categoria: "armas",
    preco: 460,
    detalhe: "Precisao estavel para media distancia.",
    entrega: "2 carregadores",
  },
  {
    id: "lamina-fosca",
    nome: "Lamina Fosca",
    categoria: "armas",
    preco: 135,
    detalhe: "Faca tatica de corte silencioso.",
    entrega: "Bainha magnetica",
  },
  {
    id: "colete-kevlar",
    nome: "Colete Kevlar II",
    categoria: "defesas",
    preco: 320,
    detalhe: "Protecao corporal sem travar movimento.",
    entrega: "+ resistencia contra perfuracao",
  },
  {
    id: "placa-ceramica",
    nome: "Placa Ceramica",
    categoria: "defesas",
    preco: 260,
    detalhe: "Reforco para impacto concentrado.",
    entrega: "Instalacao incluida",
  },
  {
    id: "mascara-filtro",
    nome: "Mascara de Filtro",
    categoria: "defesas",
    preco: 150,
    detalhe: "Filtro lacrado contra poeira, gas e fuligem ritual.",
    entrega: "2 filtros",
  },
  {
    id: "kit-trauma",
    nome: "Kit de Trauma",
    categoria: "itens",
    preco: 95,
    detalhe: "Curativos, torniquete, analgesicos e selante.",
    entrega: "3 usos",
  },
  {
    id: "municao-prata",
    nome: "Municao de Prata",
    categoria: "itens",
    preco: 120,
    detalhe: "Cartuchos preparados para alvos anormais.",
    entrega: "Caixa com 12",
  },
  {
    id: "rastreador-sinal",
    nome: "Rastreador de Sinal",
    categoria: "itens",
    preco: 210,
    detalhe: "Pulso curto para localizar aparelhos ativos.",
    entrega: "Bateria 6h",
  },
  {
    id: "rito-limiar",
    nome: "Rito Absoluto: Limiar",
    categoria: "ritos",
    preco: 520,
    detalhe: "Marca uma passagem onde o real fica fino.",
    entrega: "Custo 6 PE",
  },
  {
    id: "rito-cicatriz",
    nome: "Rito Absoluto: Cicatriz",
    categoria: "ritos",
    preco: 640,
    detalhe: "Converte dor recebida em memoria armada.",
    entrega: "Custo 8 PE",
  },
  {
    id: "rito-noite-fechada",
    nome: "Rito Absoluto: Noite Fechada",
    categoria: "ritos",
    preco: 780,
    detalhe: "Apaga rastros, luzes pequenas e certezas.",
    entrega: "Custo 10 PE",
  },
];

const sendJson = (res, statusCode, payload) => {
  const body = statusCode === 204 ? "" : JSON.stringify(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...corsHeaders,
  });
  res.end(body);
};

const sendFile = async (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const body = await fs.readFile(filePath);

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Content-Length": body.length,
  });
  res.end(body);
};

const sanitizeFichaId = (id) => {
  const sanitized = String(id || DEFAULT_FICHA_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || DEFAULT_FICHA_ID;
};

const getDataFile = (id) => path.join(DATA_DIR, `${sanitizeFichaId(id)}.json`);

const gerarCodigoParty = () =>
  `P${Math.floor(100000 + Math.random() * 900000)}`;

const normalizarCodigoParty = (code) =>
  String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 24);

const getPartyId = (code) => `${PARTY_PREFIX}${sanitizeFichaId(code)}`;

const resumirPersonagemParty = (fichaId, personagem = {}) => ({
  fichaId: sanitizeFichaId(fichaId),
  nome: String(personagem.nome || "Sem nome").trim() || "Sem nome",
  pronome: personagem.pronome || "",
  classe: personagem.classe || "",
  especialidade: personagem.especialidade || personagem.arquetipo || "",
  nivel: Number(personagem.nivel) || 1,
  fotoPerfil: personagem.fotoPerfil || personagem.imagem || "",
  sanidade: personagem.sanidade || { atual: 0, max: 0 },
  esperanca: personagem.esperanca || { atual: 0, max: 0 },
  integridade: personagem.integridade || personagem.vida || null,
  membros: personagem.membros || {},
  atributos: personagem.atributos || {},
  updatedAt: new Date().toISOString(),
});

const normalizeShopItem = (item, index = 0) => {
  const nome = String(item?.nome || "").trim();
  const id = sanitizeFichaId(item?.id || nome || `item-${Date.now()}-${index}`);
  const categoria = ["armas", "defesas", "itens", "ritos"].includes(
    item?.categoria,
  )
    ? item.categoria
    : "itens";

  return {
    id,
    nome: nome || "Item sem nome",
    categoria,
    preco: Math.max(0, Number(item?.preco) || 0),
    detalhe: String(item?.detalhe || "").trim(),
    entrega: String(item?.entrega || "").trim(),
  };
};

const getSupabaseRestUrl = (pathAndQuery = "") => {
  const baseUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  return `${baseUrl}/rest/v1/${SUPABASE_TABLE}${pathAndQuery}`;
};

const requestSupabase = async (pathAndQuery, options = {}) => {
  const response = await fetch(getSupabaseRestUrl(pathAndQuery), {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Erro Supabase ${response.status}: ${details}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const readJsonBody = (req) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    try {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
};

const readPersonagem = async (id) => {
  if (USE_SUPABASE) {
    const fichaId = sanitizeFichaId(id);
    const rows = await requestSupabase(
      `?id=eq.${encodeURIComponent(fichaId)}&select=personagem&limit=1`,
    );

    return rows[0]?.personagem || null;
  }

  assertStorageConfigured();

  try {
    const dataFile = getDataFile(id);
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

const writePersonagem = async (id, personagem) => {
  if (USE_SUPABASE) {
    const fichaId = sanitizeFichaId(id);
    const rows = await requestSupabase("?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: fichaId,
        personagem,
        updated_at: new Date().toISOString(),
      }),
    });

    return rows[0]?.personagem || personagem;
  }

  assertStorageConfigured();

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(getDataFile(id), `${JSON.stringify(personagem, null, 2)}\n`);
  return personagem;
};

const listPersonagens = async () => {
  if (USE_SUPABASE) {
    const rows = await requestSupabase("?select=id,personagem,updated_at&order=id.asc");
    return rows
      .filter(
        (row) =>
          !String(row.id || "").startsWith(PARTY_PREFIX) &&
          row.personagem?.tipo !== "party",
      )
      .map((row) => ({
        fichaId: row.id,
        personagem: row.personagem,
        updatedAt: row.updated_at || null,
      }));
  }

  assertStorageConfigured();

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const files = await fs.readdir(DATA_DIR);
    const personagens = await Promise.all(
      files
        .filter(
          (file) =>
            file.endsWith(".json") &&
            file !== "loja-catalogo.json" &&
            !file.startsWith(PARTY_PREFIX),
        )
        .map(async (file) => {
          const fichaId = path.basename(file, ".json");
          const filePath = path.join(DATA_DIR, file);
          const [raw, stats] = await Promise.all([
            fs.readFile(filePath, "utf8"),
            fs.stat(filePath),
          ]);

          return {
            fichaId,
            personagem: JSON.parse(raw),
            updatedAt: stats.mtime.toISOString(),
          };
        }),
    );

    return personagens.sort((a, b) => a.fichaId.localeCompare(b.fichaId));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const deletePersonagem = async (id) => {
  if (USE_SUPABASE) {
    const fichaId = sanitizeFichaId(id);
    await requestSupabase(`?id=eq.${encodeURIComponent(fichaId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    return true;
  }

  assertStorageConfigured();

  try {
    await fs.unlink(getDataFile(id));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const readParty = async (code) => {
  const partyCode = normalizarCodigoParty(code);
  if (!partyCode) return null;

  const party = await readPersonagem(getPartyId(partyCode));
  return party?.tipo === "party" ? party : null;
};

const writeParty = async (party) => {
  const partyCode = normalizarCodigoParty(party?.code);

  if (!partyCode) {
    throw new Error("Codigo de party invalido");
  }

  const atualizado = {
    ...party,
    tipo: "party",
    code: partyCode,
    updatedAt: new Date().toISOString(),
  };

  await writePersonagem(getPartyId(partyCode), atualizado);
  return atualizado;
};

const vincularPersonagemAParty = async (fichaId, personagem, partyCode) => {
  const personagemId = sanitizeFichaId(fichaId);
  const existente = await readPersonagem(personagemId);
  const base =
    existente && existente.tipo !== "party" && typeof existente === "object"
      ? existente
      : {};

  const atualizado = {
    ...base,
    ...(personagem && typeof personagem === "object" ? personagem : {}),
    partyCode: normalizarCodigoParty(partyCode),
  };

  await writePersonagem(personagemId, atualizado);
  return atualizado;
};

const criarParty = async ({ fichaId, personagem }) => {
  let code = gerarCodigoParty();
  let tentativas = 0;

  while ((await readParty(code)) && tentativas < 12) {
    code = gerarCodigoParty();
    tentativas += 1;
  }

  const party = {
    tipo: "party",
    code,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: {},
    notes: [],
    rolls: [],
    itemTransfers: [],
  };

  party.players[sanitizeFichaId(fichaId)] = resumirPersonagemParty(
    fichaId,
    personagem,
  );

  const partyAtualizada = await writeParty(party);
  await vincularPersonagemAParty(fichaId, personagem, code);
  return partyAtualizada;
};

const entrarParty = async ({ code, fichaId, personagem }) => {
  const party = await readParty(code);

  if (!party) return null;

  const personagemAtualizado = await vincularPersonagemAParty(
    fichaId,
    personagem,
    party.code,
  );

  party.players = {
    ...(party.players || {}),
    [sanitizeFichaId(fichaId)]: resumirPersonagemParty(
      fichaId,
      personagemAtualizado,
    ),
  };

  return writeParty(party);
};

const atualizarStatusParty = async ({ code, fichaId, personagem }) => {
  const party = await readParty(code);

  if (!party) return null;

  party.players = {
    ...(party.players || {}),
    [sanitizeFichaId(fichaId)]: resumirPersonagemParty(fichaId, personagem),
  };

  return writeParty(party);
};

const adicionarNotaParty = async ({ code, fichaId, texto }) => {
  const party = await readParty(code);

  if (!party) return null;

  const autor = party.players?.[sanitizeFichaId(fichaId)]?.nome || fichaId;

  party.notes = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fichaId: sanitizeFichaId(fichaId),
      autor,
      texto: String(texto || "").trim().slice(0, 1200),
      createdAt: new Date().toISOString(),
    },
    ...(party.notes || []),
  ].slice(0, 80);

  return writeParty(party);
};

const adicionarRolagemParty = async ({ code, fichaId, roll }) => {
  const party = await readParty(code);

  if (!party) return null;

  const autor = party.players?.[sanitizeFichaId(fichaId)]?.nome || fichaId;

  party.rolls = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fichaId: sanitizeFichaId(fichaId),
      autor,
      formula: String(roll?.formula || "").trim().slice(0, 80),
      dados: Array.isArray(roll?.dados) ? roll.dados.slice(0, 40) : [],
      bonus: Number(roll?.bonus) || 0,
      total: Number(roll?.total) || 0,
      createdAt: new Date().toISOString(),
    },
    ...(party.rolls || []),
  ].slice(0, 80);

  return writeParty(party);
};

const transferirItemParty = async ({ code, fromFichaId, toFichaId, itemIndex }) => {
  const party = await readParty(code);

  if (!party) return null;

  const origemId = sanitizeFichaId(fromFichaId);
  const destinoId = sanitizeFichaId(toFichaId);
  const origem = await readPersonagem(origemId);
  const destino = await readPersonagem(destinoId);

  if (!origem || !destino) {
    throw new Error("Ficha de origem ou destino nao encontrada");
  }

  const inventarioOrigem = Array.isArray(origem.inventario)
    ? [...origem.inventario]
    : [];
  const index = Math.max(0, Number(itemIndex) || 0);
  const [item] = inventarioOrigem.splice(index, 1);

  if (!item) {
    throw new Error("Item nao encontrado no inventario");
  }

  const origemAtualizada = {
    ...origem,
    inventario: inventarioOrigem,
  };
  const destinoAtualizado = {
    ...destino,
    inventario: [...(destino.inventario || []), item],
  };

  await writePersonagem(origemId, origemAtualizada);
  await writePersonagem(destinoId, destinoAtualizado);

  party.players = {
    ...(party.players || {}),
    [origemId]: resumirPersonagemParty(origemId, origemAtualizada),
    [destinoId]: resumirPersonagemParty(destinoId, destinoAtualizado),
  };

  party.itemTransfers = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fromFichaId: origemId,
      toFichaId: destinoId,
      from: party.players?.[origemId]?.nome || origemId,
      to: party.players?.[destinoId]?.nome || destinoId,
      item,
      createdAt: new Date().toISOString(),
    },
    ...(party.itemTransfers || []),
  ].slice(0, 80);

  return writeParty(party);
};

const readShopCatalog = async () => {
  assertStorageConfigured();

  try {
    const raw = await fs.readFile(SHOP_CATALOG_FILE, "utf8");
    const catalogo = JSON.parse(raw);
    return Array.isArray(catalogo)
      ? catalogo.map((item, index) => normalizeShopItem(item, index))
      : defaultCatalogoLoja;
  } catch (error) {
    if (error.code === "ENOENT") {
      return defaultCatalogoLoja;
    }

    throw error;
  }
};

const writeShopCatalog = async (catalogo) => {
  if (!Array.isArray(catalogo)) {
    throw new Error("Catalogo invalido");
  }

  assertStorageConfigured();

  const normalized = catalogo.map((item, index) => normalizeShopItem(item, index));
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SHOP_CATALOG_FILE, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
};

const createUniqueFichaId = async (nome) => {
  const baseId = sanitizeFichaId(nome);
  let fichaId = baseId;
  let counter = 2;

  while (await readPersonagem(fichaId)) {
    fichaId = `${baseId}-${counter}`;
    counter += 1;
  }

  return fichaId;
};

const handleRequest = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    if (url.pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, {
        ok: true,
        storage: USE_SUPABASE ? "supabase" : "json",
        supabaseConfigured: USE_SUPABASE,
        table: USE_SUPABASE ? SUPABASE_TABLE : null,
      });
    }

    if (url.pathname === "/api/loja/catalogo" && req.method === "GET") {
      const catalogo = await readShopCatalog();
      return sendJson(res, 200, { catalogo });
    }

    if (url.pathname === "/api/loja/catalogo" && req.method === "PUT") {
      const body = await readJsonBody(req);
      const catalogo = await writeShopCatalog(body.catalogo);
      return sendJson(res, 200, { catalogo });
    }

    if (url.pathname === "/api/personagens" && req.method === "GET") {
      const personagens = await listPersonagens();
      return sendJson(res, 200, { personagens });
    }

    if (url.pathname === "/api/personagens" && req.method === "POST") {
      const personagem = await readJsonBody(req);

      if (
        !personagem ||
        typeof personagem !== "object" ||
        Array.isArray(personagem) ||
        !String(personagem.nome || "").trim()
      ) {
        return sendJson(res, 400, { error: "Nome do personagem e obrigatorio" });
      }

      const fichaId = await createUniqueFichaId(personagem.nome);
      const saved = await writePersonagem(fichaId, personagem);
      return sendJson(res, 201, { fichaId, personagem: saved });
    }

    if (url.pathname === "/api/parties" && req.method === "GET") {
      const code = url.searchParams.get("code");

      if (code) {
        const party = await readParty(code);
        return sendJson(res, party ? 200 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      return sendJson(res, 200, {
        ok: true,
        endpoint: "parties",
        message: "Use POST /api/parties para criar uma party.",
      });
    }

    if (url.pathname === "/api/parties" && req.method === "POST") {
      const body = await readJsonBody(req);
      const action = String(body?.action || "create").trim().toLowerCase();

      if (action === "join") {
        const party = await entrarParty(body);
        return sendJson(res, party ? 200 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      if (action === "status") {
        const party = await atualizarStatusParty(body);
        return sendJson(res, party ? 200 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      if (action === "note") {
        const party = await adicionarNotaParty(body);
        return sendJson(res, party ? 201 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      if (action === "roll") {
        const party = await adicionarRolagemParty(body);
        return sendJson(res, party ? 201 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      if (action === "item") {
        const party = await transferirItemParty(body);
        return sendJson(res, party ? 201 : 404, {
          party,
          ...(party ? {} : { error: "Party nao encontrada" }),
        });
      }

      if (!body?.fichaId || !body?.personagem) {
        return sendJson(res, 400, { error: "Ficha e personagem sao obrigatorios" });
      }

      const party = await criarParty(body);
      return sendJson(res, 201, { party });
    }

    const partyMatch = url.pathname.match(/^\/api\/parties\/([^/]+)$/);
    const partyJoinMatch = url.pathname.match(/^\/api\/parties\/([^/]+)\/join$/);
    const partyStatusMatch = url.pathname.match(
      /^\/api\/parties\/([^/]+)\/players\/([^/]+)$/,
    );
    const partyNotesMatch = url.pathname.match(/^\/api\/parties\/([^/]+)\/notes$/);
    const partyRollsMatch = url.pathname.match(/^\/api\/parties\/([^/]+)\/rolls$/);
    const partyItemsMatch = url.pathname.match(/^\/api\/parties\/([^/]+)\/items$/);

    if (partyMatch && req.method === "GET") {
      const party = await readParty(decodeURIComponent(partyMatch[1]));
      return sendJson(res, party ? 200 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    if (partyJoinMatch && req.method === "POST") {
      const body = await readJsonBody(req);
      const party = await entrarParty({
        code: decodeURIComponent(partyJoinMatch[1]),
        ...body,
      });

      return sendJson(res, party ? 200 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    if (partyStatusMatch && req.method === "PUT") {
      const body = await readJsonBody(req);
      const party = await atualizarStatusParty({
        code: decodeURIComponent(partyStatusMatch[1]),
        fichaId: decodeURIComponent(partyStatusMatch[2]),
        personagem: body.personagem,
      });

      return sendJson(res, party ? 200 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    if (partyNotesMatch && req.method === "POST") {
      const body = await readJsonBody(req);
      const party = await adicionarNotaParty({
        code: decodeURIComponent(partyNotesMatch[1]),
        ...body,
      });

      return sendJson(res, party ? 201 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    if (partyRollsMatch && req.method === "POST") {
      const body = await readJsonBody(req);
      const party = await adicionarRolagemParty({
        code: decodeURIComponent(partyRollsMatch[1]),
        ...body,
      });

      return sendJson(res, party ? 201 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    if (partyItemsMatch && req.method === "POST") {
      const body = await readJsonBody(req);
      const party = await transferirItemParty({
        code: decodeURIComponent(partyItemsMatch[1]),
        ...body,
      });

      return sendJson(res, party ? 201 : 404, {
        party,
        ...(party ? {} : { error: "Party nao encontrada" }),
      });
    }

    const legacyPersonagemRoute = url.pathname === "/api/personagem";
    const personagemMatch = url.pathname.match(/^\/api\/personagens\/([^/]+)$/);
    const fichaId = personagemMatch
      ? sanitizeFichaId(decodeURIComponent(personagemMatch[1]))
      : DEFAULT_FICHA_ID;

    if ((legacyPersonagemRoute || personagemMatch) && req.method === "GET") {
      const personagem = await readPersonagem(fichaId);
      return sendJson(res, 200, { fichaId, personagem });
    }

    if (
      (legacyPersonagemRoute || personagemMatch) &&
      (req.method === "POST" || req.method === "PUT")
    ) {
      const personagem = await readJsonBody(req);

      if (
        !personagem ||
        typeof personagem !== "object" ||
        Array.isArray(personagem)
      ) {
        return sendJson(res, 400, { error: "Personagem invalido" });
      }

      if (personagemMatch && !String(personagem.nome || "").trim()) {
        return sendJson(res, 400, {
          error: "Nao e permitido sobrescrever uma ficha com personagem vazio",
        });
      }

      const saved = await writePersonagem(fichaId, personagem);
      return sendJson(res, 200, { fichaId, personagem: saved });
    }

    if (personagemMatch && req.method === "DELETE") {
      const deleted = await deletePersonagem(fichaId);
      return sendJson(res, deleted ? 200 : 404, {
        fichaId,
        deleted,
        ...(deleted ? {} : { error: "Ficha nao encontrada" }),
      });
    }

    if (!url.pathname.startsWith("/api/") && req.method === "GET") {
      const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = path.normalize(path.join(BUILD_DIR, requestedPath));
      const isInsideBuild = filePath.startsWith(BUILD_DIR);

      try {
        if (isInsideBuild) {
          return await sendFile(res, filePath);
        }
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      return await sendFile(res, path.join(BUILD_DIR, "index.html"));
    }

    return sendJson(res, 404, { error: "Rota nao encontrada" });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
};

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `A porta ${PORT} ja esta em uso. Feche o outro backend ou use PORT=4001 npm run backend.`,
      );
      process.exit(1);
    }

    console.error("Nao foi possivel iniciar o backend:", error);
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    console.log(`Backend da ficha rodando em http://${HOST}:${PORT}`);
    console.log(`Armazenamento: ${USE_SUPABASE ? "Supabase" : "JSON local"}`);
    console.log("Deixe este terminal aberto enquanto estiver usando o site.");
  });
}

module.exports = {
  handleRequest,
};
