import { listarPersonagens } from './personagemApi';

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
      if(id.startsWith('darkness-')) {
        id=id.slice('darkness-'.length);
        const canonical=JSON.parse(localStorage.getItem(`${prefix}${id}`));
        if(canonical?.version===1) continue;
      }
      fichas.set(`espiral:${id}`,{
        fichaId:`espiral:${id}`,sistema:'espiral',
        personagem:{nome:sheet.name || 'Personagem ESPIRAL',fotoPerfil:sheet.profileImage || '',classe:sheet.vertente || 'Sem vertente',profileTokenAnimation:sheet.profileTokenAnimation,tabletopTokenAnimation:sheet.tabletopTokenAnimation,tabletopTokenImage:sheet.tabletopTokenImage || ''},
      });
    } catch { /* Uma ficha corrompida não impede listar as demais. */ }
  }
  return [...fichas.values()];
}

export async function listarFichasParaCampanha() {
  const darkness=await listarPersonagens();
  return [...darkness.map(ficha => ({...ficha,sistema:'darkness'})),...listarFichasEspiralLocais()]
    .sort((a,b) => String(a.personagem?.nome || '').localeCompare(String(b.personagem?.nome || ''),'pt-BR'));
}

