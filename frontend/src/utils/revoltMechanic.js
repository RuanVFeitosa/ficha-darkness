import { revoltGroupSheet } from './revoltGroupSheets';
export const REVOLT_FRONTS = {
  popular: { name: 'Popular', route: ['Bairro mobilizado', 'Avenida bloqueada', 'Praça ocupada', 'Acesso principal'], benefit: 'Voluntários: outra frente recupera 1 de Fôlego.', objective: 'Abrir os portões e proteger a entrada da população.' },
  communications: { name: 'Comunicações', route: ['Estação clandestina', 'Central de transmissão', 'Centro de vigilância', 'Acesso lateral'], benefit: 'Posições militares reveladas: +1 no próximo teste de avanço de outra frente.', objective: 'Tomar a transmissão e anunciar a queda do comando.' },
  supplies: { name: 'Suprimentos', route: ['Ponto de encontro', 'Depósito militar', 'Garagem de veículos', 'Acesso de serviço'], benefit: 'Equipamentos capturados: +1 no próximo teste de avanço de outra frente.', objective: 'Bloquear a fuga da cúpula e desarmar a segurança restante.' },
};
export const REVOLT_REACTIONS = {
  reinforcements: { name: 'Reforços', description: 'Fortifica a próxima posição da frente até ela ser conquistada.' },
  counterattack: { name: 'Contra-ataque', description: 'Na próxima rodada, a frente deve defender em uma cena ou recuar uma posição.' },
  blackout: { name: 'Bloqueio de comunicação', description: 'Na próxima rodada, a frente não pode oferecer nem receber Apoio.' },
};
export const REVOLT_ACTIONS = { advance: 'Avançar', regroup: 'Reorganizar', support: 'Apoiar', defend: 'Defender posição', retreat: 'Recuar posição' };
const keys = Object.keys(REVOLT_FRONTS);
const clean = (value, max = 100) => String(value || '').trim().slice(0, max);
export const breathLabel = breath => breath >= 4 ? 'Organizada' : breath >= 2 ? 'Desgastada' : breath === 1 ? 'Por um fio' : 'Imobilizada';
export function createRevolt(config = {}) {
  return { round: 1, phase: 'planning', reaction: null, plans: {}, results: {}, snapshot: null, rewards: [], history: [], fronts: Object.fromEntries(keys.map(key => [key, {
    position: 0, breath: 4, bonus: 0, fortified: [], milestoneClaimed: false, finalDone: false,
    team: clean(config.fronts?.[key]?.team, 200),
    players: [...new Set((config.fronts?.[key]?.players || []).map(id => clean(id, 150).replace(/^darkness:/, '')).filter(Boolean))],
    difficulty: Math.max(1, Math.min(5, Math.floor(Number(config.fronts?.[key]?.difficulty ?? config.difficulty) || 1))),
    sheet: revoltGroupSheet(config.fronts?.[key], key),
    route: REVOLT_FRONTS[key].route.map((name, index) => clean(config.fronts?.[key]?.route?.[index]) || name),
  }])) };
}
function requirePhase(revolt, phase) {
  if (revolt.phase !== phase) throw new Error('Esta ação não está disponível nesta etapa da Revolta.');
}
function frontFor(revolt, key) {
  if (!Object.hasOwn(REVOLT_FRONTS, key)) throw new Error('Escolha uma frente válida.');
  return revolt.fronts[key];
}
const blocked = (revolt, key) => revolt.reaction?.type === 'blackout' && revolt.reaction.front === key;
const attacked = (revolt, key) => revolt.reaction?.type === 'counterattack' && revolt.reaction.front === key;
export function allowedRevoltActions(revolt, key) {
  const front = revolt.fronts[key];
  if (attacked(revolt, key)) return ['defend', 'retreat'];
  return ['regroup', ...(front.breath > 0 && !blocked(revolt, key) ? ['support'] : []), ...(front.breath > 0 && front.position < 4 ? ['advance'] : [])];
}
function conquer(revolt, key) {
  const front = revolt.fronts[key];
  front.position = Math.min(4, front.position + 1);
  front.fortified = front.fortified.filter(position => position !== front.position);
  if (front.position >= 2 && !front.milestoneClaimed) {
    front.milestoneClaimed = true;
    revolt.rewards.push({ id: `${revolt.round}-${key}`, source: key, type: key === 'popular' ? 'breath' : 'bonus', used: false });
  }
}
function validatePlan(revolt, key, plan) {
  frontFor(revolt, key);
  if (!plan || !allowedRevoltActions(revolt, key).includes(plan.type)) throw new Error(`${REVOLT_FRONTS[key].name}: escolha uma ação permitida para esta frente.`);
  if (plan.type === 'advance' && !['lead', 'personal'].includes(plan.mode)) throw new Error('Escolha liderar a revolta ou intervir pessoalmente.');
  if (plan.type === 'support') {
    frontFor(revolt, plan.target);
    if (plan.target === key) throw new Error('O Apoio precisa ajudar outra frente.');
    if (blocked(revolt, plan.target)) throw new Error('A frente escolhida está com as comunicações bloqueadas.');
  }
}
export function applyRevoltAction(event, action, random = Math.random) {
  const revolt = event.revolt;
  const key = action.front;
  const name = REVOLT_FRONTS[key]?.name;
  switch (action.type) {
    case 'revoltRename': {
      for (const id of keys) {
        const change = action.fronts?.[id];
        if (!change) continue;
        if (change.team != null) revolt.fronts[id].team = clean(change.team, 200);
        if (change.sheet != null && JSON.stringify(revoltGroupSheet(change, id)) !== JSON.stringify(revoltGroupSheet(revolt.fronts[id], id))) {
          if (revolt.phase !== 'planning' || Object.keys(revolt.plans).length) throw new Error('Configure as fichas dos grupos antes das escolhas da rodada.');
          revolt.fronts[id].sheet = revoltGroupSheet(change, id);
        }
        if (change.players != null && JSON.stringify(change.players) !== JSON.stringify(revolt.fronts[id].players || [])) {
          if (revolt.phase !== 'planning' || Object.keys(revolt.plans).length) throw new Error('Designe os jogadores antes das escolhas da rodada.');
          revolt.fronts[id].players = [...new Set(change.players.map(value => clean(value, 150).replace(/^darkness:/, '')).filter(Boolean))];
        }
        if (change.difficulty != null && Number(change.difficulty) !== (revolt.fronts[id].difficulty || 1)) {
          if (revolt.phase !== 'planning' || Object.keys(revolt.plans).length) throw new Error('Defina as DTs antes das escolhas da rodada.');
          revolt.fronts[id].difficulty = Math.max(1, Math.min(5, Math.floor(Number(change.difficulty) || 1)));
        }
        if (change.route != null) {
          if (!Array.isArray(change.route) || change.route.length !== 4 || change.route.some(place => !clean(place))) throw new Error('Cada frente precisa de quatro locais com nome.');
          revolt.fronts[id].route = change.route.map(place => clean(place));
        }
      }
      return 'Frentes, jogadores, DTs e locais atualizados.';
    }
    case 'revoltFortify': {
      requirePhase(revolt, 'planning');
      const front = frontFor(revolt, key);
      if (front.position >= 4) throw new Error('Esta frente já alcançou a sede.');
      if (Object.keys(revolt.plans).length) throw new Error('Informe as fortificações antes de registrar as escolhas.');
      const position = front.position + 1;
      front.fortified = front.fortified.includes(position) ? front.fortified.filter(value => value !== position) : [...front.fortified, position];
      return `${name}: próxima posição ${front.fortified.includes(position) ? 'fortificada' : 'sem fortificação'}.`;
    }
    case 'revoltPlan': {
      requirePhase(revolt, 'planning');
      if (action.clear) { frontFor(revolt, key); delete revolt.plans[key]; return `${name}: escolha reaberta.`; }
      validatePlan(revolt, key, action.plan);
      revolt.plans[key] = { type: action.plan.type, ...(action.plan.type === 'advance' ? { mode: action.plan.mode } : {}), ...(action.plan.type === 'support' ? { target: action.plan.target } : {}) };
      return `${name}: ${REVOLT_ACTIONS[action.plan.type]}${action.plan.type === 'support' ? ` ${REVOLT_FRONTS[action.plan.target].name}` : ''} escolhido.`;
    }
    case 'revoltLock': {
      requirePhase(revolt, 'planning');
      for (const id of keys) validatePlan(revolt, id, revolt.plans[id]);
      const targets = keys.filter(id => revolt.plans[id].type === 'support' && (!revolt.plans[id].groupTest || revolt.plans[id].groupTest.sucesso)).map(id => revolt.plans[id].target);
      if (new Set(targets).size !== targets.length) throw new Error('Cada frente pode receber no máximo uma ação de Apoio por rodada. Ajuste as escolhas.');
      revolt.snapshot = Object.fromEntries(keys.map(id => {
        const front = revolt.fronts[id];
        return [id, { breath: front.breath, bonus: front.bonus, difficulty: front.difficulty || event.difficulty || 1, supported: targets.includes(id), fortified: front.fortified.includes(front.position + 1), blocked: blocked(revolt, id) }];
      }));
      revolt.results = {};
      for (const id of keys) {
        const front = revolt.fronts[id], plan = revolt.plans[id];
        if (plan.groupTest) {
          const success = plan.groupTest.sucesso;
          let summary;
          if (plan.type === 'advance') { if (success) conquer(revolt, id); else front.breath = Math.max(0, front.breath - 1); summary = success ? 'Teste da frente bem-sucedido: conquistou a próxima posição.' : 'Teste da frente falhou: não avançou e perdeu 1 de Fôlego.'; }
          if (plan.type === 'regroup') { if (success) front.breath = Math.min(6, front.breath + 1); summary = success ? `Reorganização bem-sucedida: Fôlego ${front.breath}/6.` : 'Reorganização falhou: Fôlego mantido.'; }
          if (plan.type === 'support') {
            if (success && revolt.plans[plan.target].groupTest) revolt.fronts[plan.target].bonus += 1;
            summary = success ? `Apoio bem-sucedido a ${REVOLT_FRONTS[plan.target].name}: +1 dado no próximo teste de avanço ainda não rolado.` : 'Apoio falhou: nenhum bônus concedido.';
          }
          if (plan.type === 'defend') { if (!success) front.position = Math.max(0, front.position - 1); summary = success ? 'Defesa bem-sucedida: posição mantida.' : 'Defesa falhou: recuou uma posição.'; }
          if (plan.type === 'retreat') { front.position = Math.max(0, front.position - 1); summary = 'Retirada executada: recuou uma posição.'; }
          revolt.results[id] = { summary, test: plan.groupTest, author: plan.groupTest.autor, actorId: plan.actorId };
          continue;
        }
        if (plan.type === 'regroup') { front.breath = Math.min(6, front.breath + 1); revolt.results[id] = { summary: `Reorganizou: Fôlego ${front.breath}/6.` }; }
        if (plan.type === 'support') revolt.results[id] = { summary: `Apoio a ${REVOLT_FRONTS[plan.target].name}: +1, sem acúmulo.` };
        if (plan.type === 'retreat') { front.position = Math.max(0, front.position - 1); revolt.results[id] = { summary: `Recuou para ${front.position}/4 para evitar o contra-ataque.` }; }
      }
      revolt.phase = 'resolving';
      return `Rodada ${revolt.round}: três escolhas travadas. Resolva as frentes em qualquer ordem.`;
    }
    case 'revoltResolve': {
      requirePhase(revolt, 'resolving');
      const front = frontFor(revolt, key), plan = revolt.plans[key];
      if (revolt.results[key]) throw new Error('Esta frente já foi resolvida nesta rodada.');
      let summary;
      if (plan.type === 'defend') {
        if (typeof action.success !== 'boolean') throw new Error('Informe o resultado da cena de defesa.');
        if (!action.success) front.position = Math.max(0, front.position - 1);
        summary = action.success ? 'Defesa cumprida na cena: manteve a posição.' : `Defesa não cumprida: recuou para ${front.position}/4.`;
      } else if (plan.type === 'advance' && plan.mode === 'personal') {
        if (typeof action.success !== 'boolean') throw new Error('Informe se o objetivo da cena de ABSOLUTO foi cumprido.');
        if (action.success) conquer(revolt, key);
        else front.breath = Math.max(0, front.breath - 1);
        summary = action.success ? 'Objetivo cumprido em ABSOLUTO: avançou sem dado da Revolta.' : 'Recuou da cena: não avançou e perdeu 1 de Fôlego.';
      } else if (plan.type === 'advance') {
        const die = action.die ?? Math.floor(random() * 6) + 1;
        if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('O dado da Revolta deve ser um inteiro entre 1 e 6.');
        const snapshot = revolt.snapshot[key];
        const organization = snapshot.breath >= 4 ? 1 : 0;
        const bonusAvailable = snapshot.bonus > 0 && !snapshot.blocked;
        const support = snapshot.supported || bonusAvailable ? 1 : 0;
        if (!snapshot.supported && bonusAvailable) front.bonus = Math.max(0, front.bonus - 1);
        const fortification = snapshot.fortified ? -1 : 0;
        const total = die + organization + support + fortification;
        if (total >= 3) conquer(revolt, key);
        if (total < 5) front.breath = Math.max(0, front.breath - 1);
        summary = `${die} no d6 ${organization ? '+1 organização ' : ''}${support ? '+1 apoio ' : ''}${fortification ? '−1 fortificação ' : ''}= ${total}: ${total >= 5 ? 'conquistou sem desgaste' : total >= 3 ? 'conquistou, −1 Fôlego' : 'não avançou, −1 Fôlego'}.`;
        revolt.results[key] = { die, organization, support, fortification, total, summary };
      } else throw new Error('Esta ação não precisa de resolução manual.');
      revolt.results[key] = { ...revolt.results[key], summary };
      return `${name}: ${summary}`;
    }
    case 'revoltReward': {
      requirePhase(revolt, 'resolving');
      if (keys.some(id => !revolt.results[id])) throw new Error('Resolva as três frentes antes de distribuir os benefícios.');
      const reward = revolt.rewards.find(item => item.id === action.reward && !item.used);
      if (!reward) throw new Error('Este benefício já foi distribuído ou não existe.');
      const eligible = keys.filter(id => id !== reward.source && (reward.type === 'breath' || revolt.fronts[id].position < 4));
      if (action.skip && !eligible.length) { reward.used = true; return 'Benefício encerrado: as outras frentes já alcançaram a sede.'; }
      const target = frontFor(revolt, action.target);
      if (!eligible.includes(action.target)) throw new Error('Escolha outra frente que possa receber o benefício.');
      if (reward.type === 'breath') target.breath = Math.min(6, target.breath + 1);
      else target.bonus += 1;
      reward.used = true; reward.target = action.target;
      return `${REVOLT_FRONTS[reward.source].name} ajudou ${REVOLT_FRONTS[action.target].name}: ${reward.type === 'breath' ? '+1 Fôlego (máximo 6)' : '+1 reservado para o próximo teste de avanço, sem acúmulo por teste'}.`;
    }
    case 'revoltRoundEnd': {
      requirePhase(revolt, 'resolving');
      if (keys.some(id => !revolt.results[id])) throw new Error('Resolva as três frentes antes de encerrar a rodada.');
      if (revolt.rewards.some(reward => !reward.used)) throw new Error('Distribua os benefícios conquistados antes de encerrar a rodada.');
      revolt.history = [{ round: revolt.round, plans: revolt.plans, results: revolt.results, reaction: revolt.reaction }, ...revolt.history].slice(0, 30);
      revolt.phase = keys.every(id => revolt.fronts[id].position === 4) ? 'final' : 'reaction';
      return revolt.phase === 'final' ? 'As três frentes chegaram à sede. Começou a tomada final.' : `Rodada ${revolt.round} concluída. Anuncie uma reação para a próxima rodada.`;
    }
    case 'revoltReaction': {
      requirePhase(revolt, 'reaction');
      const front = frontFor(revolt, key);
      if (!Object.hasOwn(REVOLT_REACTIONS, action.reaction)) throw new Error('Escolha uma reação militar válida.');
      if (action.reaction === 'reinforcements' && front.position === 4) throw new Error('Esta frente já está na sede e não tem próxima posição para fortificar.');
      revolt.reaction = { type: action.reaction, front: key };
      if (action.reaction === 'reinforcements' && !front.fortified.includes(front.position + 1)) front.fortified.push(front.position + 1);
      revolt.round += 1; revolt.phase = 'planning'; revolt.plans = {}; revolt.results = {}; revolt.snapshot = null;
      return `Rodada ${revolt.round}: ${REVOLT_REACTIONS[action.reaction].name} contra ${name}.`;
    }
    case 'revoltFinal': {
      requirePhase(revolt, 'final');
      const front = frontFor(revolt, key);
      if (front.finalDone) throw new Error('Este objetivo final já foi cumprido.');
      if (typeof action.success !== 'boolean') throw new Error('Informe o resultado da cena final.');
      if (action.success) front.finalDone = true;
      if (keys.every(id => revolt.fronts[id].finalDone)) { revolt.phase = 'victory'; event.status = 'victory'; }
      return `${name}: ${action.success ? 'objetivo final cumprido' : 'objetivo final ainda pendente; continue a cena'}.${event.status === 'victory' ? ' Os três objetivos foram cumpridos. A ditadura caiu!' : ''}`;
    }
    default: throw new Error('Ação da Revolta não disponível.');
  }
}
