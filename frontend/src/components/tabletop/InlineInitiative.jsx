import React,{useState,useRef} from 'react';

export default function InlineInitiative({record,turns,drafts,onChange,onConfirm,onAdd}) {
 const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false);
 const npc=(record.tipo || record.dados?.tipo)==='npc';
 const valid=value!=='' && Number.isInteger(Number(value)) && Number(value)>=0;
 const add=async()=>{
  if(!valid || lock.current)return;
  lock.current=true;setBusy(true);setError('');
  const kind=npc?'npc':record.bossIniciativa || record.dados?.bossIniciativa || record.tipo==='boss'?'boss':'inimigo';
  try{await onAdd(record,Number(value),kind);setValue('');}
  catch(e){setError(e.message || 'Não foi possível adicionar a iniciativa.');}
  finally{lock.current=false;setBusy(false);}
 };
 return <span className="inline-initiative-controls">
  {turns.map((entry,index)=><input key={entry.chave} type="text" inputMode="numeric" pattern="[0-9]*" aria-label={`Iniciativa ${index+1} de ${record.nome}`} value={Object.prototype.hasOwnProperty.call(drafts,entry.chave)?drafts[entry.chave]:entry.valor ?? ''} onChange={e=>onChange(entry.chave,e.target.value)} onBlur={()=>onConfirm(entry.chave,record.nome)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/>)}
  {(!npc || !turns.length) && <><input type="number" min="0" step="1" placeholder="+" aria-label={`Nova iniciativa de ${record.nome}`} disabled={busy} value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/><button type="button" aria-label={`Adicionar iniciativa de ${record.nome}`} disabled={busy || !valid} onClick={add}>+</button></>}
  {error && <span role="alert">{error}</span>}
 </span>;
}
