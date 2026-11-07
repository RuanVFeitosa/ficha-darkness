import {useEffect} from 'react';
import {adjustCameraSpeed} from '../../utils/cameraSpeed';

export default function useCameraSpeedShortcut(setSpeed,setMotion,enabled=true,selector='.tt3 canvas') {
 useEffect(()=>{
  if(!enabled) return;
  const onWheel=event=>{
   const delta=event.deltaY || (event.shiftKey ? event.deltaX : 0);
   if((!event.ctrlKey && !(event.shiftKey && setMotion)) || !delta || !event.target?.matches?.(selector)) return;
   event.preventDefault();
   event.stopImmediatePropagation();
   if(event.ctrlKey) setSpeed(current=>adjustCameraSpeed(current,delta<0 ? 1 : -1));
   else setMotion(current=>({...current,roll:Math.max(-45,Math.min(45,(Number(current.roll)||0)+(delta<0 ? 1 : -1)))}));
  };
  window.addEventListener('wheel',onWheel,{capture:true,passive:false});
  return ()=>window.removeEventListener('wheel',onWheel,true);
 },[setSpeed,setMotion,enabled,selector]);
}
