import { urlApi } from './personagemApi';

const SESSION_KEY = 'darkness:master:session';

async function accountRequest(path, options) {
  const token = sessionStorage.getItem(SESSION_KEY);
  const response = await fetch(urlApi(path), {
    ...options,
    cache: 'no-store',
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) sairMestre();
  if (!response.ok) throw new Error(payload.error || 'Serviço de contas indisponível.');
  return payload;
}

export async function entrarMestre(codigo) {
  const { usuario, token } = await accountRequest('/mestres/entrar', {
    method: 'POST',
    body: JSON.stringify({ codigo }),
  });
  sessionStorage.setItem(SESSION_KEY, token);
  return usuario;
}

export async function registrarMestre(nome, codigo) {
  const { usuario, token } = await accountRequest('/mestres/cadastro', {
    method: 'POST',
    body: JSON.stringify({ nome, codigo }),
  });
  sessionStorage.setItem(SESSION_KEY, token);
  return usuario;
}

const playerKey = mestreId => `darkness:mestre:jogador:${mestreId}`;
export const codigoJogadorDoMestre = mestreId => localStorage.getItem(playerKey(mestreId));
export const vincularJogadorAoMestre = (mestreId, codigo) => localStorage.setItem(playerKey(mestreId), codigo);
export const desvincularJogadorDoMestre = mestreId => localStorage.removeItem(playerKey(mestreId));

export async function sessaoMestre() {
  if (!sessionStorage.getItem(SESSION_KEY)) return null;
  return (await accountRequest('/mestres/sessao')).usuario;
}

export function sairMestre() {
  sessionStorage.removeItem(SESSION_KEY);
}

export const listarUsuarios = (grupo, pagina, signal) =>
  accountRequest(`/master/usuarios?${new URLSearchParams({ grupo, pagina })}`, { signal });

export const criarMesa3DRemota = async (nome, sistema, codigo) =>
  (await accountRequest('/master/campanhas-3d', { method: 'POST', body: JSON.stringify({ nome, sistema, codigo }) })).campanha;
