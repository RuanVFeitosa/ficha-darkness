const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

test("Destinos persistem após reabrir a API e não aparecem como fichas", async () => {
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "darkness-destinos-"));
  process.env.SUPABASE_URL = "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  const { handleRequest } = require("./server");
  let server;
  const abrir = async () => {
    server = http.createServer(handleRequest);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    return `http://127.0.0.1:${server.address().port}/api`;
  };
  const fechar = () => new Promise((resolve) => server.close(resolve));
  let base = await abrir();
  const gravar = async (destinos) => {
    const resposta = await fetch(`${base}/destinos`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinos }),
    });
    assert.equal(resposta.status, 200);
  };
  const ler = async (rota) => (await fetch(`${base}/${rota}`)).json();
  try {
    const destino = { id: "teste", nome: "Destino", habilidades: [] };
    await gravar([destino]);
    await fechar();
    base = await abrir();
    assert.deepEqual((await ler("destinos")).destinos, [destino]);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(process.env.DATA_DIR, "destinos.json"), "utf8")), [destino]);
    assert(!(await ler("personagens")).personagens.some((f) => f.fichaId === "destinos"));
    await gravar([{ ...destino, nome: "Corrigido" }]);
    assert.equal((await ler("destinos")).destinos[0].nome, "Corrigido");
    await gravar([]);
    assert.deepEqual((await ler("destinos")).destinos, []);
  } finally {
    await fechar();
  }
});
