import React,{useEffect,useRef} from 'react';
import {normalizeTokenAnimation,tokenAnimationFrame} from '../../utils/tokenAnimation';

const animation=normalizeTokenAnimation({breathing:.008,sway:.006,speed:.85});

export default function HelenaToken(){
 const image=useRef(null);
 useEffect(()=>{
  let frame;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const paint=time=>{
   const motion=tokenAnimationFrame(time/1000,animation,'helena-merchant',reduced?.matches);
   if(image.current)image.current.style.transform=`rotate(${motion.rotation}rad) scale(${motion.scaleX},${motion.scaleY})`;
   if(!reduced?.matches)frame=requestAnimationFrame(paint);
  };
  const restart=()=>{cancelAnimationFrame(frame);paint(performance.now());};
  restart();reduced?.addEventListener?.('change',restart);
  return()=>{cancelAnimationFrame(frame);reduced?.removeEventListener?.('change',restart);};
 },[]);
 return <img ref={image} className="abs-store-shopkeeper" src="/loja-absoluto/helena.png" alt="Helena, responsável pelo arsenal" style={{transformOrigin:'50% 100%'}}/>;
}
