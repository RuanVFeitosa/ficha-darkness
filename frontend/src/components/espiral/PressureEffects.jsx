import React,{useState} from 'react';
import {pressureEffects,PRESSURE_REACTIONS,applyPressureReaction,endPressureEffects} from '../../utils/pressureEffects';
import '../../styles/PressureEffects.css';
function Pending({item,sheet,setSheet,disabled}){
 const [reaction,setReaction]=useState(''),[reserve,setReserve]=useState('sanity'),[target,setTarget]=useState('');
 return <details className="pd-pressure-pending"><summary>{item.kind} · escolher reação</summary><div><label>Reação<select value={reaction} disabled={disabled} onChange={event=>setReaction(event.target.value)}><option value="">Escolher…</option>{PRESSURE_REACTIONS[item.kind].map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></label>{item.kind==='Ruptura'&&<label>Perder 2 pontos de<select value={reserve} disabled={disabled} onChange={event=>setReserve(event.target.value)}><option value="sanity">Sanidade</option><option value="hope">Esperança</option></select></label>}{reaction==='fixation'&&<label>Alvo<input value={target} disabled={disabled} onChange={event=>setTarget(event.target.value)}/></label>}<button type="button" disabled={disabled||!reaction||(reaction==='fixation'&&!target.trim())} onClick={()=>setSheet(previous=>applyPressureReaction(previous,item.id,reaction,reserve,target))}>Aplicar</button></div>{reaction&&<p>{PRESSURE_REACTIONS[item.kind].find(option=>option.id===reaction).effect}</p>}</details>;
}
export default function PressureEffects({sheet,setSheet,disabled}){
 const state=pressureEffects(sheet);
 return <section className="pd-pressure-effects" aria-label="Penalidades e efeitos de Pressão">
 {state.nextPenalty>0&&<span className="pd-pressure-effect is-abalo" role="status"><strong>Abalo</strong> −1 dado no próximo teste</span>}
 {state.conditions.map(item=><div className="pd-pressure-effect" key={item.key}><strong>{item.name}</strong><span>{item.effect}{item.target?' · '+item.target:''}</span>{item.conditional&&<select aria-label={'Modificador de '+item.name} disabled={disabled} value={item.modifier||0} onChange={event=>{const modifier=Number(event.target.value);setSheet(previous=>({...previous,pressureEffects:{...pressureEffects(previous),conditions:pressureEffects(previous).conditions.map(condition=>condition.key===item.key?{...condition,modifier}:condition)}}));}}><option value={0}>Sem ajuste</option><option value={1}>+1 neste teste</option><option value={-1}>−1 neste teste</option></select>}<button type="button" disabled={disabled} aria-label={'Encerrar '+item.name} onClick={()=>setSheet(previous=>({...previous,pressureEffects:{...pressureEffects(previous),conditions:pressureEffects(previous).conditions.filter(condition=>condition.key!==item.key)}}))}>×</button></div>)}
 {state.pending.map(item=><Pending key={item.id} item={item} sheet={sheet} setSheet={setSheet} disabled={disabled}/>)}
 {!state.nextPenalty&&!state.conditions.length&&!state.pending.length&&<small>Sem efeitos de Pressão</small>}
 {state.conditions.length>0&&<div className="pd-pressure-expiry"><button type="button" disabled={disabled} onClick={()=>setSheet(previous=>endPressureEffects(previous,'turn'))}>Encerrar efeitos de turno</button><button type="button" disabled={disabled} onClick={()=>setSheet(previous=>endPressureEffects(previous,'scene'))}>Fim da Cena</button></div>}
 </section>;
}
