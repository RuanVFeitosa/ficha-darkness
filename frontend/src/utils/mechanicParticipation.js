import { applyMechanicAction, normalizeMechanics } from './specialMechanics';
import { executarTesteAtributo, executarTesteDominio } from './absolutoRolagem';
import { groupActionTest, revoltGroupSheet } from './revoltGroupSheets';
export const mechanicPlayerId = value => String(value || '').replace(/^darkness:/, '');
export const frontPlayers = front => (front?.players || []).map(mechanicPlayerId);
export function validateMechanicAssignments(fronts, members) {
  const valid = new Set((members || []).map(member => mechanicPlayerId(member.ficha_id)));
  const used = new Set();
  for (const front of Object.values(fronts || {})) for (const id of frontPlayers(front)) {
    if (!valid.has(id)) throw new Error('Designe apenas fichas vinculadas à campanha.');
    if (used.has(id)) throw new Error('Cada jogador deve pertencer a uma única frente da Revolta.');
    used.add(id);
  }
}
export function applyParticipantMechanicAction(input, action, actor, sheet, now = new Date().toISOString(), random = Math.random) {
  void sheet; // Personal character sheets never participate in group mechanics.
  let state = normalizeMechanics(input);
  const event = state.events.find(item => item.id === action.id);
  const actorId = mechanicPlayerId(actor?.id);
  if (!actorId || !event?.revolt || !frontPlayers(event.revolt.fronts[action.front]).includes(actorId)) throw new Error('Você só pode agir na frente à qual foi designado.');
  if (state.activeId !== event.id || event.status !== 'active') throw new Error('Aguarde o mestre iniciar ou retomar a mecânica.');
  if (!['revoltPlan', 'revoltResolve', 'revoltTest', 'revoltFinalTest', 'revoltGroupAction'].includes(action.type)) throw new Error('Esta ação é reservada ao mestre.');
  let resolvedAction = action, test;
  if (action.type === 'revoltPlan' && !action.clear) throw new Error('Escolha a ação do grupo para realizar o teste da ficha pronta.');
  if (event.revolt.plans[action.front]?.groupTest && action.type === 'revoltPlan') throw new Error('O teste desta frente já foi realizado. Aguarde o fechamento da rodada.');
  if (action.type === 'revoltGroupAction') {
    if (event.revolt.phase !== 'planning' || event.revolt.plans[action.front]) throw new Error('Esta frente já escolheu sua ação ou a rodada já foi travada.');
    if (action.choice === 'support' && Object.values(event.revolt.plans).some(plan => plan.type === 'support' && plan.target === action.target)) throw new Error('Outra frente já escolheu apoiar esse alvo. Escolha outra frente.');
    resolvedAction = { id: action.id, type: 'revoltPlan', front: action.front, plan: { type: action.choice, ...(action.choice === 'advance' ? { mode: 'personal' } : {}), ...(action.choice === 'support' ? { target: action.target } : {}) } };
    // Validate choices before generating a roll.
    applyMechanicAction(state, resolvedAction, now, random);
    const front = event.revolt.fronts[action.front];
    const configured = groupActionTest(front, action.front, action.choice);
    const bonus = action.choice === 'advance' && front.bonus > 0 && !(event.revolt.reaction?.type === 'blackout' && event.revolt.reaction.front === action.front);
    const advantage = action.choice === 'advance' ? (front.breath >= 4 ? 1 : 0) + (bonus ? 1 : 0) - (front.fortified.includes(front.position + 1) ? 1 : 0) : 0;
    test = (configured.testKind === 'attribute' ? executarTesteAtributo : executarTesteDominio)(configured.sheet, configured.testKey, { dt: front.difficulty || event.difficulty || 1, vantagem: advantage }, random).rolagem;
    test = { ...test, source: 'group', groupName: configured.sheet.nome, usedBonus: Boolean(bonus), mechanicId: event.id, actorId, autor: actor.name || actorId };
  } else if (['revoltTest', 'revoltFinalTest', 'revoltResolve'].includes(action.type)) {
    const r = event.revolt, plan = r.plans[action.front], final = action.type === 'revoltFinalTest';
    if (final ? r.phase !== 'final' || r.fronts[action.front].finalDone : r.phase !== 'resolving' || r.results[action.front] || !(plan?.type === 'defend' || plan?.type === 'advance')) throw new Error('Não há teste do grupo pendente para esta frente.');
    const groupSheet = revoltGroupSheet(r.fronts[action.front], action.front);
    const configured = groupActionTest(r.fronts[action.front], action.front, final ? 'final' : plan.type);
    const dt = final ? r.fronts[action.front].difficulty || event.difficulty || 1 : r.snapshot[action.front].difficulty || r.fronts[action.front].difficulty || event.difficulty || 1;
    const testKind = action.type === 'revoltResolve' ? configured.testKind : action.testKind || configured.testKind;
    const testKey = action.type === 'revoltResolve' ? configured.testKey : action.testKey || configured.testKey;
    if (!['attribute', 'domain'].includes(testKind)) throw new Error('Escolha um Atributo ou Domínio para o teste.');
    test = (testKind === 'attribute' ? executarTesteAtributo : executarTesteDominio)(groupSheet, testKey, { dt }, random).rolagem;
    test = { ...test, source: 'group', groupName: groupSheet.nome, mechanicId: event.id, actorId, autor: actor.name || actorId };
    if (!final && plan.type === 'advance' && plan.mode === 'lead') {
      state = JSON.parse(JSON.stringify(state));
      state.events.find(item => item.id === event.id).revolt.plans[action.front].mode = 'personal';
    }
    resolvedAction = { id: action.id, front: action.front, type: final ? 'revoltFinal' : 'revoltResolve', success: test.sucesso };
  }
  const next = applyMechanicAction(state, resolvedAction, now, random);
  const updated = next.events.find(item => item.id === event.id);
  if (['revoltPlan', 'revoltGroupAction'].includes(action.type) && !action.clear) updated.revolt.plans[action.front].actorId = actorId;
  if (action.type === 'revoltGroupAction') {
    updated.revolt.plans[action.front].groupTest = test;
    if (test.usedBonus) updated.revolt.fronts[action.front].bonus = Math.max(0, updated.revolt.fronts[action.front].bonus - 1);
  } else if (action.type !== 'revoltPlan') {
    const result = action.type === 'revoltFinalTest' ? (updated.revolt.fronts[action.front].finalTest = {}) : updated.revolt.results[action.front];
    result.actorId = actorId; result.author = actor.name || actorId;
    if (test) result.test = test;
  }
  if (updated.log[0]) updated.log[0].message = `${actor.name || actorId} · ${updated.log[0].message}${test ? ` · ${test.formula}: [${test.dados.join(', ')}], ${test.exitos} êxito(s)` : ''}`;
  return next;
}
