const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const BUILD_DIR = path.join(__dirname, "..", "frontend", "build");
const SERVE_FRONTEND = process.env.SERVE_FRONTEND !== "false";
const DEFAULT_FICHA_ID = "principal";
const SKILL_TREES_RECORD_ID = "__arvores_habilidades__";
const SHOP_CATALOG_FILE = path.join(DATA_DIR, "loja-catalogo.json");
const SKILL_TREES_FILE = path.join(DATA_DIR, "arvores-habilidades.json");
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_TABLE = (process.env.SUPABASE_TABLE || "personagens").trim();
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);

const cache = {
  personagens: new Map(),
  personagensList: null,
  skillTrees: null,
};

const isCacheFresh = (entry) =>
  Boolean(entry) && Date.now() - entry.cachedAt < CACHE_TTL_MS;

const setPersonagemCache = (fichaId, personagem, updatedAt = null) => {
  cache.personagens.set(sanitizeFichaId(fichaId), {
    personagem,
    updatedAt,
    cachedAt: Date.now(),
  });
};

const clearPersonagensListCache = () => {
  cache.personagensList = null;
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

const getCorsHeaders = (req) => {
  const configuredOrigins = String(process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin =
    configuredOrigins.length === 0 || configuredOrigins.includes("*");
  const allowedOrigin = allowAnyOrigin
    ? "*"
    : configuredOrigins.includes(requestOrigin)
      ? requestOrigin
      : configuredOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
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
    ...(res.corsHeaders || {}),
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
    const cached = cache.personagens.get(fichaId);

    if (isCacheFresh(cached)) {
      return cached.personagem;
    }

    const rows = await requestSupabase(
      `?id=eq.${encodeURIComponent(fichaId)}&select=personagem,updated_at&limit=1`,
    );
    const personagem = rows[0]?.personagem || null;

    setPersonagemCache(fichaId, personagem, rows[0]?.updated_at || null);

    return personagem;
  }

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
    const updatedAt = new Date().toISOString();
    const rows = await requestSupabase("?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: fichaId,
        personagem,
        updated_at: updatedAt,
      }),
    });
    const saved = rows[0]?.personagem || personagem;

    setPersonagemCache(fichaId, saved, rows[0]?.updated_at || updatedAt);
    clearPersonagensListCache();

    return saved;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(getDataFile(id), `${JSON.stringify(personagem, null, 2)}\n`);
  return personagem;
};

const listPersonagens = async () => {
  if (USE_SUPABASE) {
    if (isCacheFresh(cache.personagensList)) {
      return cache.personagensList.personagens;
    }

    const rows = await requestSupabase("?select=id,personagem,updated_at&order=id.asc");
    const personagens = rows
      .filter((row) => row.id !== SKILL_TREES_RECORD_ID)
      .map((row) => ({
        fichaId: row.id,
        personagem: row.personagem,
        updatedAt: row.updated_at || null,
      }));

    personagens.forEach(({ fichaId, personagem, updatedAt }) => {
      setPersonagemCache(fichaId, personagem, updatedAt);
    });
    cache.personagensList = {
      personagens,
      cachedAt: Date.now(),
    };

    return personagens;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const files = await fs.readdir(DATA_DIR);
    const personagens = await Promise.all(
      files
        .filter(
          (file) =>
            file.endsWith(".json") &&
            file !== "loja-catalogo.json" &&
            file !== "arvores-habilidades.json",
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
    cache.personagens.delete(fichaId);
    clearPersonagensListCache();
    return true;
  }

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

const readShopCatalog = async () => {
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

  const normalized = catalogo.map((item, index) => normalizeShopItem(item, index));
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SHOP_CATALOG_FILE, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
};

const normalizeSkillTrees = (arvores) => {
  if (!arvores || typeof arvores !== "object" || Array.isArray(arvores)) {
    throw new Error("Arvores de habilidades invalidas");
  }

  return arvores;
};

const readSkillTrees = async () => {
  if (USE_SUPABASE) {
    if (isCacheFresh(cache.skillTrees)) {
      return cache.skillTrees.arvores;
    }

    const rows = await requestSupabase(
      `?id=eq.${encodeURIComponent(SKILL_TREES_RECORD_ID)}&select=personagem&limit=1`,
    );

    const arvores = normalizeSkillTrees(rows[0]?.personagem?.arvores || {});
    cache.skillTrees = {
      arvores,
      cachedAt: Date.now(),
    };

    return arvores;
  }

  try {
    const raw = await fs.readFile(SKILL_TREES_FILE, "utf8");
    return normalizeSkillTrees(JSON.parse(raw));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
};

const writeSkillTrees = async (arvores) => {
  const normalized = normalizeSkillTrees(arvores);

  if (USE_SUPABASE) {
    const updatedAt = new Date().toISOString();
    const rows = await requestSupabase("?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: SKILL_TREES_RECORD_ID,
        personagem: { tipo: "arvores-habilidades", arvores: normalized },
        updated_at: updatedAt,
      }),
    });
    const arvoresSalvas = normalizeSkillTrees(
      rows[0]?.personagem?.arvores || normalized,
    );
    cache.skillTrees = {
      arvores: arvoresSalvas,
      cachedAt: Date.now(),
    };

    return arvoresSalvas;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    SKILL_TREES_FILE,
    `${JSON.stringify(normalized, null, 2)}\n`,
  );
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
  res.corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    if (
      (url.pathname === "/api" || url.pathname === "/api/health") &&
      req.method === "GET"
    ) {
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

    if (url.pathname === "/api/arvores-habilidades" && req.method === "GET") {
      const arvores = await readSkillTrees();
      return sendJson(res, 200, { arvores });
    }

    if (url.pathname === "/api/arvores-habilidades" && req.method === "PUT") {
      const body = await readJsonBody(req);
      const arvores = await writeSkillTrees(body.arvores);
      return sendJson(res, 200, { arvores });
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
      if (!SERVE_FRONTEND) {
        return sendJson(res, 200, {
          ok: true,
          service: "ficha-darkness-backend",
          health: "/api/health",
        });
      }

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
