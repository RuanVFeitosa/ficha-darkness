import React,{useEffect,useState} from 'react';
import {iniciarNovaCena} from '../../services/novaCena';

export default function NewSceneControl({members=[]}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{
  if(!message) return undefined;
  const timer=window.setTimeout(()=>setMessage(''),error?8000:4000);
  return ()=>window.clearTimeout(timer);
 },[message,error]);
 const start=async()=>{
  setBusy(true);setMessage('');setError(false);
  try{const total=await iniciarNovaCena(members);setMessage(`Nova cena iniciada para ${total} ficha(s).`);}
  catch(e){setError(true);setMessage(e.message);}
  finally{setBusy(false);}
 };
 return <div className="shield-new-scene"><button type="button" title="Limpa efeitos automáticos da cena e preserva habilidades e Ritos dos jogadores" disabled={busy} onClick={start}>{busy?'Iniciando cena…':'Nova Cena'}</button>{message&&<p role={error?'alert':'status'}>{message}</p>}</div>;
}
