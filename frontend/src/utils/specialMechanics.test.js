import { applyMechanicAction as act, emptyMechanics, normalizeMechanics } from './specialMechanics';
const setup = (kind = 'towerDefense', config = {}) => act(emptyMechanics(), { type: 'create', kind, config, id: 'event-1' });
const send = (state, type, extra = {}) => act(state, { type, id: 'event-1', ...extra });
const event = state => state.events[0];

test('preparações persistem isoladas e apenas um evento pode estar em andamento', () => {
  const prepared = setup();
  expect(prepared.activeId).toBeNull();
  expect(event(prepared).status).toBe('prepared');
  const second = act(prepared, { type: 'create', kind: 'custom', id: 'event-2' });
  const running = send(second, 'start');
  expect(() => act(running, { type: 'start', id: 'event-2' })).toThrow('Encerre');
  expect(() => send(running, 'remove')).toThrow('Encerre');
  expect(() => send(send(running, 'pause'), 'wave')).toThrow('retome');
  expect(event(send(send(running, 'pause'), 'resume')).status).toBe('active');
  expect(event(prepared).status).toBe('prepared');
});

test('Tower Defense só avança após resolver inimigos e recompensa cada onda uma vez', () => {
  let state = send(setup('towerDefense', { waves: 2, enemies: 1, growth: 0, reward: 3 }), 'start');
  state = send(state, 'wave');
  expect(() => send(state, 'wave')).toThrow('Conclua');
  expect(() => send(state, 'completeWave')).toThrow('Resolva');
  state = send(send(state, 'kill'), 'completeWave');
  expect(event(state).tower.resources).toBe(13);
  expect(() => send(state, 'completeWave')).toThrow('Resolva');
  state = send(send(send(state, 'wave'), 'breach'), 'completeWave');
  expect(event(state)).toMatchObject({ status: 'victory', tower: { health: 19, resources: 16, wave: 2 } });
  expect(() => send(state, 'wave')).toThrow('Inicie');
});

test('invasores destroem a base e defesas debitam recursos sem reembolso', () => {
  let state = send(setup('towerDefense', { health: 2, breachDamage: 2, resources: 5, defenseCost: 5 }), 'start');
  state = send(state, 'build', { name: 'Portão' });
  expect(event(state).tower).toMatchObject({ resources: 0, defenses: [{ name: 'Portão' }] });
  expect(() => send(state, 'build')).toThrow('insuficientes');
  state = send(state, 'destroyDefense', { key: event(state).tower.defenses[0].id });
  expect(event(state).tower).toMatchObject({ resources: 0, defenses: [] });
  state = send(send(state, 'wave'), 'breach');
  expect(event(state)).toMatchObject({ status: 'defeat', tower: { health: 0 } });
});

test.each([['progress', 'victory'], ['danger', 'defeat']])('desafio termina quando %s atinge sua meta', (key, outcome) => {
  let state = send(setup('challenge', { target: 1, danger: 1 }), 'start');
  state = send(state, 'counter', { key, delta: 1 });
  expect(event(state).status).toBe(outcome);
});

test('mecânica personalizada limita contadores e acompanha objetivos e histórico', () => {
  let state = send(setup('custom', { counters: 'Oxigênio:5\nResgate:3', objectives: 'Salvar os civis\nSair do local' }), 'start');
  state = send(state, 'counter', { key: 'counter-0', delta: 99 });
  expect(event(state).counters[0].value).toBe(5);
  state = send(state, 'counter', { key: 'counter-0', delta: -99 });
  expect(event(state).counters[0].value).toBe(0);
  state = send(state, 'objective', { key: 'objective-0' });
  expect(event(state).objectives[0].done).toBe(true);
  expect(event(state).status).toBe('active');
  for (let i = 0; i < 45; i++) state = send(state, 'objective', { key: 'objective-0' });
  expect(event(state).log).toHaveLength(40);
  expect(event(send(state, 'finish', { outcome: 'ended' })).status).toBe('ended');
});

test('normalização compatível com campanhas antigas e validação de modelos', () => {
  expect(normalizeMechanics(null)).toEqual(emptyMechanics());
  expect(() => setup('missing')).toThrow('válida');
  expect(event(setup('towerDefense', { waves: 1000, health: -1 })).tower).toMatchObject({ health: 1 });
  expect(event(setup('towerDefense', { waves: 1000 })).tower.waves).toHaveLength(30);
});
