import React from 'react';
import '../../styles/EspiralDice.css';
import { normalizeEspiralDice } from '../../utils/espiralDice';
export function EspiralDiceInput({ value, ...props }) {
 return <span className="espiral-dice-input"><input {...props} value={normalizeEspiralDice(value)} /><span className="espiral-dice-input-preview" aria-hidden="true"><EspiralDice value={value} /></span></span>;
}
export function EspiralDie({sides}) {
 return <span className={'espiral-die espiral-die-'+sides} role="img" aria-label={'Dado de '+sides+' faces'}><span>{sides}</span></span>;
}
export default function EspiralDice({value}) {
 const parts=String(value ?? '').split(/([△⬡◇⬟⬢d](?:12|10|8|6|4)\b)/gi);
 return <>{parts.map((part,i)=>/^[△⬡◇⬟⬢d](12|10|8|6|4)$/i.test(part)?<EspiralDie key={i} sides={Number(part.slice(1))}/>:part)}</>;
}
