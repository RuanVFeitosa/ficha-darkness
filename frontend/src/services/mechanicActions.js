import { applyMechanicAction, normalizeMechanics } from '../utils/specialMechanics';
import { applyParticipantMechanicAction, mechanicPlayerId, validateMechanicAssignments } from '../utils/mechanicParticipation';
import { buscarCampanhaPorCodigo, salvarMecanicasCampanha } from './mesaApi';

export async function commitMechanicAction(campaign, state, action, { master = false, playerId = '' } = {}, sourceRandom = Math.random) {
  if (master && action.type === 'create') validateMechanicAssignments(action.config?.fronts, campaign.membros);
  if (master && action.type === 'revoltRename') validateMechanicAssignments(action.fronts, campaign.membros);
  const identity = mechanicPlayerId(playerId);
  const member = (campaign.membros || []).find(item => mechanicPlayerId(item.ficha_id) === identity);
  if (!master && !member) throw new Error('Entre com uma ficha vinculada à campanha para participar.');
  let current = state;
  const tape = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    let cursor = 0;
    const random = () => { if (tape[cursor] == null) tape[cursor] = sourceRandom(); return tape[cursor++]; };
    const next = master ? applyMechanicAction(current, action, undefined, random) : applyParticipantMechanicAction(current, action, { id: identity, name: member.nome }, undefined, undefined, random);
    try { return await salvarMecanicasCampanha(campaign.id, next, current.revision); }
    catch (err) {
      if (err.code !== 'MECHANIC_CONFLICT' || attempt === 2) throw err;
      const fresh = await buscarCampanhaPorCodigo(campaign.codigo);
      if (!fresh) throw err;
      current = normalizeMechanics(fresh.mecanicasEspeciais);
    }
  }
}
