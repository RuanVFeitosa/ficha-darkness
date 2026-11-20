import React from 'react';

export default function PressureDice({value,onChange,disabled,label='Pressão',tone='pressure',max=5}) {
  return <div className={`pd-pressure-picker pd-dice-${tone}`} role="group" aria-label={`Dados de ${label}`}><span>{label.toUpperCase()}</span><div>{Array.from({length:max},(_,index)=><button type="button" key={index} className={index<value?'is-active':''} aria-label={`${label}: ${index+1} dado${index?'s':''}`} aria-pressed={index<value} disabled={disabled} onClick={()=>onChange(index<value?index:index+1)}><span className="pd-pressure-cube" aria-hidden="true">{Array.from({length:6},(_,pip)=><i key={pip}/>)}</span></button>)}</div></div>;
}
