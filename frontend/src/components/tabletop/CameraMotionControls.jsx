import React,{useEffect,useState} from 'react';
import NumberInput from '../ui/NumberInput';
import {normalizeCameraMotion} from '../../utils/cameraMotion';
export {normalizeCameraMotion} from '../../utils/cameraMotion';

export const CAMERA_MOTION_KEY='darkness:tabletop:camera-motion';
function AngleField({label,hint,value,onChange,ariaLabel}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const step=amount=>onChange(Math.max(-45,Math.min(45,value+amount)));
 return <div className="tt3-motion-angle">
  <div><strong>{label}</strong><small>{hint}</small></div>
  <div className="tt3-motion-stepper">
   <button type="button" aria-label={`Diminuir inclinação ${label.toLowerCase()}`} disabled={value<=-45} onClick={()=>step(-1)}>−</button>
   <span className="tt3-motion-degree"><NumberInput hideArrows aria-label={ariaLabel} min="-45" max="45" step="0.5" value={draft} onChange={event=>{setDraft(event.target.value);if(event.target.value!=='' && Number.isFinite(Number(event.target.value)))onChange(Math.max(-45,Math.min(45,Number(event.target.value))));}} onBlur={()=>setDraft(String(value))}/><span>°</span></span>
   <button type="button" aria-label={`Aumentar inclinação ${label.toLowerCase()}`} disabled={value>=45} onClick={()=>step(1)}>+</button>
  </div>
 </div>;
}
export default function CameraMotionControls({value,onChange,cinematic=false}){
 const change=patch=>onChange(normalizeCameraMotion({...value,...patch}));
 return <details className="tt3-motion-controls">
  <summary>Balanço <span>{value.intensity===0 ? 'Desligado' : `${Math.round(value.intensity*100)}%`}</span></summary>
  <div className="tt3-motion-popover">
   <header className="tt3-motion-heading"><span>CÂMERA</span><strong>Movimento e inclinação</strong><small>{cinematic?'Ajuste o balanço e o enquadramento deste plano.':'Controle o movimento da câmera de toda a mesa.'}</small></header>
   <section className="tt3-motion-section">
    <div className="tt3-motion-section-title"><h3>Balanço natural</h3><span>{value.intensity===0 ? 'Desligado' : 'Ativo'}</span></div>
    <label className="tt3-motion-slider"><span>Intensidade<output>{Math.round(value.intensity*100)}%</output></span><input aria-label="Intensidade do balanço" type="range" min="0" max="3" step="0.05" value={value.intensity} onChange={event=>change({intensity:Number(event.target.value)})}/><small><span>Sutil</span><span>Intenso</span></small></label>
    <label className="tt3-motion-slider"><span>Ritmo<output>{value.speed.toLocaleString('pt-BR')}×</output></span><input aria-label="Ritmo do balanço" type="range" min="0.25" max="2" step="0.05" value={value.speed} onChange={event=>change({speed:Number(event.target.value)})}/><small><span>Lento</span><span>Rápido</span></small></label>
    <div className="tt3-motion-actions"><button type="button" onClick={()=>change({intensity:0})}>Desligar</button><button type="button" onClick={()=>change({intensity:1,speed:1})}>Restaurar</button></div>
   </section>
   <section className="tt3-motion-section">
    <div className="tt3-motion-section-title"><h3>Inclinação</h3><span>−45° a +45°</span></div>
    <AngleField label="Vertical" hint="Olhar para cima ou para baixo" ariaLabel="Inclinação vertical em graus" value={value.pitch??0} onChange={pitch=>change({pitch})}/>
    <AngleField label="Lateral" hint="Inclinar o horizonte · Shift + scroll" ariaLabel="Inclinação lateral em graus" value={value.roll??0} onChange={roll=>change({roll})}/>
    <button className="tt3-motion-level" type="button" onClick={()=>change({pitch:0,roll:0})}>Nivelar câmera · 0°</button>
   </section>
   <footer>{cinematic?'Balanço e inclinação salvos no clipe da cinemática.':'Balanço compartilhado · inclinação apenas na câmera do mestre'}</footer>
  </div>
 </details>;
}
