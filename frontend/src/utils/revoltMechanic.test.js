import { applyMechanicAction, emptyMechanics } from './specialMechanics';
import { allowedRevoltActions, breathLabel, REVOLT_FRONTS } from './revoltMechanic';
const keys = Object.keys(REVOLT_FRONTS);
const send = (state, type, extra = {}, random = () => 0) => applyMechanicAction(state, { id: 'revolt', type, ...extra }, '2026-11-01T12:00:00Z', random);
const r = state => state.events[0].revolt;
function setup() {
  return send(send(emptyMechanics(), 'create', { kind: 'revolt', config: { name: 'Brasília' }, id: 'revolt' }), 'start');
}
function lock(state, plans = {}) {
  for (const key of keys) state = send(state, 'revoltPlan', { front: key, plan: plans[key] || { type: 'regroup' } });
  return send(state, 'revoltLock');
}
const lead = { type: 'advance', mode: 'lead' };
const personal = { type: 'advance', mode: 'personal' };
function distribute(state) {
  for (const reward of r(state).rewards.filter(item => !item.used)) {
    const target = keys.find(key => key !== reward.source && (reward.type === 'breath' || r(state).fronts[key].position < 4));
    state = send(state, 'revoltReward', { reward: reward.id, ...(target ? { target } : { skip: true }) });
  }
  return state;
}

test('inicia três rotas de quatro posições, Fôlego 4 e sem modificar Integridade', () => {
  const state = setup();
  expect(r(state)).toMatchObject({ round: 1, phase: 'planning' });
  for (const front of Object.values(r(state).fronts)) expect(front).toMatchObject({ position: 0, breath: 4, bonus: 0, finalDone: false });
  expect(r(state).fronts.popular.route).toHaveLength(4);
  expect(state.events[0]).not.toHaveProperty('integridade');
});

test.each([[4, 4, 5, 1, 4], [4, 2, 3, 1, 3], [3, 2, 2, 0, 2], [1, 1, 1, 0, 0]])('liderar com Fôlego %s e d6 %s resulta em %s', (breath, die, total, position, remainingBreath) => {
  let state = setup();
  r(state).fronts.popular.breath = breath;
  state = lock(state, { popular: lead });
  state = send(state, 'revoltResolve', { front: 'popular', die });
  expect(r(state).results.popular.total).toBe(total);
  expect(r(state).fronts.popular).toMatchObject({ position, breath: remainingBreath });
  expect(() => send(state, 'revoltResolve', { front: 'popular', die })).toThrow('já foi resolvida');
});

test('trava as três escolhas e calcula modificadores com o estado simultâneo', () => {
  let state = setup();
  expect(() => send(state, 'revoltLock')).toThrow('ação permitida');
  state = send(state, 'revoltFortify', { front: 'popular' });
  state = lock(state, { popular: lead, communications: { type: 'support', target: 'popular' } });
  expect(r(state).fronts.supplies.breath).toBe(5);
  state = send(state, 'revoltResolve', { front: 'popular', die: 4 });
  expect(r(state).results.popular).toMatchObject({ die: 4, organization: 1, support: 1, fortification: -1, total: 5 });
  expect(r(state).fronts.popular.fortified).toEqual([]);
  expect(() => send(state, 'revoltPlan', { front: 'popular', plan: lead })).toThrow('etapa');
});

test('dois Apoios para o mesmo teste são recusados e os bônus reservados não acumulam', () => {
  let state = setup();
  expect(() => lock(state, { popular: lead, communications: { type: 'support', target: 'popular' }, supplies: { type: 'support', target: 'popular' } })).toThrow('no máximo uma');
  r(state).fronts.popular.bonus = 2;
  state = lock(state, { popular: lead, communications: { type: 'support', target: 'popular' } });
  state = send(state, 'revoltResolve', { front: 'popular', die: 3 });
  expect(r(state).results.popular).toMatchObject({ support: 1, total: 5 });
  expect(r(state).fronts.popular.bonus).toBe(2);
});

test('Fôlego zero impede avançar e apoiar, Reorganizar respeita máximo 6', () => {
  let state = setup();
  r(state).fronts.popular.breath = 0;
  r(state).fronts.communications.breath = 6;
  expect(allowedRevoltActions(r(state), 'popular')).toEqual(['regroup']);
  expect(() => send(state, 'revoltPlan', { front: 'popular', plan: lead })).toThrow('ação permitida');
  state = lock(state);
  expect(r(state).fronts.popular.breath).toBe(1);
  expect(r(state).fronts.communications.breath).toBe(6);
  expect([0, 1, 2, 4].map(breathLabel)).toEqual(['Imobilizada', 'Por um fio', 'Desgastada', 'Organizada']);
});

test('intervenção pessoal avança sem rolagem nem gasto de bônus; recuar perde Fôlego', () => {
  let state = setup();
  r(state).fronts.popular.bonus = 1;
  state = lock(state, { popular: personal, communications: personal });
  const random = jest.fn();
  state = send(state, 'revoltResolve', { front: 'popular', success: true }, random);
  expect(random).not.toHaveBeenCalled();
  expect(r(state).fronts.popular).toMatchObject({ position: 1, breath: 4, bonus: 1 });
  state = send(state, 'revoltResolve', { front: 'communications', success: false });
  expect(r(state).fronts.communications).toMatchObject({ position: 0, breath: 3 });
});

test('benefício da segunda posição é concedido uma única vez, após resolver as três frentes', () => {
  let state = setup();
  r(state).fronts.popular.position = 1;
  r(state).fronts.communications.breath = 0;
  state = lock(state, { popular: personal, supplies: personal });
  state = send(state, 'revoltResolve', { front: 'popular', success: true });
  const reward = r(state).rewards[0].id;
  expect(() => send(state, 'revoltReward', { reward, target: 'communications' })).toThrow('Resolva as três');
  state = send(state, 'revoltResolve', { front: 'supplies', success: true });
  expect(() => send(state, 'revoltRoundEnd')).toThrow('Distribua');
  expect(() => send(state, 'revoltReward', { reward, target: 'popular' })).toThrow('outra frente');
  state = send(state, 'revoltReward', { reward, target: 'communications' });
  expect(r(state).fronts.communications.breath).toBe(2);
  expect(() => send(state, 'revoltReward', { reward, target: 'communications' })).toThrow('já foi distribuído');
  state = send(state, 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'counterattack', front: 'popular' });
  state = lock(state, { popular: { type: 'retreat' } });
  state = send(state, 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'reinforcements', front: 'popular' });
  state = lock(state, { popular: personal });
  state = send(state, 'revoltResolve', { front: 'popular', success: true });
  expect(r(state).rewards).toHaveLength(1);
});

test.each(['communications', 'supplies'])('bônus de %s é reservado e consumido no próximo teste, sem ultrapassar +1', source => {
  let state = setup();
  r(state).fronts[source].position = 1;
  state = lock(state, { [source]: personal });
  state = send(state, 'revoltResolve', { front: source, success: true });
  state = send(state, 'revoltReward', { reward: r(state).rewards[0].id, target: 'popular' });
  state = send(state, 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'reinforcements', front: 'supplies' });
  state = lock(state, { popular: lead });
  state = send(state, 'revoltResolve', { front: 'popular', die: 3 });
  expect(r(state).results.popular).toMatchObject({ support: 1, total: 5 });
  expect(r(state).fronts.popular.bonus).toBe(0);
});

test('só uma reação é anunciada por rodada e bloqueio dura apenas a rodada seguinte', () => {
  let state = send(lock(setup()), 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'blackout', front: 'popular' });
  expect(() => send(state, 'revoltReaction', { reaction: 'reinforcements', front: 'supplies' })).toThrow('etapa');
  expect(() => send(state, 'revoltPlan', { front: 'popular', plan: { type: 'support', target: 'supplies' } })).toThrow('ação permitida');
  expect(() => send(state, 'revoltPlan', { front: 'supplies', plan: { type: 'support', target: 'popular' } })).toThrow('bloqueadas');
  r(state).fronts.popular.bonus = 1;
  state = lock(state, { popular: lead });
  state = send(state, 'revoltResolve', { front: 'popular', die: 3 });
  expect(r(state).results.popular.support).toBe(0);
  expect(r(state).fronts.popular.bonus).toBe(1);
  state = send(state, 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'reinforcements', front: 'supplies' });
  expect(allowedRevoltActions(r(state), 'popular')).toContain('support');
});

test.each([true, false])('contra-ataque exige defesa ou recuo e defesa %s resolve com resultado da cena', success => {
  let state = setup();
  r(state).fronts.popular.position = 4;
  state = send(lock(state), 'revoltRoundEnd');
  state = send(state, 'revoltReaction', { reaction: 'counterattack', front: 'popular' });
  expect(allowedRevoltActions(r(state), 'popular')).toEqual(['defend', 'retreat']);
  state = lock(state, { popular: { type: 'defend' } });
  state = send(state, 'revoltResolve', { front: 'popular', success });
  expect(r(state).fronts.popular.position).toBe(success ? 4 : 3);
  expect(r(state).fronts.popular.breath).toBe(5);
});

test('quem chega primeiro mantém acesso, pode apoiar e não avança além de quatro', () => {
  const state = setup();
  r(state).fronts.popular.position = 4;
  expect(allowedRevoltActions(r(state), 'popular')).toEqual(['regroup', 'support']);
  expect(() => send(state, 'revoltPlan', { front: 'popular', plan: lead })).toThrow('ação permitida');
});

test('vitória exige os três acessos e os três objetivos finais, com histórico preservado', () => {
  let state = setup();
  expect(() => send(state, 'finish', { outcome: 'victory' })).toThrow('três objetivos');
  expect(() => send(state, 'revoltFinal', { front: 'popular', success: true })).toThrow('etapa');
  for (let round = 1; round <= 4; round++) {
    state = lock(state, Object.fromEntries(keys.map(key => [key, personal])));
    for (const front of keys) state = send(state, 'revoltResolve', { front, success: true });
    state = send(distribute(state), 'revoltRoundEnd');
    if (round < 4) state = send(state, 'revoltReaction', { reaction: 'reinforcements', front: 'popular' });
  }
  expect(r(state).phase).toBe('final');
  expect(r(state).history).toHaveLength(4);
  for (const front of ['popular', 'communications']) state = send(state, 'revoltFinal', { front, success: true });
  state = send(state, 'revoltFinal', { front: 'supplies', success: false });
  expect(state.events[0].status).toBe('active');
  state = send(state, 'revoltFinal', { front: 'supplies', success: true });
  expect(state.events[0].status).toBe('victory');
  expect(r(state).phase).toBe('victory');
});

test('renomear mantém progresso e pausa impede resolver a operação', () => {
  let state = setup();
  state = send(state, 'revoltRename', { fronts: { popular: { team: 'Lia e Ellie', route: ['Local A', 'Local B', 'Local C', 'Sede'] } } });
  expect(r(state).fronts.popular).toMatchObject({ team: 'Lia e Ellie', position: 0, breath: 4 });
  state = send(state, 'pause');
  expect(() => send(state, 'revoltPlan', { front: 'popular', plan: lead })).toThrow('retome');
});

test('valida dados manuais e permite rolagem aleatória determinística', () => {
  const state = lock(setup(), { popular: lead });
  expect(() => send(state, 'revoltResolve', { front: 'popular', die: 7 })).toThrow('entre 1 e 6');
  expect(() => send(state, 'revoltResolve', { front: 'popular', die: 2.5 })).toThrow('inteiro');
  const result = send(state, 'revoltResolve', { front: 'popular' }, () => .99);
  expect(r(result).results.popular.die).toBe(6);
  expect(r(state).results.popular).toBeUndefined();
});
