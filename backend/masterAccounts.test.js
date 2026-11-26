const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('individual codes grant master access and reserve account management for the owner', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'darkness-master-test-'));
  const codigoProprietario = '90752364';
  Object.assign(process.env, {
    DATA_DIR: directory,
    DARKNESS_OWNER_CODE: codigoProprietario,
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  });
  await fs.writeFile(path.join(directory, '__jogador_1234.json'), JSON.stringify({
    nome: 'Ana', codigo: '1234', tipo: 'perfil-jogador',
  }));
  const { handleRequest } = require('./server');
  const server = http.createServer(handleRequest);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  });
  async function request(route, { token, body } = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { status: response.status, ...await response.json() };
  }
  const login = codigo => request('/mestres/entrar', { body: { codigo } });
  const session = token => request('/mestres/sessao', { token });
  const create = (token, nome) => request('/master/mestres', { token, body: { nome, papel: 'proprietario' } });
  const list = (token, grupo) => request('/master/usuarios?grupo=' + grupo, { token });

  assert.equal((await login('000000000000')).status, 401);
  assert.equal((await login('1234')).status, 401);
  assert.equal((await session()).status, 401);
  assert.equal((await list(null, 'jogadores')).status, 401);
  const owner = await login(codigoProprietario);
  assert.equal(owner.usuario.papel, 'proprietario');
  assert.equal((await session(owner.token + 'x')).status, 401);
  assert.equal((await create(owner.token, '')).status, 400);

  const master = await create(owner.token, ' Ruan ');
  assert.equal(master.status, 201);
  assert.match(master.codigo, /^\d{16}$/);
  assert.equal(master.usuario.nome, 'Ruan');
  assert.equal(master.usuario.papel, 'mestre');
  const entries = await fs.readdir(path.join(directory, 'mestres'));
  assert.equal(entries.length, 1);
  assert.ok(!entries[0].includes(master.codigo));
  const file = await fs.readFile(path.join(directory, 'mestres', entries[0]), 'utf8');
  assert.ok(!file.includes(master.codigo));
  const auth = await login(master.codigo);
  assert.deepEqual(await session(auth.token), { status: 200, usuario: master.usuario });
  assert.equal((await create(auth.token, 'Bianca')).status, 403);
  assert.equal((await list(auth.token, 'mestres')).status, 403);
  assert.equal((await list(auth.token, 'jogadores')).status, 403);
  const campanha3D = { body: { nome: 'Ordem', sistema: 'ordem' } };
  assert.equal((await request('/master/campanhas-3d', campanha3D)).status, 401);
  assert.equal((await request('/master/campanhas-3d', { ...campanha3D, token: auth.token })).status, 403);
  assert.equal((await request('/master/campanhas-3d', { ...campanha3D, token: owner.token })).status, 503);
  assert.deepEqual((await list(owner.token, 'mestres')).usuarios, [owner.usuario, master.usuario]);
  assert.deepEqual((await list(owner.token, 'jogadores')).usuarios, [
    { id: 0, nome: 'Ana', papel: 'jogador' },
  ]);
  for (let i = 0; i < 11; i++) assert.equal((await login('000000000000')).status, 401);
  assert.equal((await login('000000000000')).status, 429);
});

test('a API de proprietário repassa somente campanhas 3D válidas ao armazenamento remoto', async () => {
  const { createMasterAccounts } = require('./masterAccounts');
  const writes = [];
  const handler = createMasterAccounts({
    ownerCode: '90752364',
    readBody: async req => req.body,
    createCampaign3D: async payload => {
      writes.push(payload);
      return { id: 'campanha-teste', ...payload };
    },
  });
  const post = (path, body, token) => handler(
    { method: 'POST', body, socket: { remoteAddress: '127.0.0.1' }, headers: token ? { authorization: `Bearer ${token}` } : {} },
    new URL(path, 'http://localhost'),
    (status, data) => ({ status, ...data }),
  );
  const { token } = await post('/api/mestres/entrar', { codigo: '90752364' });
  const invalid = await post('/api/master/campanhas-3d', { nome: 'Caso', sistema: 'inválido' }, token);
  assert.equal(invalid.status, 400);
  const result = await post('/api/master/campanhas-3d', { nome: ' Caso ', sistema: 'ordem', tabletop_tipo: '2d' }, token);
  assert.equal(result.status, 201);
  assert.equal(result.campanha.tabletop_tipo, '3d');
  assert.equal(result.campanha.sistema, 'ordem');
  assert.equal(writes.length, 1);
});

test('o autocadastro emite sessão de mestre e rejeita código duplicado', async () => {
  const { createMasterAccounts } = require('./masterAccounts');
  const accounts = new Map();
  const handler = createMasterAccounts({
    ownerCode: '90752364',
    readBody: async req => req.body,
    store: {
      find: async hash => accounts.get(hash),
      create: async (nome, hash) => {
        if (accounts.has(hash)) return null;
        const profile = { id: 'novo-mestre', nome, papel: 'mestre' };
        accounts.set(hash, profile);
        return profile;
      },
    },
  });
  const call = (path, body, token) => handler(
    { method: body ? 'POST' : 'GET', body, socket: { remoteAddress: '127.0.0.1' }, headers: token ? { authorization: `Bearer ${token}` } : {} },
    new URL(path, 'http://localhost'),
    (status, data) => ({ status, ...data }),
  );
  const body = { nome: 'Bianca', codigo: '0942', papel: 'proprietario' };
  assert.equal((await call('/api/mestres/cadastro', { ...body, codigo: '942' })).status, 400);
  const result = await call('/api/mestres/cadastro', body);
  assert.equal(result.status, 201);
  assert.equal(result.usuario.papel, 'mestre');
  assert.equal((await call('/api/mestres/sessao', null, result.token)).usuario.id, 'novo-mestre');
  assert.equal((await call('/api/mestres/entrar', { codigo: body.codigo })).status, 200);
  assert.equal((await call('/api/mestres/cadastro', body)).status, 409);
  assert.equal((await call('/api/master/usuarios', null, result.token)).status, 403);
});
