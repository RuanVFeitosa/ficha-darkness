export const campaignSystem = campaign => campaign?.sistema === 'espiral' ? 'espiral' : 'absoluto';
export const sheetSystem = sheet => sheet?.sistema === 'espiral' || String(sheet?.fichaId || sheet?.ficha_id || '').startsWith('espiral:') ? 'espiral' : 'absoluto';
export const systemLabel = system => system === 'espiral' ? 'ESPIRAL' : 'Absoluto 1.0';

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
