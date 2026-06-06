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
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
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

const readPersonagem = async (id) => {
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(getDataFile(id), `${JSON.stringify(personagem, null, 2)}\n`);
  return personagem;
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    if (url.pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, { ok: true });
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

      const saved = await writePersonagem(fichaId, personagem);
      return sendJson(res, 200, { fichaId, personagem: saved });
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
    return sendJson(res, 500, { error: "Erro interno do servidor" });
  }
});

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
  console.log("Deixe este terminal aberto enquanto estiver usando o site.");
});
