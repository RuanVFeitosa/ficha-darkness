import { adaptarParaDarkness, estagioAbsolutoParaDarkness } from './adaptarParaDarkness';
import { isProtocolSheet } from '../data/protocoloDarkness';
import { freshSheet } from '../data/espiral';

test('adapta Espiral preservando recursos, equipamentos, habilidades e a origem', () => {
  const original = { ...freshSheet(), name: 'Jorge', weapons: [{ id: 'arma', damage: '2d6' }], evolution: { points: 4, abilities: [{ id: 'poder', level: 2 }] } };
  const adapted = adaptarParaDarkness(original, 'espiral', 'jorge');
  expect(isProtocolSheet(adapted)).toBe(true);
  expect(adapted.weapons).toEqual(original.weapons);
  expect(adapted.evolution).toEqual(original.evolution);
  expect(adapted.adaptationSource).toEqual({ sistema: 'espiral', fichaId: 'jorge', original });
  expect(original.ruleset).toBeUndefined();
});
test('adapta atributos numéricos ou estruturados do Absoluto', () => {
  const original = { nome: 'Ellie', nomeJogador: 'Ruan', atributos: { forca: { atual: 5 }, fonitude: 2, inteligencia: 3, reflexos: 1, vontade: 4 }, inventario: [{ nome: 'Lanterna' }] };
  const adapted = adaptarParaDarkness(original, 'absoluto', 'ellie');
  expect(isProtocolSheet(adapted)).toBe(true);
  expect(adapted).toMatchObject({ name: 'Ellie', player: 'Ruan', attributes: { pulso: 4, razao: 3, sentido: 2, voz: 3 } });
  expect(adapted.inventory).toContain('Lanterna');
  expect(original.atributos.forca).toEqual({ atual: 5 });
});

 test.each([[0,1],[1,2],[2,2],[3,3],[4,3],[5,4]])('converte atributo %s do Absoluto para estágio %s', (score, stage) => { expect(estagioAbsolutoParaDarkness(score)).toBe(stage); });
 test('todos os atributos máximos não geram d12', () => { const result = adaptarParaDarkness({ atributos: { forca: 5, fonitude: 5, inteligencia: 5, reflexos: 5, vontade: 5 } }, 'absoluto', 'teste'); expect(Object.values(result.attributes)).toEqual([4,4,4,4]); });

