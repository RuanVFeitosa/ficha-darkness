import {useEffect,useState} from 'react';
import {buscarCampanhaPorCodigo,ouvirCampanha} from '../services/mesaApi';
import {activeSceneDifficulty} from '../utils/sceneDifficulty';

export default function useAbsolutoSceneDifficulty(code) {
 const [campaign,setCampaign]=useState(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  setCampaign(null);setError('');
  if(!code) return undefined;
  let active=true,stop;
  const refresh=async()=>{
   try {
    const next=await buscarCampanhaPorCodigo(code);
    if(!active) return;
    if(!next) throw new Error('Campanha não encontrada.');
    setCampaign(next);setError('');
    if(!stop) stop=ouvirCampanha(next.id,refresh);
   } catch(e) {if(active) setError('Não foi possível sincronizar a dificuldade da mesa.');}
  };
  refresh();
  return ()=>{active=false;stop?.();};
 },[code]);
 const difficulty=campaign?.cenaAtiva ? activeSceneDifficulty(campaign.cenaAtiva,campaign.inimigos || [],Boolean(campaign.combateAtivo)) : null;
 return {difficulty,error,loading:Boolean(code && !campaign && !error)};
}
