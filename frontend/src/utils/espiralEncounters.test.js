import { createEspiralEncounter, normalizeEspiralEncounter, readEspiralEncounters, writeEspiralEncounter, rollEspiralEncounter, ESPIRAL_ENCOUNTERS_KEY } from './espiralEncounters';

beforeEach(() => localStorage.clear());
test('NPC e inimigo usam o mesmo modelo e salvam em arquivo separado do Darkness', () => {
  localStorage.setItem('darkness_npcs', JSON.stringify([{ id: 'legacy', nome: 'Conselho' }]));
  localStorage.setItem('darkness_inimigos', 'dados antigos');
  writeEspiralEncounter(localStorage, createEspiralEncounter('npc', 'one'));
  writeEspiralEncounter(localStorage, createEspiralEncounter('inimigo', 'two'));
  expect(readEspiralEncounters(localStorage).map(record => record.tipo)).toEqual(['npc', 'inimigo']);
  expect(readEspiralEncounters(localStorage)[0].attributes).toEqual({ pulso: 2, razao: 2, sentido: 2, voz: 2 });
  expect(localStorage.getItem('darkness_npcs')).toBe('[{"id":"legacy","nome":"Conselho"}]');
  expect(localStorage.getItem('darkness_inimigos')).toBe('dados antigos');
  expect(localStorage.getItem('espiral:sheet:v1:one')).toBeNull();
});

test('atualização mantém o id, não duplica e preserva registros de outros encontros', () => {
  writeEspiralEncounter(localStorage, createEspiralEncounter('npc', 'one'));
  writeEspiralEncounter(localStorage, createEspiralEncounter('inimigo', 'two'));
  writeEspiralEncounter(localStorage, { ...createEspiralEncounter('npc', 'one'), name: 'Guarda', tipo: 'inimigo', folder: '  Capítulo 1 ' });
  const result = readEspiralEncounters(localStorage);
  expect(result).toHaveLength(2);
  expect(result[0]).toEqual(expect.objectContaining({ name: 'Guarda', tipo: 'inimigo', folder: 'Capítulo 1' }));
  expect(result[1].id).toBe('two');
});

test('arquivo corrompido não é substituído ao tentar salvar', () => {
  localStorage.setItem(ESPIRAL_ENCOUNTERS_KEY, '{bad');
  expect(() => writeEspiralEncounter(localStorage, createEspiralEncounter('npc', 'one'))).toThrow();
  expect(localStorage.getItem(ESPIRAL_ENCOUNTERS_KEY)).toBe('{bad');
});

test('limita atributos, graus e estados às escalas do ESPIRAL', () => {
  const result = normalizeEspiralEncounter({ ...createEspiralEncounter('npc', 'one'), attributes: { pulso: 99, sentido: -1 }, resources: { Armas: 10 }, integrity: 999, sanity: -1, hope: 100, pressure: 999 });
  expect(result.attributes.pulso).toBe(5);
  expect(result.attributes.sentido).toBe(1);
  expect(result.resources.Armas).toBe(4);
  expect(result.integrity).toBe(50);
  expect(result.sanity).toBe(0);
  expect(result.hope).toBe(10);
  expect(result.pressure).toBe(20);
});

test('rolagem usa grau de Recurso, dado de Atributo e pressão conforme a ficha ESPIRAL', () => {
  const sheet = createEspiralEncounter('inimigo', 'one');
  sheet.resources.Armas = 2;
  sheet.pressure = 2;
  const die = jest.fn(sides => sides);
  const result = rollEspiralEncounter(sheet, 'pulso', 'Armas', 4, die);
  expect(result.dice).toEqual([6, 6, 6]);
  expect(result.pressure).toEqual([6, 6]);
  expect(result.outcome).toBe('Sucesso');
  expect(result.mastery).toBe(true);
  const mental = rollEspiralEncounter({ ...sheet, sanity: 0 }, 'razao', 'Controle Mental', 4, die);
  expect(mental.pressure).toHaveLength(3);
});
