import { createEspiralEncounter, writeEspiralEncounter, readEspiralEncounters, espiralEncounterForTabletop, ESPIRAL_ENCOUNTERS_CHANGED } from './espiralEncounters';
import { vincularInimigo, posicionarInimigoNoMapa, buscarCampanhaPorCodigo, removerTokenDoMapa } from '../services/mesaApi';

jest.mock('../services/supabase', () => ({ supabaseConfigurado: false }));
beforeEach(() => localStorage.clear());

test.each(['npc', 'inimigo'])('%s Espiral entra na campanha e publica o token de corpo inteiro', async tipo => {
  const changed = jest.fn();
  window.addEventListener(ESPIRAL_ENCOUNTERS_CHANGED, changed);
  writeEspiralEncounter(localStorage, { ...createEspiralEncounter(tipo, 'guard'), name: 'Guarda', folder: 'Portão', profileImage: '/portrait.png', tabletopTokenImage: '/body.png' });
  expect(changed).toHaveBeenCalledTimes(1);
  window.removeEventListener(ESPIRAL_ENCOUNTERS_CHANGED, changed);
  const entry = espiralEncounterForTabletop(readEspiralEncounters(localStorage)[0]);
  expect(entry).toMatchObject({ id: 'espiral:guard', nome: 'Guarda', pasta: 'Portão', tipo, fotoPerfil: '/portrait.png', defesa: 4 });
  // References are namespaced to avoid collisions with the legacy catalogue.
  const linked = await vincularInimigo('demo', entry);
  const token = await posicionarInimigoNoMapa('demo', { ...linked, fotoPerfil: linked.tabletopTokenImage || linked.fotoPerfil }, 50, 50, 'map-3d');
  expect(token).toMatchObject({ ficha_id: 'inimigo:espiral:guard', nome: 'Guarda', imagem_url: '/body.png', removido: false, oculto: false });
  const campaign = await buscarCampanhaPorCodigo('DARK26');
  expect(campaign.tokens).toEqual(expect.arrayContaining([expect.objectContaining({ ficha_id: token.ficha_id, imagem_url: '/body.png' })]));
  await removerTokenDoMapa(token.id);
  const removed = await buscarCampanhaPorCodigo('DARK26');
  expect(removed.tokens.find(item => item.id === token.id).removido).toBe(true);
  expect(removed.inimigos).toEqual(expect.arrayContaining([expect.objectContaining({ inimigo_ref: entry.id })]));
  expect(readEspiralEncounters(localStorage)[0].id).toBe('guard');
  await posicionarInimigoNoMapa('demo', { ...linked, fotoPerfil: linked.tabletopTokenImage }, 50, 50, 'map-3d');
  const restored = await buscarCampanhaPorCodigo('DARK26');
  expect(restored.tokens.find(item => item.id === token.id).removido).toBe(false);
  expect(restored.tokens.filter(item => item.ficha_id === token.ficha_id)).toHaveLength(1);
});
