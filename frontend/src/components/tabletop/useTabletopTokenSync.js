import {useEffect,useRef} from 'react';
import {buscarCampanhaPorCodigo} from '../../services/mesaApi';
export default function useTabletopTokenSync(code,enabled,onTokens){
 const callback=useRef(onTokens);callback.current=onTokens;
 useEffect(()=>{
  if(!enabled)return;
  let active=true,busy=false;
  const refresh=async()=>{
   if(busy || document.visibilityState==='hidden')return;
   busy=true;
   try{const campaign=await buscarCampanhaPorCodigo(code);if(active && campaign)callback.current(campaign.tokens || []);}catch{}finally{busy=false;}
  };
  const timer=setInterval(refresh,4000);
  window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
  return ()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[code,enabled]);
}
