import React from 'react';
import NumberInput from '../ui/NumberInput';
export const PLAYER_CAMERA_DISTANCE_KEY='darkness:tabletop:player-camera-distance';
export const normalizePlayerDistance=(value,minimum=.2)=>value!==null && value!=='' && Number.isFinite(Number(value)) ? Math.max(minimum,Math.min(20,Number(value))) : Math.max(minimum,1.5);
export const minimumPlayerDistance=height=>Math.min(20,Math.max(.2,Math.ceil((Number(height)||.65)*.8*10)/10));
export default function PlayerCameraDistance({value,onChange,minimum=.2}){
 const change=next=>onChange(normalizePlayerDistance(next,minimum));
 return <details className="tt3-motion-controls"><summary>Distância <span>{value.toLocaleString('pt-BR')} m</span></summary><div className="tt3-motion-popover tt3-distance-popover"><header className="tt3-motion-heading"><strong>Distância do personagem</strong><small>Aproxime ou afaste a câmera.</small></header><section className="tt3-motion-section"><label className="tt3-motion-slider"><span>Perto <output>{value.toLocaleString('pt-BR')} m</output></span><input aria-label="Ajustar distância da câmera" type="range" min={minimum} max="20" step="0.1" value={value} onChange={event=>change(event.target.value)}/><small><span>{minimum.toLocaleString('pt-BR')} m</span><span>20 m</span></small></label><label className="tt3-motion-angle"><strong>Distância exata em metros</strong><span className="tt3-motion-degree"><NumberInput hideArrows aria-label="Distância da câmera em metros" min={minimum} max="20" step="0.1" value={value} onChange={event=>{if(event.target.value!=='')change(event.target.value);}}/><span>m</span></span></label><button type="button" onClick={()=>change(1.5)}>Restaurar · 1,5 m</button></section></div></details>;
}
