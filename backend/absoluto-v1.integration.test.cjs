const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

test('migração Absoluto 1.0 não recupera Passivos nem aceita sobrescrita de cliente antigo', async () => {
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'darkness-absoluto-v1-'));
  process.env.SUPABASE_URL = ''; process.env.SUPABASE_SERVICE_ROLE_KEY = '';
  const { handleRequest } = require('./server');
  const server = http.createServer(handleRequest);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/personagens/absoluto-v1-test`;
  const put = personagem => fetch(url, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(personagem) });
  try {
    const antigo = { nome:'Lia', atributos:{forca:30}, habilidadesPassivas:{lutar:15}, sincronizacaoCampos:{habilidadesPassivas:100} };
    assert.equal((await put(antigo)).status, 200);
    const novo = { nome:'Lia', versaoRegras:'1.0', atributos:{forca:3}, dominios:{violencia:2}, membros:{pescoco:{atual:4,max:4}}, habilidadesPassivas:{}, legadoAbsoluto:antigo };
    assert.equal((await put(novo)).status, 200);
    await put({...antigo, nome:'Cópia antiga'});
    const salvo = (await (await fetch(url)).json()).personagem;
    assert.equal(salvo.versaoRegras, '1.0');
    assert.equal(salvo.nome, 'Lia');
    assert.deepEqual(salvo.habilidadesPassivas, {});
    assert.deepEqual(salvo.dominios, {violencia:2});
    assert.deepEqual(salvo.legadoAbsoluto, antigo);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
