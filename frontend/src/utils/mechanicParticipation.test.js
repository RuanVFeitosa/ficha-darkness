import { applyMechanicAction, emptyMechanics } from './specialMechanics';
import { applyParticipantMechanicAction as play, validateMechanicAssignments } from './mechanicParticipation';
import { criarBaseV1 } from '../data/absolutoV1';
const actor = { id: 'lia', name: 'Lia' };
const sheet = criarBaseV1({ forca: 2, fonitude: 2, inteligencia: 3, vontade: 2, reflexos: 2 }, { razao: 3 });
const send = (state, type, rest = {}) => applyMechanicAction(state, { id: 'revolt', type, ...rest });
function setup() {
  const state = send(emptyMechanics(), 'create', { kind: 'revolt', config: { difficulty: 2, fronts: { popular: { players: ['lia', 'ellie'], difficulty: 2, sheet: { atributos: { inteligencia: 3 }, dominios: { razao: 3 } } }, communications: { players: ['joao'] } } } });
  return send(state, 'start');
}
function lock(state, mode = 'personal') {
  state = send(state, 'revoltPlan', { front: 'popular', plan: { type: 'advance', mode } });
  for (const front of ['communications', 'supplies']) state = send(state, 'revoltPlan', { front, plan: { type: 'regroup' } });
  return send(state, 'revoltLock');
}
test('somente fichas da campanha podem ser designadas e uma ficha não pertence a duas frentes', () => {
  expect(() => validateMechanicAssignments({ popular: { players: ['lia'] } }, [{ ficha_id: 'lia' }])).not.toThrow();
  expect(() => validateMechanicAssignments({ popular: { players: ['outro'] } }, [{ ficha_id: 'lia' }])).toThrow('vinculadas');
  expect(() => validateMechanicAssignments({ popular: { players: ['lia'] }, supplies: { players: ['darkness:lia'] } }, [{ ficha_id: 'lia' }])).toThrow('única frente');
});
test('jogador escolhe a própria ação sem poder agir por outro grupo ou administrar a rodada', () => {
  const state = setup();
  const next = play(state, { id: 'revolt', type: 'revoltGroupAction', front: 'popular', choice: 'regroup' }, actor);
  expect(next.events[0].revolt.plans.popular).toMatchObject({ type: 'regroup', actorId: 'lia' });
  expect(() => play(state, { id: 'revolt', type: 'revoltPlan', front: 'communications', plan: { type: 'regroup' } }, actor)).toThrow('designado');
  expect(() => play(state, { id: 'revolt', type: 'revoltLock', front: 'popular' }, actor)).toThrow('mestre');
  expect(() => play(state, { id: 'revolt', type: 'revoltResolve', front: 'popular' }, { id: 'outsider' })).toThrow('designado');
});
test('dado coletivo é gerado pela rolagem e ignora faces escolhidas pelo jogador', () => {
  const next = play(lock(setup(), 'lead'), { id: 'revolt', type: 'revoltResolve', front: 'popular', die: 6, success: true }, actor, sheet, undefined, () => 0);
  expect(next.events[0].revolt.results.popular).toMatchObject({ test: { dados: [1, 1, 1], source: 'group', sucesso: false }, actorId: 'lia' });
  expect(next.events[0].revolt.fronts.popular.position).toBe(0);
});
test('teste usa a ficha pronta e a DT da frente, ignorando a ficha pessoal e sucesso manual', () => {
  const initialHope = sheet.esperanca.atual;
  const state = lock(setup());
  expect(play(state, { id: 'revolt', type: 'revoltResolve', front: 'popular', success: true }, actor, sheet, undefined, () => 0).events[0].revolt.results.popular.test.sucesso).toBe(false);
  const next = play(state, { id: 'revolt', type: 'revoltTest', front: 'popular', testKind: 'domain', testKey: 'razao' }, actor, sheet, undefined, () => .9);
  expect(next.events[0].revolt.results.popular.test).toMatchObject({ dt: 2, dados: [6, 6, 6], exitos: 3, sucesso: true });
  expect(next.events[0].revolt.fronts.popular.position).toBe(1);
  expect(sheet.esperanca.atual).toBe(initialHope);
  expect(() => play(next, { id: 'revolt', type: 'revoltTest', front: 'popular', testKind: 'domain', testKey: 'razao' }, { id: 'ellie' }, sheet)).toThrow('pendente');
});
test('falha pessoal gera desgaste; Atributo também é uma escolha válida', () => {
  const next = play(lock(setup()), { id: 'revolt', type: 'revoltTest', front: 'popular', testKind: 'attribute', testKey: 'inteligencia' }, actor, sheet, undefined, () => .5);
  expect(next.events[0].revolt.results.popular.test).toMatchObject({ dt: 2, dados: [4, 4, 4], sucesso: false });
  expect(next.events[0].revolt.fronts.popular).toMatchObject({ position: 0, breath: 3 });
});
test('DT e designação ficam travadas após as escolhas, sem mudar dificuldade de cena', () => {
  const state = lock(setup());
  expect(state.events[0].revolt.snapshot.popular.difficulty).toBe(2);
  expect(() => send(state, 'revoltRename', { fronts: { popular: { difficulty: 5 } } })).toThrow('antes das escolhas');
  expect(() => send(state, 'revoltRename', { fronts: { popular: { players: ['outro'] } } })).toThrow('antes das escolhas');
  expect(() => send(state, 'difficulty', { value: 5 })).toThrow('antes das escolhas');
});
test('pausa bloqueia escolhas e rolagens do jogador', () => {
  const state = send(lock(setup()), 'pause');
  expect(() => play(state, { id: 'revolt', type: 'revoltTest', front: 'popular', testKind: 'domain', testKey: 'razao' }, actor, sheet)).toThrow('retomar');
});
test('objetivo final usa teste real e só os três sucessos encerram a operação', () => {
  const state = setup();
  const r = state.events[0].revolt;
  r.phase = 'final';
  for (const front of Object.values(r.fronts)) { front.position = 4; front.finalDone = true; }
  r.fronts.popular.finalDone = false;
  const failure = play(state, { id: 'revolt', type: 'revoltFinalTest', front: 'popular', testKind: 'domain', testKey: 'razao' }, actor, sheet, undefined, () => 0);
  expect(failure.events[0].status).toBe('active');
  const success = play(failure, { id: 'revolt', type: 'revoltFinalTest', front: 'popular', testKind: 'domain', testKey: 'razao' }, actor, sheet, undefined, () => .99);
  expect(success.events[0].status).toBe('victory');
  expect(success.events[0].revolt.fronts.popular.finalTest.test.dt).toBe(2);
});
