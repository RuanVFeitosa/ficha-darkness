import {campaignSystem, sheetSystem, campaignSheetOptions, removedCampaignSheets} from './campaignSystem';
test('campanhas antigas usam Absoluto e fichas ESPIRAL são identificadas pelo vínculo',()=>{
 expect(campaignSystem({})).toBe('absoluto');
 expect(campaignSystem({sistema:'espiral'})).toBe('espiral');
 expect(sheetSystem({ficha_id:'espiral:ana'})).toBe('espiral');
 expect(sheetSystem({sistema:'darkness'})).toBe('absoluto');
});

test('exibe vínculos ausentes e incompatíveis, sem duplicar fichas nem oferecer novas fichas de outro sistema',()=>{
 const campaign={sistema:'espiral',membros:[
  {ficha_id:'antiga',nome:'Ellie'},
  {ficha_id:'espiral:ana',nome:'Ana'},
  {ficha_id:'antiga',nome:'Ellie'},
 ]};
 const options=campaignSheetOptions([
  {fichaId:'espiral:ana',sistema:'espiral',personagem:{nome:'Ana atualizada'}},
  {fichaId:'outra',sistema:'darkness'},
 ],campaign);
 expect(options.map(sheet=>sheet.fichaId)).toEqual(['espiral:ana','antiga']);
 expect(options[0].personagem.nome).toBe('Ana atualizada');
 expect(options[1]).toMatchObject({indisponivel:true,personagem:{nome:'Ellie'}});
 expect(removedCampaignSheets(campaign,['espiral:ana'])).toEqual(['antiga']);
 expect(removedCampaignSheets(campaign,[])).toEqual(['antiga','espiral:ana']);
});
