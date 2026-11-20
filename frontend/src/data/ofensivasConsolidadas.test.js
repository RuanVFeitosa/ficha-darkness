import raw from './habilidadesDarknessAdaptadas.json';
import groups from './fusoesOfensivas.json';
import { OFENSIVAS_CONSOLIDADAS, consolidarOfensivasAdquiridas, consolidarIdsBuildOfensivos, ofensivaConsolidada } from './ofensivasConsolidadas';
import { HABILIDADES_ESPIRAL } from './habilidadesEspiral';
import { normalizarFichaEspiral, freshSheet } from './espiral';
import { grantEspiralCatalogEntry } from '../utils/espiralCatalogGrant';

test('cada origem aparece em uma única fusão, resolvida no catálogo sem versões redundantes', () => {
  const ids = groups.flatMap(g => g.members);
  expect(new Set(ids).size).toBe(ids.length);
  for (const group of groups) {
    expect(HABILIDADES_ESPIRAL.Ofensiva.filter(([name]) => name === group.name)).toHaveLength(1);
    for (const id of group.members) {
      const source = raw.find(h => h.sourceId === id);
      const oldId = id.startsWith('base:') ? `Ofensiva:${id.slice(5)}` : source.id;
      expect(ofensivaConsolidada(oldId).name).toBe(group.name);
      if (source) expect(HABILIDADES_ESPIRAL.Ofensiva.some(([name]) => name === source.name)).toBe(false);
    }
  }
  expect(HABILIDADES_ESPIRAL.Ofensiva).toHaveLength(107);
});

test('migra aliases dos dois catálogos, mantém maior nível, saldo e histórico sem somar bônus', () => {
  const first = raw.find(h => h.sourceId === 'ataque-furtivo');
  const second = raw.find(h => h.sourceId === 'assassino-silencioso');
  const old = [{ id: `Ofensiva:${first.name}`, name: first.name, level: 1 }, { id: second.id, name: second.name, level: 3 }, { id: 'Apoio:Âncora', name: 'Âncora', level: 2 }];
  const sheet = normalizarFichaEspiral({ ...freshSheet(), evolution: { points: 7, abilities: old } });
  expect(sheet.evolution.points).toBe(7);
  expect(sheet.evolution.abilities).toHaveLength(2);
  expect(sheet.evolution.abilities[0]).toMatchObject({ id: 'Ofensiva:Ataque Furtivo', name: 'Ataque Furtivo', level: 3, mergedFrom: old.slice(0, 2) });
  expect(sheet.evolution.abilities[1]).toEqual(old[2]);
  expect(normalizarFichaEspiral(sheet)).toEqual(sheet);
  expect(old[0].name).toBe(first.name);
  const entry = { ...OFENSIVAS_CONSOLIDADAS.find(h => h.name === 'Ataque Furtivo'), type: 'ability' };
  expect(grantEspiralCatalogEntry({ evolution: { points: 7, abilities: old } }, entry)).toEqual({});
});

test('mantém as outras categorias e habilidades personalizadas intactas', () => {
  const abilities = [{ id: 'custom:one', name: 'Poder próprio', level: 2 }, { id: 'Resistência:Respira', level: 1 }];
  expect(consolidarOfensivasAdquiridas(abilities)).toEqual(abilities);
});

test('builds salvas recuperam as habilidades canônicas sem seleções duplicadas', () => {
  const sources = raw.filter(h => ['ataque-furtivo', 'assassino-silencioso'].includes(h.sourceId));
  const ids = [...sources.map(h => `espiral:Ofensiva:${h.name}`), 'espiral:Apoio:Âncora'];
  expect(consolidarIdsBuildOfensivos(ids)).toEqual(['espiral:Ofensiva:Ataque Furtivo', 'espiral:Apoio:Âncora']);
  expect(ids).toHaveLength(3);
});
