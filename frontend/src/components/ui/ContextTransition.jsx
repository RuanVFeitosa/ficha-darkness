import React, {useLayoutEffect,useRef,useState} from 'react';
import PageTransition from '../../pages/pageTransition';

export default function ContextTransition({contextKey,enabled=true}) {
 const previous=useRef(contextKey);
 const [sequence,setSequence]=useState(0);
 const [active,setActive]=useState(false);
 useLayoutEffect(() => {
   if(previous.current===contextKey) {if(!enabled) setActive(false);return;}
   previous.current=contextKey;
   if(!enabled) {setActive(false);return;}
   setSequence(value => value+1);
   setActive(true);
   const timer=setTimeout(() => setActive(false),1000);
   return () => clearTimeout(timer);
 },[contextKey,enabled]);
 return <PageTransition key={sequence} active={active} sistema="espiral"/>;
}