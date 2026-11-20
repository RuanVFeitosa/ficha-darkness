import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import DarknessColorPicker from '../ui/DarknessColorPicker';

export function pavorColorsStyle(colors) {
  return {'--pavor-primary':colors?.primary || '#db5b52','--pavor-glow':colors?.glow || '#e14d43'};
}

export default function PavorControls({sheet,setSheet,rolling}) {
  const [choosing,setChoosing]=useState(false);
  const [initialDie,setInitialDie]=useState(6);
  const [colors,setColors]=useState({primary:'#db5b52',glow:'#e14d43'});
  function activate(chosen,startingDie=6) {
    setSheet(previous=>{
      const steps=[4,6,8,10,12],pavor=previous.pavor || {};
      return {...previous,pavor:{...pavor,active:true,sides:pavor.active?steps[Math.min(4,steps.indexOf(pavor.sides || 6)+1)]:startingDie,...(chosen?{colors:chosen}:{})}};
    });
    setChoosing(false);
  }
  const pavor=sheet.pavor;
  const steps=[4,6,8,10,12];
  const currentIndex=pavor?.active?steps.indexOf(pavor.sides || 6):-1;
  function chooseDie(sides) {
    if(rolling)return;
    if(!pavor?.active){setInitialDie(sides);if(pavor?.colors)activate(undefined,sides);else setChoosing(true);return;}
    setSheet(previous=>{
      if(!previous.pavor?.active)return previous;
      const cost=Math.max(0,steps.indexOf(previous.pavor.sides)-steps.indexOf(sides));
      if(previous.hope<cost)return previous;
      return {...previous,hope:previous.hope-cost,pavor:{...previous.pavor,sides}};
    });
  }
  return <section className="pd-pavor-control" aria-label="Pavor" title={pavor?.active?'Anula dados menores que ele. Tirar 1 encerra o efeito.':'Receber o efeito adiciona um dado de Pavor aos testes.'}>
    <div className="pd-pavor-meter-heading"><span>III / PAVOR</span><div><button type="button" aria-label="Controlar · 1 PE" title="Reduzir um passo · custa 1 PE" disabled={rolling||!pavor?.active||sheet.hope<1||pavor.sides<=4} onClick={()=>chooseDie(steps[currentIndex-1])}>−</button><strong>{pavor?.active?`d${pavor.sides || 6}`:'—'}</strong><small>/ d12</small><button type="button" aria-label={pavor?.active?'Aumentar Pavor':'Receber Pavor'} title={pavor?.active?'Aumentar Pavor em um passo':'Receber Pavor · escolha também qualquer dado na escala'} disabled={rolling||(pavor?.active&&pavor.sides>=12)} onClick={()=>!pavor?.active?chooseDie(6):pavor?.colors?activate():setChoosing(true)}>+</button></div></div>
    <p>{pavor?.active?'Anula dados menores que ele. Tirar 1 encerra o efeito.':'Receber o efeito adiciona um dado de Pavor aos testes.'}</p>
    <div className="pd-pavor-seals" role="group" aria-label="Graus de Pavor">{steps.map((sides,index)=>{
      const cost=Math.max(0,currentIndex-index);
      return <button type="button" key={sides} className={`${pavor?.active&&index<=currentIndex?'is-filled ':''}${pavor?.active&&index===currentIndex?'is-current':''}`} aria-label={`Pavor d${sides}${cost?` · controlar por ${cost} PE`:''}`} aria-pressed={Boolean(pavor?.active&&sides===pavor.sides)} title={!pavor?.active?`Ativar Pavor com d${sides}`:cost?`Controlar por ${cost} PE`:`Pavor d${sides}`} disabled={rolling||cost>sheet.hope} onClick={()=>chooseDie(sides)}><svg viewBox="0 0 44 52" aria-hidden="true"><path d="M22 3 41 26 22 49 3 26Z"/><path d="M22 13 32 26 22 39 12 26Z"/></svg><span>d{sides}</span></button>;
    })}</div>
    {pavor?.active&&<div className="pd-pavor-meter-footer"><small>Controlar: 1 PE por passo</small><button type="button" disabled={rolling} onClick={()=>setSheet(previous=>({...previous,pavor:{...previous.pavor,active:false,sides:6}}))}>Encerrar efeito</button></div>}
    {choosing&&createPortal(<div className="espiral-app protocolo-app pd-pavor-portal" style={{display:'contents','--es-text':sheet.temaFicha?.texto || '#e9e4da','--es-bg':sheet.temaFicha?.fundo || '#080808','--es-line':sheet.temaFicha?.borda || '#34302d','--es-surface':sheet.temaFicha?.secundaria || '#10100f'}}>
    <div className="es-roll-modal-backdrop pd-pavor-color-backdrop" onKeyDown={event=>{if(event.key==='Escape')setChoosing(false);}} onMouseDown={event=>{if(event.target===event.currentTarget)setChoosing(false);}}>
      <section className="es-attribute-picker pd-pavor-colors" role="dialog" aria-modal="true" aria-labelledby="pd-pavor-colors-title" style={pavorColorsStyle(colors)}>
        <span className="es-eyebrow">A COR DO SEU MEDO</span>
        <h2 id="pd-pavor-colors-title">Seu Pavor</h2>
        <p>Escolha as cores do halo e dos dados. Elas ficam salvas neste personagem.</p>
        <div className="pd-pavor-color-preview" aria-hidden="true"><i>{initialDie}</i><span>PAVOR · d{initialDie}</span></div>
        <div className="pd-pavor-color-fields"><DarknessColorPicker label="Cor dos dados" value={colors.primary} onChange={primary=>setColors(previous=>({...previous,primary}))}/><DarknessColorPicker label="Cor do halo" value={colors.glow} onChange={glow=>setColors(previous=>({...previous,glow}))}/></div>
        <div className="es-attribute-picker-actions"><button type="button" autoFocus onClick={()=>setChoosing(false)}>Cancelar</button><button type="button" className="confirm" onClick={()=>activate(colors,initialDie)}>Salvar e ativar Pavor</button></div>
      </section>
    </div></div>,document.body)}
  </section>;
}
