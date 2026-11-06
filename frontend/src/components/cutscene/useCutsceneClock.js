import {useEffect,useRef,useState} from 'react';
export default function useCutsceneClock(duration,loop=false,autoPlay=false) {
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(autoPlay),last=useRef(null);
 const currentTime=useRef(time);currentTime.current=time;
 useEffect(()=>{
  if(!playing){last.current=null;return;}
  let frame;
  const tick=now=>{const delta=last.current===null?0:(now-last.current)/1000;last.current=now;
   const next=currentTime.current+delta;
   if(next>=duration&&!loop){currentTime.current=duration;setTime(duration);setPlaying(false);return;}
   currentTime.current=loop?next%duration:next;setTime(currentTime.current);
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);last.current=null;};
 },[playing,duration,loop]);
 useEffect(()=>{setTime(current=>Math.min(current,duration));},[duration]);
 return {time,setTime,playing,setPlaying,toggle:()=>{if(time>=duration)setTime(0);setPlaying(value=>!value);},restart:()=>{setTime(0);setPlaying(true);}};
}
