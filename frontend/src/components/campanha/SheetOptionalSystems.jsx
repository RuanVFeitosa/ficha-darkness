import React,{useEffect,useState} from 'react';
import {listarCampanhasDaFicha,buscarCampanhaPorCodigo,ouvirCampanha} from '../../services/mesaApi';
import {ammoEnabled} from '../../utils/optionalSystems';
import OptionalSystems from './OptionalSystems';

export default function SheetOptionalSystems({sheetId,onAmmoEnabled}) {
 const [campaigns,setCampaigns]=useState([]),[code,setCode]=useState(''),[campaign,setCampaign]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  listarCampanhasDaFicha(sheetId).then(items=>{if(!alive)return;setCampaigns(items);const params=new URLSearchParams(window.location.search);const requested=params.get('campanhaTeste') || params.get('campanha');setCode(items.find(c=>c.codigo===requested)?.codigo || (items.length===1?items[0].codigo:''));}).catch(()=>{if(alive)setError('Não foi possível carregar os sistemas opcionais da campanha.');});
  return ()=>{alive=false;};
 },[sheetId]);
 useEffect(()=>{
  let alive=true,stop;
  setCampaign(null);onAmmoEnabled(false);
  if(!code)return undefined;
  const refresh=async()=>{try {const next=await buscarCampanhaPorCodigo(code);if(!alive)return;setCampaign(next);onAmmoEnabled(ammoEnabled(next));setError('');if(next && !stop)stop=ouvirCampanha(next.id,refresh);}catch(e){if(alive){setError('Não foi possível sincronizar os sistemas opcionais.');onAmmoEnabled(false);}}};
  refresh();window.addEventListener('focus',refresh);
  return ()=>{alive=false;stop?.();window.removeEventListener('focus',refresh);};
 },[code,onAmmoEnabled]);
 return <section><label>Regras da campanha <select className="optional-campaign-select" value={code} onChange={e=>setCode(e.target.value)}><option value="">Sem campanha selecionada</option>{campaigns.map(c=><option key={c.id} value={c.codigo}>{c.nome}</option>)}</select></label>{error && <p role="alert">{error}</p>}{campaign && <OptionalSystems campaign={campaign} playerId={sheetId} onState={state=>setCampaign(c=>({...c,mecanicasEspeciais:state}))}/>}</section>;
}
