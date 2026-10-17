import React, {useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import '../CSS/EvidenceImageViewer.css';
export default function EvidenceImageViewer({src,alt}) {
 const [fullscreen,setFullscreen]=useState(false);
 const [zoom,setZoom]=useState(1);
 const [offset,setOffset]=useState({x:0,y:0});
 const drag=useRef(null);
 const changeZoom=(value)=>{setZoom(Math.min(6,Math.max(1,value)));if(value<=1)setOffset({x:0,y:0});};
 const reset=()=>{setZoom(1);setOffset({x:0,y:0});};
 const view=<section className={`evidence-image-viewer ${fullscreen ? 'is-fullscreen' : ''}`} aria-label="Imagem da evidência" onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape' && fullscreen)setFullscreen(false);}} onKeyUp={event=>event.stopPropagation()}>
  <div className="evidence-image-toolbar">
   <button type="button" aria-label="Diminuir zoom" disabled={zoom===1} onClick={()=>changeZoom(zoom/1.25)}>−</button>
   <output aria-label="Zoom da evidência">{Math.round(zoom*100)}%</output>
   <button type="button" aria-label="Aumentar zoom" disabled={zoom===6} onClick={()=>changeZoom(zoom*1.25)}>+</button>
   <button type="button" onClick={reset}>Ajustar</button>
   <button type="button" autoFocus={fullscreen} onClick={()=>{reset();setFullscreen(!fullscreen);}}>{fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</button>
  </div>
  <div className="evidence-image-viewport" tabIndex={0} aria-label="Use a roda para ampliar e arraste para mover a evidência" style={{cursor:zoom>1?'grab':'default'}} onWheel={event=>{event.stopPropagation();changeZoom(zoom*(event.deltaY<0?1.1:1/1.1));}} onPointerDown={event=>{if(zoom<=1 || event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,offset};}} onPointerMove={event=>{if(!drag.current)return;setOffset({x:drag.current.offset.x+event.clientX-drag.current.x,y:drag.current.offset.y+event.clientY-drag.current.y});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
   <img src={src} alt={alt} draggable={false} style={{transform:`translate(${offset.x}px, ${offset.y}px) scale(${zoom})`}}/>
  </div>
  <small className="evidence-image-hint">Roda: zoom · arraste para mover · Ajustar: centralizar</small>
 </section>;
 return fullscreen ? createPortal(<div className="evidence-image-backdrop" role="dialog" aria-modal="true" aria-label={`Evidência: ${alt}`} onClick={event=>{if(event.target===event.currentTarget)setFullscreen(false);}}>{view}</div>,document.body) : view;
}