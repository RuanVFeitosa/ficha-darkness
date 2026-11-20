import React, { useEffect, useState } from 'react';
import RollingDie from './RollingDie';

export default function ProtocolRollResult({ result, rolling, onClose }) {
  const [dismissal,setDismissal]=useState(null);
  useEffect(()=>{
    if(rolling || !result.pavor?.cancelled.some(Boolean)) return;
    const fade=setTimeout(()=>setDismissal({result,stage:'fading'}),1100);
    const remove=setTimeout(()=>setDismissal({result,stage:'hidden'}),1550);
    return ()=>{clearTimeout(fade);clearTimeout(remove);};
  },[result,rolling]);
  const cancelledStage=!rolling && dismissal?.result===result ? dismissal.stage : null;
  const test=result.type!=='formula';
  const failed=!rolling && test && /^Falha/i.test(result.outcome || '');
  const dice=[...result.dice.map((value,index)=>({value,sides:result.sides,bonus:index>=result.dice.length-(result.bonusDice || 0)})),...result.pressure.map(value=>({value,sides:6,pressure:true})),...(result.extra||[]).map((value,index)=>({value,sides:result.extraDieSides?.[index] ?? result.extraSides,relationship:index===result.relationshipExtraIndex}))];
  return <div className={`pd-roll-result pd-roll-minimal${failed?' pd-roll-failed':''}`}>
    <h2 className="pd-roll-compact-title" id="es-roll-modal-title">{result.label}</h2>
    <button type="button" className="pd-roll-close" aria-label="Fechar rolagem" disabled={rolling} onClick={onClose}>×</button>
    <div className="pd-roll-dice" aria-label="Dados rolados" aria-busy={rolling}>{dice.map((die,index)=>cancelledStage==='hidden' && result.pavor?.cancelled[index] ? null : <div className={`pd-roll-die ${die.pressure?'pressure ':die.bonus?'bonus ':die.relationship?'relationship ':''}${rolling?'rolling':result.pavor?.cancelled[index]?`cancelled ${cancelledStage==='fading'?'is-dissolving':''}`:test&&die.value>=4?'hit':'miss'}`} key={index}>
      <RollingDie sides={die.sides} value={die.value} rolling={rolling} index={index}/>
      <span>{!rolling&&result.pavor?.cancelled[index]?'Anulado':!rolling&&test&&die.value>=4?'✓ Êxito':' '}</span>
      {die.pressure&&<small className="pd-pressure-label">Pressão</small>}{die.bonus&&<small className="pd-bonus-label">Bônus</small>}{die.relationship&&<small className="pd-relation-label">Relação</small>}
    </div>)}{result.pavor&&<div className="pd-roll-die dread"><RollingDie sides={result.pavor.sides} value={result.pavor.value} rolling={rolling} index={dice.length}/><span>{rolling?'Pavor':result.pavor.ends?'Pavor encerrado':'Pavor'}</span></div>}</div>
    {result.penaltyDice>0&&<div className="pd-roll-penalties" aria-label={`${result.penaltyDice} dado(s) retirado(s) por Penalidade`}>{Array.from({length:result.penaltyDice},(_,index)=><span className="pd-penalty-removed" key={index} aria-hidden="true"><span className="pd-pressure-cube">{Array.from({length:6},(_,pip)=><i key={pip}/>)}</span></span>)}<small>Penalidade · dados retirados</small></div>}
    {!rolling && result.pressure?.length>0 && result.pressureEffect && <p className="pd-roll-pressure-note">{result.pressureEffect.effect || ('Pressão · '+result.pressureEffect.stress+(result.pressureEffect.ones>=2?' · escolha a reação na faixa de Pressão':''))}</p>}
    <p className="pd-roll-compact-summary" role="status">{rolling?'Dados rolando':test?<><span>{result.successes} êxito(s). </span><strong>{result.outcome}</strong>{failed && Number.isFinite(result.difficulty)&&<small>Necessários: {result.difficulty} êxito(s)</small>}</>:`Total: ${result.total}`}</p>
  </div>;
}
