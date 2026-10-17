export function tabletopCharacterId(id) {
  const value = String(id || '');
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
