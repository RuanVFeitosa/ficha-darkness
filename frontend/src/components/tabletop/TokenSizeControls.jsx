import React,{useEffect,useState} from 'react';
import NumberInput from '../ui/NumberInput';
const percent=scale=>Math.round((Number(scale)||.35)*1000)/10;
const limit=value=>Math.max(1,Math.min(300,value));
export default function TokenSizeControls({scale,onChange}){
 const value=percent(scale);
 const [draft,setDraft]=useState(String(value)),[editing,setEditing]=useState(false);
 useEffect(()=>{if(!editing)setDraft(String(value));},[value,editing]);
 const apply=next=>{const clamped=Math.round(limit(next)*10)/10;setDraft(String(clamped));onChange(clamped/100);};
 return <div className="tt3-token-size-control"><label htmlFor="tt3-token-size-percent">Tamanho do personagem <small>Porcentagem da escala original</small></label><div className="tt3-token-percent-field"><NumberInput id="tt3-token-size-percent" aria-label="Tamanho do token em porcentagem" min="1" max="300" step="0.1" value={draft} onFocus={()=>setEditing(true)} onChange={event=>{setDraft(event.target.value);const n=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(n)&&n>=1&&n<=300)onChange(Math.round(n*10)/1000);}} onBlur={()=>{apply(draft.trim()&&Number.isFinite(Number(draft))?Number(draft):value);setEditing(false);}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/><span aria-hidden="true">%</span></div><div className="tt3-token-size-actions">{[-5,-1,1,5].map(step=><button type="button" key={step} disabled={step<0?value<=1:value>=300} onClick={()=>apply(value+step)}>{step>0?'+':'−'}{Math.abs(step)}%</button>)}</div><small>Digite o valor exato, como 12,5%. Limites: 1% a 300%.</small></div>;
}
