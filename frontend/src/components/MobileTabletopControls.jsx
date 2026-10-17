import React, { useEffect, useRef, useState } from "react";
export default function MobileTabletopControls({enabled,onMoveStart}) {
 const pending=useRef(null);const held=useRef(new Set());const pointer=useRef(null);const [offset,setOffset]=useState([0,0]);
 const stop=() => {clearTimeout(pending.current);for(const key of held.current) window.dispatchEvent(new KeyboardEvent("keyup",{key}));held.current.clear();pointer.current=null;setOffset([0,0]);};
 useEffect(() => {if(!enabled) stop();window.addEventListener("blur",stop);return () => {window.removeEventListener("blur",stop);stop();};},[enabled]);
 const move=event => {
  if(pointer.current!==event.pointerId) return;
  const bounds=event.currentTarget.getBoundingClientRect();
  const x=event.clientX-bounds.left-bounds.width/2,y=event.clientY-bounds.top-bounds.height/2;
  const length=Math.hypot(x,y),factor=Math.min(1,32/Math.max(length,1));setOffset([x*factor,y*factor]);
  const next=new Set();if(x>12) next.add("d");if(x<-12) next.add("a");if(y>12) next.add("s");if(y<-12) next.add("w");
  for(const key of held.current) if(!next.has(key)) window.dispatchEvent(new KeyboardEvent("keyup",{key}));
  for(const key of next) if(!held.current.has(key)) window.dispatchEvent(new KeyboardEvent("keydown",{key}));
  held.current=next;
 };
 return <div className="tt3-mobile-joystick" role="group" aria-label="Controle de movimento" onPointerDown={event => {if(!enabled || pointer.current!==null) return;event.preventDefault();pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);onMoveStart?.();const initial={pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,currentTarget:event.currentTarget};pending.current=setTimeout(() => move(initial),0);}} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:"translate("+offset[0]+"px,"+offset[1]+"px)"}}/></div>;
}
