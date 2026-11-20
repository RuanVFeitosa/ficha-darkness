import { arvoresHabilidades } from './Classes/arvoresHabilidades';
import { obterMarcosProgressao } from './progressaoAvancada';
import { CLASSES_HABILIDADES_DARKNESS, HABILIDADES_DARKNESS_ORIGINAIS as originais, HABILIDADES_DARKNESS_ADAPTADAS as catalogo } from './habilidadesDarkness';
import { ofensivaConsolidada } from './ofensivasConsolidadas';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from './habilidadesEspiral';
import { grantEspiralCatalogEntry } from '../utils/espiralCatalogGrant';

test('cobre cada habilidade, aptidão, passiva de especialismo e marco das cinco classes', () => {
  const sources = [];
  Object.entries(arvoresHabilidades).forEach(([classe, arvore]) => {
    ['absolutas', 'aptidoes'].forEach(tipo => (arvore[tipo] || []).forEach(h => sources.push(`${classe}:${tipo}::${h.id}`)));
    arvore.especialidades.forEach(e => {
      if (e.passiva) sources.push(`${classe}:passivaEspecialismo::${e.id}`);
      e.habilidades.forEach(h => sources.push(`${classe}:especialismo:${e.nome}:${h.id}`));
    });
    Object.values(obterMarcosProgressao({ classeId: classe })).forEach(m => m.opcoes.forEach(h => sources.push(`${classe}:marco::${h.id}`)));
  });
  expect(originais.map(h => h.id).sort()).toEqual(sources.map(id => `darkness:${id}`).sort());
  originais.forEach(h => expect(catalogo.some(active => active.id === (ofensivaConsolidada(h.id)?.id || h.id))).toBe(true));
  expect(new Set(catalogo.map(h => h.name)).size).toBe(catalogo.length);
});

test('publica o catálogo completo com três níveis e custos em todos os consumidores compartilhados', () => {
  catalogo.forEach(h => {
    expect(CLASSES_HABILIDADES_DARKNESS).toContain(h.category);
    expect(HABILIDADES_ESPIRAL[h.category]).toContainEqual([h.name, h.action, h.detail]);
    expect(APRIMORAMENTOS_HABILIDADES_ESPIRAL[h.name]).toEqual(h.levels);
    expect(h.levels).toHaveLength(3);
    expect(CUSTOS_ESPERANCA_HABILIDADES[h.name]).toEqual(h.hope);
    expect(h.detail).not.toMatch(/\b(?:PE|PI|PV|Domínio|Fortitude|Reflexos|Precisão|Violência)\b|oito dados|dois Finais|faces de Êxito/);
    expect(h.rules).toContain('máximo de seis dados');
  });
});

test.each([
  ['corte-devastador', 'Ofensiva'], ['calma-sob-fogo', 'Resistência'],
  ['mente-analitica', 'Percepção'], ['triagem-de-emergencia', 'Apoio'],
  ['ataque-furtivo', 'Ofensiva'], ['postura-defensiva', 'Resistência'],
])('%s segue a função principal %s', (id, category) => {
  expect(catalogo.find(h => h.sourceId === id || h.mergedSourceIds?.includes(id)).category).toBe(category);
});

test('habilidades diferentes são concedidas sem perder habilidades ou pontos existentes', () => {
  const homonimos = catalogo.filter(h => ['Ataque Furtivo', 'Golpe Devastador'].includes(h.name));
  expect(homonimos).toHaveLength(2);
  let sheet = { evolution: { points: 7, abilities: [{ id: 'Ofensiva:Golpe Calculado' }] } };
  homonimos.forEach(h => {
    const entry = { ...h, id: `${h.category}:${h.name}`, type: 'ability' };
    sheet = { ...sheet, ...grantEspiralCatalogEntry(sheet, entry) };
    expect(grantEspiralCatalogEntry(sheet, entry)).toEqual({});
  });
  expect(sheet.evolution.points).toBe(7);
  expect(sheet.evolution.abilities).toHaveLength(1 + homonimos.length);
});
