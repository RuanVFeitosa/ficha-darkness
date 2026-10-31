import React from 'react';
import NumberInput from '../ui/NumberInput';
export const PLAYER_CAMERA_DISTANCE_KEY='darkness:tabletop:player-camera-distance';
export const normalizePlayerDistance=value=>Number.isFinite(Number(value)) ? Math.max(.2,Math.min(20,Number(value))) : 1.5;
export default function PlayerCameraDistance({value,onChange}){
 const change=next=>onChange(normalizePlayerDistance(next));
 return <details className="tt3-motion-controls"><summary>Distância <span>{value.toLocaleString('pt-BR')} m</span></summary><div className="tt3-motion-popover tt3-distance-popover"><header className="tt3-motion-heading"><strong>Distância do personagem</strong><small>Aproxime ou afaste a câmera.</small></header><section className="tt3-motion-section"><label className="tt3-motion-slider"><span>Perto <output>{value.toLocaleString('pt-BR')} m</output></span><input aria-label="Ajustar distância da câmera" type="range" min="0.2" max="20" step="0.1" value={value} onChange={event=>change(event.target.value)}/><small><span>0,2 m</span><span>20 m</span></small></label><label className="tt3-motion-angle"><strong>Distância exata em metros</strong><span className="tt3-motion-degree"><NumberInput hideArrows aria-label="Distância da câmera em metros" min="0.2" max="20" step="0.1" value={value} onChange={event=>{if(event.target.value!=='')change(event.target.value);}}/><span>m</span></span></label><button type="button" onClick={()=>change(1.5)}>Restaurar · 1,5 m</button></section></div></details>;
}
