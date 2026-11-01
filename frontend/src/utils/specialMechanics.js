import { applyRevoltAction, createRevolt } from './revoltMechanic';

export const MECHANIC_TYPES = {
  revolt: { name: 'Revolta', description: 'Três frentes simultâneas por Brasília: conquiste os acessos à sede e derrube o comando.' },
  towerDefense: { name: 'Tower Defense', description: 'Proteja uma base, construa defesas e resista a ondas de inimigos.' },
  challenge: { name: 'Desafio de progresso', description: 'Perseguições, rituais, fugas e desafios com progresso e perigo.' },
  custom: { name: 'Personalizada', description: 'Defina regras, objetivos e contadores para uma situação especial.' },
};
export const MECHANIC_STATUS = { prepared: 'Preparada', active: 'Em andamento', paused: 'Pausada', victory: 'Vitória', defeat: 'Derrota', ended: 'Encerrada' };
export const emptyMechanics = () => ({ version: 1, revision: 0, events: [], activeId: null });
export function normalizeMechanics(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.events)) return emptyMechanics();
  return { ...value, revision: Number(value.revision) || 0 };
}
const integer = (value, min = 0, max = 9999) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
const text = (value, max = 2000) => String(value || '').trim().slice(0, max);
const finished = event => ['victory', 'defeat', 'ended'].includes(event.status);
export function createMechanic(type, config = {}, id = `mechanic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`) {
  if (!Object.hasOwn(MECHANIC_TYPES, type)) throw new Error('Escolha uma mecânica válida.');
  const event = { id, type, name: text(config.name, 100) || MECHANIC_TYPES[type].name, rules: text(config.rules), sceneId: config.sceneId || null, status: 'prepared', objectives: text(config.objectives).split('\n').filter(Boolean).slice(0, 12).map((label, i) => ({ id: `objective-${i}`, label, done: false })), log: [] };
  event.difficulty = integer(config.difficulty ?? 1, 1, 5);
  if (type === 'revolt') {
    event.revolt = createRevolt(config);
  } else if (type === 'towerDefense') {
    const health = integer(config.health ?? 20, 1);
    const waveCount = integer(config.waves ?? 3, 1, 30);
    event.tower = { health, maxHealth: health, resources: integer(config.resources ?? 10), wave: 0, waveActive: false, remaining: 0, reward: integer(config.reward ?? 5), breachDamage: integer(config.breachDamage ?? 1, 1), waves: Array.from({ length: waveCount }, (_, i) => ({ name: `Onda ${i + 1}`, enemies: integer(config.enemies ?? 5, 1, 100) + i * integer(config.growth ?? 2, 0, 20) })), defenseCost: integer(config.defenseCost ?? 5, 1), defenses: [] };
  } else {
    event.counters = type === 'challenge'
      ? [{ id: 'progress', label: 'Progresso', value: 0, max: integer(config.target ?? 6, 1) }, { id: 'danger', label: 'Perigo', value: 0, max: integer(config.danger ?? 4, 1) }]
      : text(config.counters || 'Progresso:6').split('\n').filter(Boolean).slice(0, 8).map((line, i) => { const [label, max] = line.split(':'); return { id: `counter-${i}`, label: text(label, 60) || 'Contador', value: 0, max: integer(max || 6, 1) }; });
  }
  return event;
}
export function applyMechanicAction(input, action, now = new Date().toISOString(), random = Math.random) {
  const state = normalizeMechanics(input);
  let events = state.events.map(event => JSON.parse(JSON.stringify(event)));
  let activeId = state.activeId;
  if (action.type === 'create') {
    if (events.length >= 30) throw new Error('Limite de 30 mecânicas. Remova uma encerrada para preparar outra.');
    events.push(createMechanic(action.kind, action.config, action.id));
  } else {
    const event = events.find(item => item.id === action.id);
    if (!event) throw new Error('Mecânica não encontrada. Atualize o painel.');
    if (action.type === 'remove') {
      if (['active', 'paused'].includes(event.status)) throw new Error('Encerre a mecânica antes de removê-la.');
      events = events.filter(item => item.id !== event.id);
      if (activeId === event.id) activeId = null;
    } else {
      let message = '';
      if (action.type === 'difficulty' && !finished(event)) {
        if (event.revolt && (event.revolt.phase !== 'planning' || Object.keys(event.revolt.plans).length)) throw new Error('Defina as DTs antes das escolhas da rodada.');
        event.difficulty = integer(action.value, 1, 5); message = `DT da mecânica: ${event.difficulty}.`;
      } else if (action.type === 'revoltRename' && event.type === 'revolt' && ['prepared', 'active', 'paused'].includes(event.status)) {
        message = applyRevoltAction(event, action, random);
      } else if (action.type === 'start') {
        if (event.status !== 'prepared') throw new Error('Esta mecânica já foi iniciada.');
        if (events.some(item => ['active', 'paused'].includes(item.status))) throw new Error('Encerre a mecânica em andamento antes de iniciar outra.');
        event.status = 'active'; activeId = event.id; message = 'Mecânica iniciada.';
      } else if (action.type === 'pause' && event.status === 'active') {
        event.status = 'paused'; message = 'Mecânica pausada.';
      } else if (action.type === 'resume' && event.status === 'paused') {
        event.status = 'active'; message = 'Mecânica retomada.';
      } else if (action.type === 'finish' && ['active', 'paused'].includes(event.status)) {
        if (!['victory', 'defeat', 'ended'].includes(action.outcome)) throw new Error('Escolha um resultado válido.');
        if (event.type === 'revolt' && action.outcome === 'victory') throw new Error('Cumpra os três objetivos finais para concluir a Revolta.');
        event.status = action.outcome; message = MECHANIC_STATUS[event.status];
      } else {
        if (event.status !== 'active' || activeId !== event.id) throw new Error('Inicie ou retome a mecânica para alterar seu estado.');
        if (event.type === 'revolt' && action.type.startsWith('revolt')) {
          message = applyRevoltAction(event, action, random);
        } else if (action.type === 'objective') {
          const objective = event.objectives.find(item => item.id === action.key);
          if (!objective) throw new Error('Objetivo não encontrado.');
          objective.done = !objective.done; message = `${objective.done ? 'Concluído' : 'Reaberto'}: ${objective.label}`;
        } else if (action.type === 'counter') {
          const counter = event.counters?.find(item => item.id === action.key);
          if (!counter) throw new Error('Contador não encontrado.');
          counter.value = integer(counter.value + integer(action.delta, -9999), 0, counter.max);
          message = `${counter.label}: ${counter.value}/${counter.max}`;
          if (event.type === 'challenge') {
            if (event.counters.find(item => item.id === 'danger').value >= event.counters.find(item => item.id === 'danger').max) event.status = 'defeat';
            else if (event.counters.find(item => item.id === 'progress').value >= event.counters.find(item => item.id === 'progress').max) event.status = 'victory';
          }
        } else if (event.type === 'towerDefense') {
          const tower = event.tower;
          switch (action.type) {
            case 'wave':
              if (tower.waveActive || tower.wave >= tower.waves.length) throw new Error('Conclua a onda atual antes de iniciar outra.');
              tower.remaining = tower.waves[tower.wave].enemies; tower.wave += 1; tower.waveActive = true; message = `Onda ${tower.wave} iniciada: ${tower.remaining} inimigos.`; break;
            case 'kill': case 'breach':
              if (!tower.waveActive || tower.remaining <= 0) throw new Error('Não há inimigos pendentes nesta onda.');
              tower.remaining -= 1;
              if (action.type === 'breach') tower.health = Math.max(0, tower.health - tower.breachDamage);
              message = action.type === 'breach' ? `Inimigo atravessou a defesa: −${tower.breachDamage} de integridade.` : 'Inimigo derrotado.';
              if (!tower.health) event.status = 'defeat';
              break;
            case 'completeWave':
              if (!tower.waveActive || tower.remaining) throw new Error('Resolva todos os inimigos antes de concluir a onda.');
              tower.waveActive = false; tower.resources = integer(tower.resources + tower.reward);
              message = `Onda ${tower.wave} concluída. +${tower.reward} recursos.`;
              if (tower.wave === tower.waves.length) event.status = 'victory';
              break;
            case 'build':
              if (tower.resources < tower.defenseCost) throw new Error('Recursos insuficientes para construir.');
              if (tower.defenses.length >= 50) throw new Error('Limite de 50 defesas.');
              tower.resources -= tower.defenseCost;
              tower.defenses.push({ id: `defense-${state.revision + 1}`, name: text(action.name, 80) || `Defesa ${tower.defenses.length + 1}` });
              message = `Defesa construída. −${tower.defenseCost} recursos.`; break;
            case 'destroyDefense':
              if (!tower.defenses.some(item => item.id === action.key)) throw new Error('Defesa não encontrada.');
              tower.defenses = tower.defenses.filter(item => item.id !== action.key); message = 'Defesa destruída (sem reembolso).'; break;
            case 'resource': tower.resources = integer(tower.resources + integer(action.delta, -9999)); message = `Recursos: ${tower.resources}`; break;
            default: throw new Error('Ação não disponível.');
          }
        } else throw new Error('Ação não disponível.');
      }
      if (finished(event)) message += ` · ${MECHANIC_STATUS[event.status]}`;
      event.log = [{ at: now, message }, ...event.log].slice(0, 40);
    }
  }
  return { ...state, events, activeId, revision: state.revision + 1 };
}
