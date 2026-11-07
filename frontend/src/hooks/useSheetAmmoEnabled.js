import {useEffect,useState} from 'react';
import {listarCampanhasDaFicha,ouvirCampanha} from '../services/mesaApi';
import {ammoEnabled} from '../utils/optionalSystems';

export default function useSheetAmmoEnabled(sheetId,campaign) {
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{
  setEnabled(false);
  if(campaign!==undefined)return undefined;
  let alive=true,stops=[];
  const refresh=async()=>{
   try {
    const campaigns=await listarCampanhasDaFicha(sheetId);
    if(!alive)return;
    const params=new URLSearchParams(window.location.search);
    const code=params.get('campanhaTeste') || params.get('campanha');
    setEnabled(campaigns.some(item=>(!code || item.codigo===code) && ammoEnabled(item)));
    stops.forEach(stop=>stop());
    stops=campaigns.map(item=>ouvirCampanha(item.id,refresh));
   } catch {if(alive)setEnabled(false);}
  };
  refresh();window.addEventListener('focus',refresh);
  return ()=>{alive=false;stops.forEach(stop=>stop());window.removeEventListener('focus',refresh);};
 },[sheetId,campaign]);
 return campaign!==undefined ? ammoEnabled(campaign) : enabled;
}
