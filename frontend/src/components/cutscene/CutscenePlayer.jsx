import React,{useMemo,useState} from 'react';
import {normalizeCutscene} from '../../utils/cutscene';
import CutsceneStage from './CutsceneStage';
import useCutsceneClock from './useCutsceneClock';
export default function CutscenePlayer({project,autoPlay=true}) {
 const p=useMemo(()=>normalizeCutscene(project),[project]),clock=useCutsceneClock(p.duration,p.loop,autoPlay);
 const [muted,setMuted]=useState(false),[blocked,setBlocked]=useState(false);
 return <div className="cs-player">
  <CutsceneStage project={p} time={clock.time} playing={clock.playing} muted={muted} onBlocked={()=>setBlocked(true)}/>
  <div className="cs-player-controls">
   <button type="button" onClick={clock.toggle}>{clock.playing?'Pausar':'Reproduzir'}</button>
   <button type="button" onClick={clock.restart}>Reiniciar</button>
   <button type="button" onClick={()=>{setMuted(value=>!value);setBlocked(false);}}>{muted?'Ativar áudio':'Silenciar'}</button>
   <output>{clock.time.toFixed(1)} / {p.duration}s</output>
   {blocked&&<button type="button" onClick={event=>{setBlocked(false);event.currentTarget.closest('.cs-player').querySelectorAll('audio').forEach(audio=>{audio.muted=false;audio.play()?.catch(()=>setBlocked(true));});setMuted(false);clock.setPlaying(true);}}>Ativar reprodução com áudio</button>}
  </div>
 </div>;
}
