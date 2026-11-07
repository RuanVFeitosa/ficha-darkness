import {useEffect,useState} from 'react';
import {listarCampanhasDaFicha,ouvirCampanha} from '../services/mesaApi';

export default function useSheetCampaigns(sheetId,campaign) {
 const [linked,setLinked]=useState([]);
 useEffect(()=>{
  setLinked([]);
  if(campaign!==undefined || !sheetId)return undefined;
  let alive=true,stops=[],revision=0;
  const refresh=async()=>{
   const request=++revision;
   try {
    const items=await listarCampanhasDaFicha(sheetId);
    if(!alive || request!==revision)return;
    const params=new URLSearchParams(window.location.search);
    const code=params.get('campanhaTeste') || params.get('campanha');
    const campaigns=items.filter(item=>!code || item.codigo===code);
    setLinked(campaigns);
    stops.forEach(stop=>stop());
    stops=campaigns.map(item=>ouvirCampanha(item.id,refresh));
   } catch {if(alive && request===revision)setLinked([]);}
  };
  refresh();window.addEventListener('focus',refresh);
  return ()=>{alive=false;stops.forEach(stop=>stop());window.removeEventListener('focus',refresh);};
 },[sheetId,campaign]);
 return campaign===undefined ? linked : campaign ? [campaign] : [];
}
