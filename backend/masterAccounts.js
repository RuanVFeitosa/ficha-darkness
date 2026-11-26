const { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } = require('node:crypto');

const PAGE_SIZE = 40;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const ATTEMPT_WINDOW = 60 * 1000;
const routes = new Set(['/api/mestres/entrar', '/api/mestres/cadastro', '/api/mestres/sessao', '/api/master/usuarios', '/api/master/mestres', '/api/master/campanhas-3d']);
const validCode = code => typeof code === 'string' && /^\d{4,16}$/.test(code);
const validOwnerCode = code => typeof code === 'string' && /^\d{8,16}$/.test(code);
const digest = code => createHash('sha256').update(code).digest();
const safeEqual = (a, b) => a.length === b.length && timingSafeEqual(a, b);

function createMasterAccounts({ ownerCode, signingSecret = randomBytes(32), codeSecret, ownerName = 'Proprietário', readBody, store, listPlayers, createCampaign3D }) {
  const attempts = new Map();
  const owner = { id: 'owner', nome: ownerName, papel: 'proprietario' };
  const ownerDigest = validOwnerCode(ownerCode) ? digest(ownerCode) : null;
  const sign = payload => createHmac('sha256', signingSecret)
    .update('darkness-master-session\0').update(ownerCode).update(payload).digest();
  const codeHash = code => codeSecret
    ? createHmac('sha256', codeSecret).update('darkness-master-code\0').update(code).digest('hex')
    : digest(code).toString('hex');

  function issueSession(usuario) {
    const encoded = Buffer.from(JSON.stringify({ usuario, exp: Date.now() + SESSION_TTL })).toString('base64url');
    return encoded + '.' + sign(encoded).toString('base64url');
  }

  function readSession(header) {
    const match = header?.match(/^Bearer ([A-Za-z0-9_-]{1,2048})\.([A-Za-z0-9_-]{43})$/i);
    if (!match || !safeEqual(Buffer.from(match[2], 'base64url'), sign(match[1]))) return null;
    try {
      const { usuario, exp } = JSON.parse(Buffer.from(match[1], 'base64url'));
      return exp > Date.now() ? usuario : null;
    } catch {
      return null;
    }
  }

  function allowAttempt(address) {
    const now = Date.now();
    const current = attempts.get(address);
    if (current?.expires > now) return ++current.count <= 15;
    if (attempts.size >= 1000) {
      for (const [ip, state] of attempts) {
        if (state.expires <= now) attempts.delete(ip);
      }
      if (attempts.size >= 1000) return false;
    }
    attempts.set(address, { count: 1, expires: now + ATTEMPT_WINDOW });
    return true;
  }

  return async function masterAccounts(req, url, send) {
    const route = url.pathname;
    if (!routes.has(route)) return false;
    const isLogin = route === '/api/mestres/entrar';
    const isSession = route === '/api/mestres/sessao';
    const isList = route === '/api/master/usuarios';
    if (req.method !== (isSession || isList ? 'GET' : 'POST')) {
      return send(405, { error: 'Método não permitido.' });
    }
    if (!ownerDigest) return send(503, { error: 'O acesso de mestre ainda precisa ser configurado.' });
    try {
      if (route === '/api/mestres/cadastro') {
        if (!allowAttempt(req.socket.remoteAddress)) return send(429, { error: 'Muitas tentativas. Aguarde um minuto.' });
        const body = await readBody(req).catch(() => null);
        const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
        if (!nome || nome.length > 80 || !validCode(body?.codigo)) {
          return send(400, { error: 'Informe um nome de até 80 caracteres e um código de 4 a 16 dígitos.' });
        }
        if (safeEqual(digest(body.codigo), ownerDigest)) return send(409, { error: 'Escolha outro código de mestre.' });
        const usuario = await store.create(nome, codeHash(body.codigo));
        if (!usuario) return send(409, { error: 'Escolha outro código de mestre.' });
        return send(201, { usuario, token: issueSession(usuario) });
      }
      if (isLogin) {
        if (!allowAttempt(req.socket.remoteAddress)) return send(429, { error: 'Muitas tentativas. Aguarde um minuto.' });
        const body = await readBody(req).catch(() => null);
        const codigo = body?.codigo;
        if (!validCode(codigo)) return send(401, { error: 'Código de mestre inválido.' });
        const usuario = safeEqual(digest(codigo), ownerDigest) ? owner
          : await store.find(codeHash(codigo));
        if (!usuario) return send(401, { error: 'Código de mestre inválido.' });
        return send(200, { usuario, token: issueSession(usuario) });
      }

      const usuario = readSession(req.headers.authorization);
      if (!usuario) return send(401, { error: 'Entre com seu código de mestre.' });
      if (isSession) return send(200, { usuario });
      if (usuario.papel !== 'proprietario') return send(403, { error: 'Permissão insuficiente.' });

      if (isList) {
        const grupo = url.searchParams.get('grupo');
        const pagina = Number(url.searchParams.get('pagina') || 1);
        if (!['jogadores', 'mestres'].includes(grupo) || !Number.isSafeInteger(pagina) || pagina < 1 || pagina > 100000) {
          return send(400, { error: 'Grupo ou página inválida.' });
        }
        const offset = (pagina - 1) * PAGE_SIZE;
        const usuarios = grupo === 'jogadores'
          ? await listPlayers(offset, PAGE_SIZE + 1)
          : await store.list(Math.max(0, offset - 1), PAGE_SIZE + Number(pagina > 1));
        if (grupo === 'mestres' && pagina === 1) usuarios.unshift(owner);
        return send(200, { usuarios: usuarios.slice(0, PAGE_SIZE), mais: usuarios.length > PAGE_SIZE });
      }

      const body = await readBody(req).catch(() => null);
      const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
      if (route === '/api/master/campanhas-3d') {
        if (!nome || nome.length > 100 || !['absoluto', 'espiral', 'ordem'].includes(body?.sistema)) {
          return send(400, { error: 'Informe um nome de campanha válido e um sistema.' });
        }
        if (!createCampaign3D) return send(503, { error: 'O armazenamento remoto não está configurado.' });
        const personalizado = typeof body.codigo === 'string' ? body.codigo.trim().toUpperCase() : '';
        if (body.codigo !== undefined && !/^[A-Z0-9]{6,10}$/.test(personalizado)) {
          return send(400, { error: 'Use de 6 a 10 letras ou números no código da campanha.' });
        }
        const prefix = nome.normalize('NFD').replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
        const codigo = personalizado || prefix + randomInt(100000, 1000000);
        const campanha = await createCampaign3D({ nome, codigo, sistema: body.sistema, tabletop_tipo: '3d' });
        return send(201, { campanha });
      }
      if (!nome || nome.length > 80) return send(400, { error: 'Informe um nome de até 80 caracteres.' });
      for (let i = 0; i < 3; i++) {
        const codigo = String(randomInt(100000000, 1000000000)) + String(randomInt(1000000, 10000000));
        if (safeEqual(digest(codigo), ownerDigest)) continue;
        const mestre = await store.create(nome, codeHash(codigo));
        if (mestre) return send(201, { usuario: mestre, codigo });
      }
      return send(503, { error: 'Não foi possível gerar o código. Tente novamente.' });
    } catch (error) {
      console.error('Contas de mestre:', error.message);
      return send(502, { error: 'Não foi possível consultar o serviço de contas. Tente novamente.' });
    }
  };
}

module.exports = { createMasterAccounts, routes };
