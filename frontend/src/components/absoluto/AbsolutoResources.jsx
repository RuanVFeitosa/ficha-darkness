import React,{useEffect,useState} from 'react';
import AbsolutoMedo from './AbsolutoMedo';

function ResourceValue({value,onCommit,...props}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const commit=()=>{if(draft.trim()==='' || !Number.isFinite(Number(draft))){setDraft(String(value));return;}const next=Math.min(props.max===undefined ? Infinity : Number(props.max),Math.max(0,Math.floor(Number(draft))));onCommit(next);setDraft(String(next));};
 return <input {...props} type="number" value={draft} onChange={event=>setDraft(event.target.value)} onBlur={commit} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();if(event.key==='Escape'){setDraft(String(value));}}}/>;
}
export function ResourceSeal({name,kind,resource,onValue,onMax,onStep}){
 const ratio=resource.max>0 ? Math.max(0,Math.min(1,resource.atual/resource.max)) : 0;
 const path=kind==='sanity' ? 'M80 12 128 32 148 80 128 128 80 148 32 128 12 80 32 32Z' : 'M80 10 151 137H9Z';
 return <section className={`abs-resource-seal is-${kind}`} aria-label={name}>
  <header><span>{kind==='sanity' ? 'I' : 'II'}</span><h3>{name}</h3></header>
  <div className="abs-seal-dial">
   <svg viewBox="0 0 160 160" aria-hidden="true"><path className="abs-seal-orbit" d={path}/><path className="abs-seal-track" pathLength="100" d={path}/><path className="abs-seal-progress" pathLength="100" strokeDasharray={`${ratio*100} 100`} d={path}/>{kind==='sanity' ? <path className="abs-seal-inner" d="M80 26 134 80 80 134 26 80Z M80 26V40 M134 80H120 M80 134V120 M26 80H40"/> : <path className="abs-seal-inner" d="M80 35 126 123H34Z M80 143V151 M4 140 13 147 M156 140 147 147"/>}</svg>
   <div className="abs-seal-value"><ResourceValue aria-label={`${name} atual`} min="0" max={resource.max} value={resource.atual} onCommit={value=>onValue(Math.min(resource.max,value))}/><span>{kind==='sanity' ? 'LUCIDEZ' : 'VÍNCULO'}</span></div>
  </div>
  <div className="abs-seal-adjust"><button type="button" aria-label={`Diminuir ${name}`} onClick={()=>onStep(-1)}>−</button><label>de <ResourceValue aria-label={`${name} máxima`} min="0" value={resource.max} onCommit={onMax}/></label><button type="button" aria-label={`Aumentar ${name}`} onClick={()=>onStep(1)}>+</button></div>
 </section>;
}
export default function AbsolutoResources({personagem,setPersonagem,onSanity,onHope,onSanityStep,onHopeStep,showFear=true}){
 const maximum=(key,max)=>setPersonagem(p=>({...p,[key]:{...p[key],max,atual:Math.min(p[key].atual,max)}}));
 return <div className="sanidade-completa abs-resource-panel abs-resource-seals"><ResourceSeal name="Sanidade" kind="sanity" resource={personagem.sanidade} onValue={onSanity} onMax={value=>maximum('sanidade',value)} onStep={onSanityStep}/><ResourceSeal name="Esperança" kind="hope" resource={personagem.esperanca} onValue={onHope} onMax={value=>maximum('esperanca',value)} onStep={onHopeStep}/>{showFear && <AbsolutoMedo personagem={personagem} setPersonagem={setPersonagem}/>}</div>;
}
