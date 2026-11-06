import React,{useEffect,useMemo,useRef,useState} from 'react';
import {cutsceneLayerFrame,interpolatePose,limit,normalizeCutscene} from '../../utils/cutscene';
import {normalizeTokenAnimation,tokenAnimationFrame} from '../../utils/tokenAnimation';
import '../../styles/Cutscene.css';

function AudioClip({layer,time,playing,muted,onBlocked}) {
 const ref=useRef(null);
 useEffect(()=>{
  const audio=ref.current;if(!audio)return;
  const frame=cutsceneLayerFrame(layer,time);
  audio.volume=limit(layer.volume*(frame?.opacity || 0),0,1);audio.muted=muted;
  if(!frame || !playing){audio.pause();return;}
  const sync=()=>{if(Math.abs(audio.currentTime-(time-layer.start))>.35)try{audio.currentTime=Math.max(0,time-layer.start);}catch{}};
  sync();
  const result=audio.play();result?.catch(()=>onBlocked?.());
  audio.addEventListener('loadedmetadata',sync,{once:true});
  return()=>audio.removeEventListener('loadedmetadata',sync);
 },[time,playing,muted,layer,onBlocked]);
 useEffect(()=>{const audio=ref.current;return()=>audio?.pause();},[]);
 return <audio ref={ref} src={layer.src} preload="metadata"/>;
}
export default function CutsceneStage({project,time=0,playing=false,muted=true,selected,onSelect,onDrag,onBlocked}) {
 const p=useMemo(()=>normalizeCutscene(project),[project]),camera=interpolatePose(p.camera.from,p.camera.to,time/p.duration);
 const drag=useRef(null);
 const [dragPreview,setDragPreview]=useState(null);
 const [reduced,setReduced]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false);
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const update=()=>setReduced(media.matches);media.addEventListener?.('change',update);return()=>media.removeEventListener?.('change',update);},[]);
 return <div className="cs-stage" style={{background:p.background}} aria-label="Palco da cutscene">
  <div className="cs-camera" style={{transform:`translate(${(50-camera.x)*camera.scale}%,${(50-camera.y)*camera.scale}%) scale(${camera.scale}) rotate(${camera.rotation}deg)`}}>
   {p.layers.filter(layer=>layer.type!=='audio').map(layer=>{
    let frame=cutsceneLayerFrame(layer,time);if(!frame)return null;
    if(dragPreview?.id===layer.id)frame={...frame,...dragPreview.position};
    const animation=normalizeTokenAnimation(layer.animation || {enabled:false});
    const motion=tokenAnimationFrame(time,animation,layer.id,reduced);
    return <div key={layer.id} className={`cs-layer ${selected===layer.id?'is-selected':''} cs-layer-${layer.type}`} style={{left:`${frame.x}%`,top:`${frame.y}%`,width:`${layer.width}%`,opacity:frame.opacity,
     transform:`translate(-50%,-50%) scale(${frame.scale}) rotate(${frame.rotation}deg)`,pointerEvents:onSelect?'auto':'none'}}
     onPointerDown={event=>{if(!onSelect)return;event.stopPropagation();onSelect(layer.id);if(layer.locked||!onDrag)return;const bounds=event.currentTarget.closest('.cs-stage').getBoundingClientRect();drag.current={x:event.clientX,y:event.clientY,from:frame,bounds};event.currentTarget.setPointerCapture(event.pointerId);}}
     onPointerMove={event=>{if(!drag.current)return;const {x,y,from,bounds}=drag.current;setDragPreview({id:layer.id,position:{x:from.x+(event.clientX-x)/bounds.width*100/camera.scale,y:from.y+(event.clientY-y)/bounds.height*100/camera.scale}});}}
     onPointerUp={event=>{if(!drag.current)return;const {x,y,from,bounds}=drag.current;drag.current=null;setDragPreview(null);onDrag(layer.id,{x:from.x+(event.clientX-x)/bounds.width*100/camera.scale,y:from.y+(event.clientY-y)/bounds.height*100/camera.scale});}}
     onPointerCancel={()=>{drag.current=null;setDragPreview(null);}}>
     {layer.type==='text'?<div className="cs-text" style={{color:layer.color,fontSize:`${layer.fontSize}cqw`}}>{frame.text}</div>:
      <div style={{transform:`scale(${motion.scaleX},${motion.scaleY}) rotate(${motion.rotation}rad)`}}>
       <img src={layer.src} alt={layer.name} draggable={false}/>
       {animation.closedImage&&motion.blink>.01&&<div className="cs-blink" style={{opacity:motion.blink,clipPath:`inset(${animation.region.y*100}% ${(1-animation.region.x-animation.region.width)*100}% ${(1-animation.region.y-animation.region.height)*100}% ${animation.region.x*100}%)`}}><img src={animation.closedImage} alt="" style={{height:'100%',objectFit:'fill',transform:`translate(${animation.closedTransform.x*100}%,${animation.closedTransform.y*100}%) scale(${animation.closedTransform.scale})`}}/></div>}
      </div>}
    </div>;
   })}
  </div>
  {p.letterbox&&<><div className="cs-letterbox cs-letterbox-top"/><div className="cs-letterbox cs-letterbox-bottom"/></>}
  {p.layers.filter(layer=>layer.type==='audio').map(layer=><AudioClip key={layer.id} layer={layer} time={time} playing={playing} muted={muted} onBlocked={onBlocked}/>)}
 </div>;
}
