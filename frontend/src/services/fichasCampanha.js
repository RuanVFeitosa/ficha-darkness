import { listarPersonagens } from './personagemApi';
import { isProtocolSheet } from '../data/protocoloDarkness';
import { isEspiralSheet, espiralRemoteId } from './espiralApi';

export function fichaParaCampanha(sheet, fichaId) {
  return { fichaId, sistema: isProtocolSheet(sheet) ? 'darkness' : 'espiral', personagem: {
    ...sheet, nome: sheet.name || sheet.nome || 'Personagem', fotoPerfil: sheet.profileImage || sheet.fotoPerfil || '',
    classe: sheet.occupation || sheet.vertente || 'Sem ocupação',
  } };
}

export function listarFichasEspiralLocais() {
  const prefix='espiral:sheet:v1:';
  const fichas=new Map();
  for(let index=0;index<localStorage.length;index+=1) {
    const key=localStorage.key(index);
    if(!key?.startsWith(prefix)) continue;
    try {
      const sheet=JSON.parse(localStorage.getItem(key));
      if(sheet?.version!==1 || !sheet.attributes) continue;
      let id=key.slice(prefix.length);
      if(id.startsWith('darkness-') && !isProtocolSheet(sheet)) {
        id=id.slice('darkness-'.length);
        const canonical=JSON.parse(localStorage.getItem(`${prefix}${id}`));
        if(canonical?.version===1) continue;
      }
      const fichaId = isProtocolSheet(sheet) ? espiralRemoteId(id) : `espiral:${id}`;
      fichas.set(fichaId, fichaParaCampanha(sheet, fichaId));
    } catch { /* Uma ficha corrompida não impede listar as demais. */ }
  }
  return [...fichas.values()];
}

export async function listarFichasParaCampanha() {
  const remotas = await listarPersonagens();
  const fichas = new Map(listarFichasEspiralLocais().map(ficha => [ficha.fichaId, ficha]));
  for (const ficha of remotas) {
    const sheet = ficha.personagem || {};
    if (isEspiralSheet(sheet)) {
      const id = sheet.espiralId || String(ficha.fichaId).replace(/^espiral[_:]/, '');
      const canonicalId = isProtocolSheet(sheet) ? espiralRemoteId(id) : `espiral:${id}`;
      fichas.set(canonicalId, fichaParaCampanha(sheet, canonicalId));
    } else fichas.set(ficha.fichaId, { ...ficha, sistema: 'darkness' });
  }
  return [...fichas.values()].sort((a,b) => String(a.personagem?.nome || '').localeCompare(String(b.personagem?.nome || ''),'pt-BR'));
}

