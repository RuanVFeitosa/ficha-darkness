import React from 'react';
import Icon from '@mdi/react';
import {mdiSilverwareForkKnife,mdiWaterOutline} from '@mdi/js';
import {bounded} from '../../utils/optionalSystems';
import {mechanicPlayerId} from '../../utils/mechanicParticipation';
import useSheetCampaigns from '../../hooks/useSheetCampaigns';
import '../../styles/SurvivalIndicators.css';

export function survivalFor(campaign,playerId) {
 const id=mechanicPlayerId(playerId);
 if(!id || !(campaign?.membros || []).some(member=>mechanicPlayerId(member.ficha_id)===id))return null;
 const system=(campaign?.mecanicasEspeciais?.optionalSystems || []).find(item=>item.kind==='survival' && item.enabled);
 if(!system)return null;
 const values=system.participants?.[id] || system.participants?.[`darkness:${id}`] || {};
 return {hunger:bounded(values.hunger,10),thirst:bounded(values.thirst,10)};
}

export default function SurvivalIndicators({campaign,playerId,compact=false}) {
 const values=survivalFor(campaign,playerId);
 if(!values)return null;
 return <section className={`survival-indicators ${compact?'survival-hud':'survival-sheet'}`} data-system={campaign.sistema || 'absoluto'} aria-label="Fome e sede">
  <header><span>SOBREVIVÊNCIA</span>{!compact && <small>{campaign.nome}</small>}</header>
  <div className="survival-gauges">{[['hunger','Fome',mdiSilverwareForkKnife],['thirst','Sede',mdiWaterOutline]].map(([key,label,icon])=>{
   const value=values[key];
   const remaining=value;
   return <div className="survival-gauge" key={key} data-level={value<=2?'high':value<=5?'medium':'low'}><div className="survival-gauge-heading"><Icon path={icon} size={compact?.65:.85}/><strong>{label}</strong><output aria-label={`${label}: ${remaining} de 10 barras restantes`}>{remaining}<small>/10</small></output></div><div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={remaining} aria-valuetext={`${remaining} de 10 barras restantes; quanto menos, maior a necessidade`} className="survival-segments">{Array.from({length:10},(_,i)=><i key={i} className={i<remaining?'is-filled':''}/>)}</div>{!compact && <small className="survival-gauge-caption">{value===10 ? (key==='hunger'?'Alimentado':'Hidratado') : remaining===0 ? (key==='hunger'?'Sem reservas de alimento':'Sem reservas de água') : `${remaining} de 10 barras restantes`}</small>}</div>;
  })}</div>
  {!compact && <p>Barra cheia: alimentado e hidratado. Quanto menos barras, maior a fome ou sede. Atualizado pelo mestre da campanha.</p>}
 </section>;
}

export function SheetSurvival({sheetId,campaign}) {
 const campaigns=useSheetCampaigns(sheetId,campaign);
 return <>{campaigns.map(item=><SurvivalIndicators key={item.id} campaign={item} playerId={sheetId}/>)}</>;
}
