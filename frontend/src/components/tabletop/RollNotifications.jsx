import { espiralDiceText } from '../../utils/espiralDice';
import React,{useEffect,useRef,useState} from 'react';
export function RollHistory({rolls=[]}) {
 return <div className="tt3-shared-roll-history">{rolls.length ? rolls.map(roll=><article key={roll.id}><div><strong>{roll.autor_nome || 'Jogador'}</strong><small>{roll.detalhes?.sistema === 'espiral' ? espiralDiceText(roll.expressao || 'Teste') : roll.expressao || 'Teste'}</small>{roll.detalhes?.difficulty !== undefined && <small>{roll.detalhes.context || 'Dificuldade'} · {roll.detalhes.difficulty} · {roll.detalhes.outcome}</small>}{roll.criado_em && <time>{new Date(roll.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time>}</div><b>{roll.resultado}</b></article>) : <p>Nenhuma rolagem nesta campanha.</p>}</div>;
}
export function notificationDice(roll) {
 const detail=roll.detalhes || {};
 const sides=Number(detail.faces || detail.sides || String(roll.expressao || '').match(/d(\d+)/i)?.[1]) || 20;
 const source=detail.dadosDetalhados?.length ? detail.dadosDetalhados : detail.dados?.length ? detail.dados : detail.dice?.length ? detail.dice : detail.rolagens?.length ? detail.rolagens : [roll.resultado];
 const dice=source.map(die => ({value:Number(typeof die==='object' ? die.valor ?? die.value : die),sides:Number(die?.faces || die?.sides) || sides})).filter(die => Number.isFinite(die.value));
 return [...dice,...(Array.isArray(detail.pressure) ? detail.pressure.map(value => ({value,sides:6,pressure:true})) : [])];
}
function FloatingRoll({roll}) {
 const [rolling,setRolling]=useState(true);
 useEffect(() => {const timer=setTimeout(() => setRolling(false),1200);return () => clearTimeout(timer);},[]);
 const detail=roll.detalhes || {};
 const title=detail.tipo==='dano' ? 'Dano' : detail.outcome || (detail.versaoRegras==='1.0' ? detail.critico ? 'Crítico' : detail.sucesso ? 'Sucesso' : 'Falha' : 'Resultado');
 return <article className={`tt3-floating-roll ${rolling ? 'is-rolling' : 'is-revealed'}`} aria-label={`Rolagem de ${roll.autor_nome || 'Jogador'}`}>
  <div className="tt3-floating-dice">{notificationDice(roll).map((die,index) => <div key={index} className={`tt3-floating-die${die.pressure ? ' is-pressure' : ''}`} style={{'--die-delay':`${index*55}ms`}} aria-label={rolling ? 'Dado rolando' : `d${die.sides}: ${die.value}`}>
   <svg viewBox="0 0 100 100" aria-hidden="true"><polygon points={die.sides===4 ? '50,7 95,88 5,88' : die.sides===6 ? '20,12 80,12 92,24 92,80 80,92 20,92 8,80 8,24' : '50,4 94,28 94,74 50,97 6,74 6,28'}/>{die.sides!==6 && die.sides!==4 && <path d="M50 4 24 70 76 70 50 4 M6 28 24 70 50 97 76 70 94 28"/>}</svg>
   <span aria-hidden="true">{rolling ? '?' : die.value}</span>
  </div>)}</div>
  {!rolling && <h2 className={/falha|fracasso/i.test(title) ? 'is-failure' : /sucesso|crítico/i.test(title) ? 'is-success' : ''}>{title}</h2>}
 </article>;
}
export default function RollNotifications({rolls=[]}) {
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
 return <aside className="tt3-roll-popups tt3-transparent-rolls" aria-label="Rolagens recentes" aria-live="polite">{recent.map(roll=><FloatingRoll key={roll.id} roll={roll}/>)}</aside>;
}
