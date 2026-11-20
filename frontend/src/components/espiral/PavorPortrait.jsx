import React from 'react';
import { EspiralDie } from './EspiralDice';

export default function PavorPortrait({ pavor,symbolSrc='/simbolo-darkness.png' }) {
  const active=Boolean(pavor?.active);
  const sides = [4,6,8,10,12].includes(pavor?.sides) ? pavor.sides : 6;
  const intensity = [4,6,8,10,12].indexOf(sides);
  return <div className="pd-pavor-transition" data-active={active} aria-hidden={!active}>
    <div className="pd-pavor-aura" data-intensity={intensity} style={{'--pavor-opacity':.45+intensity*.12,'--pavor-pulse':`${5-intensity*.55}s`,'--pavor-tremor':`${.4+intensity*.35}px`,'--pavor-echo-opacity':.12+intensity*.035}} aria-hidden="true">
      <img src={symbolSrc} alt="" style={{'--pd-pavor-symbol':`url("${symbolSrc}")`}}/>
      <img className="pd-pavor-echo pd-pavor-echo-one" src={symbolSrc} alt="" style={{'--pd-pavor-symbol':`url("${symbolSrc}")`}}/>
      <img className="pd-pavor-echo pd-pavor-echo-two" src={symbolSrc} alt="" style={{'--pd-pavor-symbol':`url("${symbolSrc}")`}}/>
    </div>
    <div className="pd-pavor-dice-ladder" role="group" aria-label="Escala de Pavor"><small>PAVOR</small>{[4,6,8,10,12].map((die,index)=><div key={die} className={die===sides?'is-current':index<intensity?'is-past':''} role="img" aria-label={die===sides?`Pavor ativo: d${die}`:`Pavor d${die}`}><EspiralDie sides={die}/><span>d{die}</span>{die===sides&&<i aria-hidden="true"/>}</div>)}</div>
  </div>;
}
