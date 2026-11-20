import { listarCampanhasDaFicha } from './mesaApi';
import { espiralRemoteId } from './espiralApi';

// The sheet's own ID and the campaign membership ID are different identifiers.
export async function sheetTabletopCampaigns(id, legacyId) {
  const ids = [...new Set([`espiral:${id}`, espiralRemoteId(id), id, legacyId].filter(Boolean))];
  const results = await Promise.allSettled(ids.map(value => listarCampanhasDaFicha(value)));
  const campaigns = new Map();
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    for (const campaign of result.value || []) {
      if (campaign?.tabletop_tipo !== '3d') continue;
      const key = campaign.id || campaign.codigo;
      if (!campaigns.has(key)) campaigns.set(key, { ...campaign, linkedSheetId: ids[index] });
    }
  });
  if (!campaigns.size && results.some(result => result.status === 'rejected')) throw results.find(result => result.status === 'rejected').reason;
  return [...campaigns.values()];
}
