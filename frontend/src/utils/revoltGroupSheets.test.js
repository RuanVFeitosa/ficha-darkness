import { revoltGroupSheet } from './revoltGroupSheets';
import { applyMechanicAction, emptyMechanics } from './specialMechanics';
import { applyParticipantMechanicAction } from './mechanicParticipation';
const keys = ['popular', 'communications', 'supplies'];
function state() {
  return applyMechanicAction(applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'revolt', id: 'r', config: { fronts: Object.fromEntries(keys.map(key => [key, { players: [key] }])) } }), { id: 'r', type: 'start' });
}
const act = (state, key, choice, random, target) => applyParticipantMechanicAction(state, { id: 'r', type: 'revoltGroupAction', front: key, choice, target }, { id: key, name: key }, { atributos: { vontade: 5, inteligencia: 5 } }, undefined, random);
test('modelos distintos estão prontos e valores inválidos são normalizados', () => {
  expect(revoltGroupSheet(null, 'popular')).toMatchObject({ atributos: { vontade: 3 }, dominios: { influencia: 2 } });
  expect(revoltGroupSheet(null, 'communications')).toMatchObject({ atributos: { inteligencia: 3 }, dominios: { razao: 2 } });
  expect(revoltGroupSheet(null, 'supplies')).toMatchObject({ atributos: { fonitude: 3 }, dominios: { vigor: 2 } });
  expect(revoltGroupSheet({ sheet: { atributos: { vontade: 999 }, dominios: { influencia: -5 } } }, 'popular')).toMatchObject({ atributos: { vontade: 5 }, dominios: { influencia: 0 } });
});
test('todas as ações são testadas com a ficha pronta e resolvidas simultaneamente', () => {
  let current = state();
  current = act(current, 'popular', 'advance', () => .99);
  current = act(current, 'communications', 'support', () => .99, 'popular');
  current = act(current, 'supplies', 'regroup', () => .99);
  expect(current.events[0].revolt.fronts.popular.position).toBe(0);
  expect(current.events[0].revolt.fronts.supplies.breath).toBe(4);
  const resolved = applyMechanicAction(current, { id: 'r', type: 'revoltLock' });
  expect(resolved.events[0].revolt.fronts.popular).toMatchObject({ position: 1, breath: 4, bonus: 1 });
  expect(resolved.events[0].revolt.fronts.supplies.breath).toBe(5);
  expect(resolved.events[0].revolt.results.communications.test.source).toBe('group');
});
test('falhas em reorganização e apoio não concedem seus benefícios', () => {
  let current = state();
  current = act(current, 'popular', 'regroup', () => 0);
  current = act(current, 'communications', 'support', () => 0, 'supplies');
  current = act(current, 'supplies', 'advance', () => 0);
  const resolved = applyMechanicAction(current, { id: 'r', type: 'revoltLock' });
  expect(resolved.events[0].revolt.fronts.popular.breath).toBe(4);
  expect(resolved.events[0].revolt.fronts.supplies).toMatchObject({ breath: 3, position: 0, bonus: 0 });
});
test('não é possível descartar ou repetir um teste para buscar outro resultado', () => {
  const current = act(state(), 'popular', 'advance', () => 0);
  expect(() => act(current, 'popular', 'advance', () => .99)).toThrow('já escolheu');
  expect(() => applyParticipantMechanicAction(current, { id: 'r', type: 'revoltPlan', front: 'popular', clear: true }, { id: 'popular' })).toThrow('já foi realizado');
  expect(() => applyMechanicAction(current, { id: 'r', type: 'revoltRename', fronts: { popular: { sheet: { atributos: { vontade: 5 } } } } })).toThrow('antes das escolhas');
});
test('dois apoios não travam a rodada com testes que já foram realizados', () => {
  const current = act(state(), 'communications', 'support', () => .99, 'popular');
  const random = jest.fn(() => .99);
  expect(() => act(current, 'supplies', 'support', random, 'popular')).toThrow('já escolheu apoiar');
  expect(random).not.toHaveBeenCalled();
});
