import React,{useMemo,useState} from 'react';
import {normalizeCutscene} from '../../utils/cutscene';
import CutsceneStage from './CutsceneStage';
import useCutsceneClock from './useCutsceneClock';
export function formatCutsceneTime(seconds){const value=Math.max(0,Math.floor(seconds)),hours=Math.floor(value/3600),minutes=Math.floor(value%3600/60),rest=String(value%60).padStart(2,'0');return hours?`${hours}:${String(minutes).padStart(2,'0')}:${rest}`:`${minutes}:${rest}`;}
export default function CutscenePlayer({project,autoPlay=true,controls=true}) {
 const p=useMemo(()=>normalizeCutscene(project),[project]),clock=useCutsceneClock(p.duration,p.loop,autoPlay);
 const [muted,setMuted]=useState(false),[blocked,setBlocked]=useState(false);
 return <div className="cs-player">
  <CutsceneStage project={p} time={clock.time} playing={clock.playing} muted={muted} onBlocked={()=>setBlocked(true)}/>
  {controls&&<div className="cs-player-controls">
   <input className="cs-player-progress" aria-label="Posição da reprodução" type="range" min={0} max={p.duration} step={.05} value={clock.time} onChange={event=>clock.setTime(Number(event.target.value))}/>
   <div className="cs-player-buttons">
   <button type="button" onClick={clock.toggle}>{clock.playing?'Pausar':'Reproduzir'}</button>
   <button type="button" onClick={clock.restart}>Reiniciar</button>
   <button type="button" onClick={()=>{setMuted(value=>!value);setBlocked(false);}}>{muted?'Ativar áudio':'Silenciar'}</button>
   <output>{formatCutsceneTime(clock.time)} <span>/ {formatCutsceneTime(p.duration)}</span></output>
   {blocked&&<button type="button" onClick={event=>{setBlocked(false);event.currentTarget.closest('.cs-player').querySelectorAll('audio').forEach(audio=>{audio.muted=false;audio.play()?.catch(()=>setBlocked(true));});setMuted(false);clock.setPlaying(true);}}>Ativar reprodução com áudio</button>}
   </div>
  </div>}
 </div>;
}
