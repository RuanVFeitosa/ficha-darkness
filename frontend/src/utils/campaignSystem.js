export const campaignSystems = { absoluto: 'Darkness', espiral: 'ESPIRAL', ordem: 'Ordem Paranormal' };
export const campaignSystem = campaign => Object.hasOwn(campaignSystems, campaign?.sistema) ? campaign.sistema : 'absoluto';
export const sheetSystem = sheet => {
 const prefix = String(sheet?.fichaId || sheet?.ficha_id || '').split(':')[0];
 return campaignSystem({ sistema: sheet?.sistema || (['ordem', 'espiral'].includes(prefix) ? prefix : 'absoluto') });
};
export const systemLabel = system => campaignSystems[system] || campaignSystems.absoluto;

// Membership remains removable even when the original sheet was deleted or is
// unavailable on this browser.
export function campaignSheetOptions(available, campaign) {
 const options = new Map(available.map(sheet => [sheet.fichaId, sheet]));
 for (const member of campaign?.membros || []) {
  if (!member.ficha_id || options.has(member.ficha_id)) continue;
  options.set(member.ficha_id, {
   fichaId: member.ficha_id,
   sistema: sheetSystem(member),
   indisponivel: true,
   personagem: {nome: member.nome || member.ficha_id},
  });
 }
 const linked = new Set((campaign?.membros || []).map(member => member.ficha_id));
 return [...options.values()].filter(sheet => linked.has(sheet.fichaId) || sheetSystem(sheet) === campaignSystem(campaign));
}

export const removedCampaignSheets = (campaign, selected) =>
 [...new Set((campaign?.membros || []).map(member => member.ficha_id).filter(Boolean))]
  .filter(id => !selected.includes(id));
