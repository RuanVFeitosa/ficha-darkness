import React, { useEffect, useId, useState } from 'react';
import '../../styles/DarknessColorPicker.css';

const palette=['#db5b52','#971f36','#e58642','#d6b56c','#86ad77','#3d9f9a','#5989c7','#8874ca','#be74ac','#e4ddd1','#787b85','#29232f'];
function toHsl(hex) {
  const [r,g,b]=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;
  let h=0;
  if(delta) h=(max===r?(g-b)/delta+(g<b?6:0):max===g?(b-r)/delta+2:(r-g)/delta+4)*60;
  return [Math.round(h),Math.round(delta?delta/(1-Math.abs(2*l-1))*100:0),Math.round(l*100)];
}
function toHex([h,s,l]) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');}).join('');
}

export default function DarknessColorPicker({label,value,onChange}) {
  const id=useId();
  const [draft,setDraft]=useState(value);
  const [hsl,setHsl]=useState(()=>toHsl(value));
  useEffect(()=>{setDraft(value);setHsl(previous=>toHex(previous)===value?previous:toHsl(value));},[value]);
  function select(hex){setDraft(hex);setHsl(toHsl(hex));onChange(hex);}
  function adjust(index,value){const next=hsl.map((current,i)=>i===index?Number(value):current);setHsl(next);onChange(toHex(next));}
  return <fieldset className="darkness-color-picker" style={{'--picker-color':value,'--picker-hue':`hsl(${hsl[0]} 100% 50%)`}}>
    <legend>{label}</legend>
    <div className="dcp-swatches" role="group" aria-label={`Paleta: ${label}`}>
      {palette.map(hex=><button type="button" key={hex} style={{background:hex}} aria-label={`${label}: ${hex}`} aria-pressed={hex===value.toLowerCase()} onClick={()=>select(hex)}/>)}
    </div>
    <div className="dcp-sliders">{['Tom','Saturação','Luminosidade'].map((name,index)=><label key={name}>{name}<input className={`dcp-range dcp-range-${index}`} type="range" aria-label={`${name}: ${label}`} min="0" max={index===0?359:100} value={hsl[index]} onChange={event=>adjust(index,event.target.value)}/></label>)}</div>
    <div className="dcp-hex"><i aria-hidden="true"/><label htmlFor={id}>HEX</label><input id={id} aria-label={label} type="text" spellCheck={false} maxLength={7} value={draft} onChange={event=>{const text=event.target.value;setDraft(text);if(/^#[0-9a-f]{6}$/i.test(text)){setHsl(toHsl(text));onChange(text.toLowerCase());}}} onBlur={()=>setDraft(value)}/></div>
  </fieldset>;
}
