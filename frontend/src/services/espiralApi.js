import { buscarPersonagem, salvarPersonagem } from './personagemApi';
import { normalizarResistenciasEspiral } from '../data/espiral';

export const espiralRemoteId = id => `espiral_${String(id).toLowerCase()}`;
export const isEspiralSheet = sheet => sheet?.version === 1 && !!sheet.attributes && !sheet.atributos;
export async function buscarFichaEspiral(id) {
  const sheet = await buscarPersonagem(espiralRemoteId(id));
  return isEspiralSheet(sheet) ? normalizarResistenciasEspiral(sheet) : null;
}
export async function salvarFichaEspiral(id, sheet) {
  if (!isEspiralSheet(sheet) || !sheet.name?.trim()) return null;
  return salvarPersonagem(espiralRemoteId(id), {
    ...normalizarResistenciasEspiral(sheet), sistema:'espiral', espiralId:String(id), nome:sheet.name.trim(),
  });
}

export function unirFichasEspiral(locais, remotas) {
  const result = new Map(locais.map(ficha => [ficha.fichaId, ficha]));
  for (const ficha of remotas) {
    if (isEspiralSheet(ficha.personagem)) {
      const id = ficha.personagem.espiralId || ficha.fichaId.replace(/^espiral_/, '');
      result.set(`espiral:${id}`, {...ficha, fichaId:`espiral:${id}`, espiralId:id, sistema:'espiral'});
    } else result.set(ficha.fichaId, ficha);
  }
  return [...result.values()];
}
