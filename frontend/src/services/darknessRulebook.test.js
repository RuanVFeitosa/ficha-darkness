import { defaultRulebook, loadRulebook, saveRulebook, searchRulebook, validateRulebook, upgradeRulebook, RULEBOOK_KEY } from './darknessRulebook';
import legacy from '../data/darknessRulebookLegacy.json';
import { readLocalCampaign, writeLocalCampaign } from './localCampaignStorage';
jest.mock('./localCampaignStorage', () => ({ readLocalCampaign: jest.fn(), writeLocalCampaign: jest.fn() }));
beforeEach(() => jest.resetAllMocks());
test('imports the source and returns independent editable copies', async () => {
  readLocalCampaign.mockResolvedValue(null);
  const book = await loadRulebook();
  expect(book.sourcePages).toBe(233);
  expect(book.edition).toBe(2);
  expect(new Set(book.sections.map(section => section.chapter)).size).toBe(10);
  expect(book.sections.find(section => section.id === 'topic-7').sourcePages).toEqual([7,8,9,10,11]);
  book.sections[0].title = 'Alterada';
  expect(defaultRulebook().sections[0].title).not.toBe('Alterada');
});
test('keeps table cells and multi-page topics together instead of splitting at PDF pages', () => {
  const book = defaultRulebook();
  const attributes = book.sections.find(section => section.id === 'topic-7');
  expect(attributes.content).toContain('| III | Acima da média | ◇8 |');
  expect(attributes.content).toContain('| V | Extraordinária | ⬢12 |');
  const weapons = book.sections.find(section => section.id === 'topic-94');
  expect(weapons.content).toContain('| Pistola | 2d6 | Médio | 12 | Ocultável |');
  const defenses = book.sections.find(section => section.id === 'topic-96');
  expect(defenses.sourcePages).toEqual([96,97,98]);
  expect(defenses.content).toContain('| Colete Balístico | 4 | Torso | Balístico |');
  expect(book.sections.find(section => section.id === 'topic-64').content).not.toContain('## HABILIDADES DE PERCEPÇÃO');
  expect(book.sections.find(section => section.id === 'topic-67').content).toContain('OLHAR TREINADO');
  expect(legacy.sections.every(old => book.sections.some(section => section.sourcePages.includes(old.sourcePage)))).toBe(true);
  const soldier = book.sections.find(section => section.id === 'topic-210');
  expect(soldier.content.match(/\| Atributo \| Valor \|/g)).toHaveLength(1);
  expect(soldier.content).toContain('| Sentido | Vigilante d8 |');
});
test('upgrades legacy saves while retaining edited text, additions and deletions', () => {
  const saved = JSON.parse(JSON.stringify(legacy));
  saved.sections.find(section => section.sourcePage === 8).content = 'Minha tabela ajustada';
  saved.sections = saved.sections.filter(section => section.sourcePage !== 94);
  saved.sections.push({id:'house-rule',title:'Nova',chapter:'Mesa',content:'Regra particular'});
  const upgraded = upgradeRulebook(saved);
  expect(upgraded.sections.find(section => section.id === 'topic-7').content).toContain('Minha tabela ajustada');
  expect(upgraded.sections.some(section => section.id === 'topic-94')).toBe(false);
  expect(upgraded.sections.find(section => section.id === 'house-rule').content).toBe('Regra particular');
  expect(upgraded.legacyBackup).toEqual(saved);
  expect(upgradeRulebook(upgraded)).toBe(upgraded);
  expect(upgradeRulebook({...legacy,sections:[]}).sections).toEqual([]);
});
test('saves additions, edits and deletions, including an empty book', async () => {
  const book = {version:1, sections:[]};
  const saved = await saveRulebook(book);
  expect(writeLocalCampaign).toHaveBeenCalledWith(RULEBOOK_KEY, saved);
  readLocalCampaign.mockResolvedValue(saved);
  expect((await loadRulebook()).sections).toEqual([]);
});
test('does not overwrite corrupted saved content or hide write failures', async () => {
  readLocalCampaign.mockResolvedValue({version:99});
  await expect(loadRulebook()).rejects.toThrow();
  expect(writeLocalCampaign).not.toHaveBeenCalled();
  writeLocalCampaign.mockRejectedValue(new Error('Sem espaço'));
  await expect(saveRulebook(defaultRulebook())).rejects.toThrow('Sem espaço');
});
test('searches across the text without requiring accents and matches all words', () => {
  const sections = [{title:'Ação', chapter:'Combate', content:'Proteção do personagem'}, {title:'Outra',chapter:'Mesa',content:'Proteção'}];
  expect(searchRulebook(sections,'acao protecao')).toEqual([sections[0]]);
  expect(searchRulebook(sections,'inexistente')).toEqual([]);
});
test('rejects duplicate IDs and missing text before saving', () => {
  const section = {id:'a',title:'Regra',chapter:'Mesa',content:'Texto'};
  expect(() => validateRulebook({version:1,sections:[section,section]})).toThrow();
  expect(() => validateRulebook({version:1,sections:[{...section,content:' '}]})).toThrow();
});
