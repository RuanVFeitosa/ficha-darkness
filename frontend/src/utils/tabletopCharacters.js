export function canMoveTacticalToken(token, mestre, playerTokenId) {
  return Boolean(mestre || (playerTokenId && token?.id === playerTokenId && token.personIndex !== undefined));
}
export function floorMovementTarget({ mestre, pendingToken, tokenMode, selectedToken, selected, people, playerIndex }) {
  if (!mestre) {
    const person = people[playerIndex];
    return person ? { kind: 'person', index: playerIndex, id: person.id } : null;
  }
  if (pendingToken) return { kind: 'place' };
  if (tokenMode && selectedToken) return { kind: 'custom', id: selectedToken };
  return people[selected] ? { kind: 'person', index: selected, id: people[selected].id } : null;
}
export function tabletopCharacterId(id) {
  const value = String(id || '');
  if (value.startsWith('espiral_')) return `espiral:${value.slice('espiral_'.length)}`;
  return /^(espiral:|darkness:|inimigo:|custom3d:)/.test(value) ? value : 'darkness:' + value;
}
export function tabletopPlayerId(params) {
  return params.get('sistema') === 'espiral'
    ? params.get('ficha') || 'principal'
    : params.get('senha') || params.get('ficha') || '';
}
export function campaignCharacters(campaign, localCharacters) {
  if (!campaign) return [];
  const locals = new Map(localCharacters.map(character => [character.id, character]));
  const members = new Map();
  for (const member of campaign.membros || []) {
    if (!member.ficha_id || String(member.ficha_id).startsWith('custom3d:')) continue;
    const id = tabletopCharacterId(member.ficha_id);
    members.set(id, locals.get(id) || { id, sheet: { name: member.nome || 'Personagem' } });
  }
  return [...members.values()];
}
