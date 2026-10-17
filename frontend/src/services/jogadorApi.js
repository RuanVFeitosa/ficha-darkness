import {validateCharacterLimit,PLAYER_CHARACTER_LIMIT} from '../utils/playerCharacters';
import { buscarJogador, salvarJogador, buscarPersonagem } from './personagemApi';
export const codigoValido = codigo => /^\d{4,8}$/.test(codigo);
export const fichaKey = ficha => `${ficha.sistema}:${ficha.id}`;
export async function carregarFicha(ref) {
  if (ref.sistema === 'espiral') {
    const sheet = JSON.parse(localStorage.getItem(`espiral:sheet:v1:${ref.id}`) || 'null');
    if (!sheet?.attributes) throw new Error('Ficha ESPIRAL indisponível neste dispositivo.');
    return { ...ref, nome: sheet.name, foto: sheet.profileImage, detalhe: sheet.vertente, dados: sheet };
  }
  const dados = await buscarPersonagem(ref.id);
  if (!dados || dados.tipo === 'perfil-jogador') throw new Error('Personagem não encontrado.');
  return { ...ref, nome: dados.nome, foto: dados.fotoPerfil, detalhe: dados.classe, dados };
}
export async function entrarJogador(codigo, criar = false) {
  if (!codigoValido(codigo)) throw new Error('Use um código de 4 a 8 dígitos.');
  let perfil = await buscarJogador(codigo);
  if (!perfil) {
    const personagens = [];
    let identidade = {};
    for (const sistema of ['darkness', 'espiral']) {
      try { const ficha = await carregarFicha({ id: codigo, sistema }); if (!identidade.nome) identidade = { nome: ficha.dados.nomeJogador || ficha.dados.player }; personagens.push({ id: codigo, sistema }); } catch { /* Pode pertencer ao outro sistema. */ }
    }
    if (!personagens.length && !criar) throw new Error('Código não encontrado. Cadastre um perfil ou confira seu código.');
    perfil = await salvarJogador(codigo, { nome: identidade.nome || 'Jogador', personagens, builds: [], tema: 'escuro' });
  }
  // Perfis migrados antes da identidade do jogador receberam o nome genérico.
  if (!String(perfil.nome || '').trim() || perfil.nome.trim().toLowerCase() === 'jogador') {
    for (const ref of perfil.personagens || []) {
      let ficha;
      try { ficha = await carregarFicha(ref); } catch { continue; }
      const nomeJogador = String(ficha.dados.nomeJogador || ficha.dados.player || '').trim();
      if (!nomeJogador || nomeJogador.toLowerCase() === 'jogador') continue;
      perfil = await salvarJogador(codigo, { ...perfil, nome: nomeJogador });
      break;
    }
  }
  const pendentes = JSON.parse(localStorage.getItem(`darkness:jogador:pendentes:${codigo}`) || '[]');
  if (pendentes.length) {
    const personagens = [...new Map([...perfil.personagens, ...pendentes].map(p => [fichaKey(p), p])).values()];
    validateCharacterLimit(personagens);
    perfil = await salvarJogador(codigo, { ...perfil, personagens });
    localStorage.removeItem(`darkness:jogador:pendentes:${codigo}`);
  }
  for (const ref of perfil.personagens || []) {
    localStorage.setItem('darkness:ficha-jogador:' + fichaKey(ref), codigo);
  }
  sessionStorage.setItem('darkness:jogador', codigo);
  return perfil;
}
export async function vincularAoJogadorAtivo(id, sistema) {
  const codigo = sessionStorage.getItem('darkness:jogador');
  if (!codigo) return;
  await verificarVagaPersonagem(id,sistema);
  const chave = `darkness:jogador:pendentes:${codigo}`;
  const pendentes = JSON.parse(localStorage.getItem(chave) || '[]');
  localStorage.setItem(chave, JSON.stringify([...pendentes, { id, sistema }]));
  try {
    await entrarJogador(codigo);
  } catch {
    // A ficha já foi criada. O vínculo será reenviado ao abrir o perfil.
  }
}
export function documentoVisivel(documento, ids) {
  return documento.revelada !== false && ((documento.visualizarTodos ?? documento.visualizar_todos ?? true) || (documento.jogadoresVisiveis || documento.jogadores_visiveis || []).some(id => ids.includes(String(id))));
}
export const fichaHref = ficha => `?sistema=${ficha.sistema}&ficha=${encodeURIComponent(ficha.id)}`;

// A sessão pode pertencer a outra ficha aberta pelo mestre nesta mesma aba.
export async function paginaJogadorDaFicha(id, sistema) {
  const ref = { id: String(id), sistema };
  const candidatos = [...new Set([
    localStorage.getItem('darkness:ficha-jogador:' + fichaKey(ref)),
    sessionStorage.getItem('darkness:jogador')
  ].filter(Boolean))];
  for (const codigo of candidatos) {
    try {
      const perfil = await buscarJogador(codigo);
      if (perfil?.personagens?.some(p => String(p.id) === ref.id && p.sistema === sistema)) {
        localStorage.setItem('darkness:ficha-jogador:' + fichaKey(ref), codigo);
        return '/?jogador=' + encodeURIComponent(codigo);
      }
    } catch { /* Nunca usar uma sessão sem confirmar o vínculo. */ }
  }
  return '/?jogador=' + encodeURIComponent(id);
}

export async function verificarVagaPersonagem(id,sistema){
 const codigo=sessionStorage.getItem('darkness:jogador');if(!codigo)return;
 let perfil;try{perfil=await buscarJogador(codigo);}catch{return;}if(!perfil)return;
 const pendentes=JSON.parse(localStorage.getItem('darkness:jogador:pendentes:'+codigo)||'[]');
 const refs=[...new Map([...(perfil.personagens||[]),...pendentes].map(ref=>[fichaKey(ref),ref])).values()];
 if(!refs.some(ref=>String(ref.id)===String(id)&&ref.sistema===sistema)&&refs.length>=PLAYER_CHARACTER_LIMIT)throw new Error('O perfil permite no máximo 10 personagens.');
}
