import { espiralDiceText } from '../utils/espiralDice';
import React,{useEffect,useRef,useState} from 'react';
export function RollHistory({rolls=[]}) {
 return <div className="tt3-shared-roll-history">{rolls.length ? rolls.map(roll=><article key={roll.id}><div><strong>{roll.autor_nome || 'Jogador'}</strong><small>{roll.detalhes?.sistema === 'espiral' ? espiralDiceText(roll.expressao || 'Teste') : roll.expressao || 'Teste'}</small>{roll.detalhes?.difficulty !== undefined && <small>{roll.detalhes.context || 'Dificuldade'} · {roll.detalhes.difficulty} · {roll.detalhes.outcome}</small>}{roll.criado_em && <time>{new Date(roll.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time>}</div><b>{roll.resultado}</b></article>) : <p>Nenhuma rolagem nesta campanha.</p>}</div>;
}
export default function RollNotifications({rolls=[],mestre=false}) {
 const known=useRef(null),timers=useRef([]);
 const [recent,setRecent]=useState([]);
 useEffect(()=>{
  if(!known.current){known.current=new Set(rolls.map(roll=>roll.id));return;}
  const fresh=rolls.filter(roll=>!known.current.has(roll.id));
  if(!fresh.length)return;
  fresh.forEach(roll=>known.current.add(roll.id));
  setRecent(previous=>[...fresh,...previous].slice(0,3));
  timers.current.push(setTimeout(()=>setRecent(previous=>previous.filter(roll=>!fresh.some(item=>item.id===roll.id))),7000));
 },[rolls]);
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 if(!recent.length)return null;
 return <aside className={`tt3-roll-popups ${mestre?'for-master':'for-player'}`} aria-label="Rolagens recentes" aria-live="polite">{recent.map(roll=><article key={roll.id}><div><strong>{roll.autor_nome || 'Jogador'}</strong><small>{roll.detalhes?.sistema === 'espiral' ? espiralDiceText(roll.expressao || 'Teste') : roll.expressao || 'Teste'}</small>{roll.detalhes?.outcome && <small>{mestre ? `${roll.detalhes.context || 'Dificuldade'} · ${roll.detalhes.difficulty} · ` : ''}{roll.detalhes.outcome}</small>}</div><b>{roll.resultado}</b><button type="button" aria-label="Fechar rolagem" onClick={()=>setRecent(previous=>previous.filter(item=>item.id!==roll.id))}>×</button></article>)}</aside>;
}