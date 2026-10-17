import {croppedTokenData} from '../utils/tokenImageSizing';
import '../CSS/TokenAnimationPreview.css';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {normalizeTokenAnimation,tokenAnimationFrame} from '../utils/tokenAnimation';
export function fitTokenImage(width,height,aspect) {
 const safeAspect=Math.max(.01,Number(aspect)||1),availableWidth=Math.max(1,width)*.86,availableHeight=Math.max(1,height)*.86;
 const fittedHeight=Math.min(availableHeight,availableWidth/safeAspect);
 return {width:fittedHeight*safeAspect,height:fittedHeight};
}
export default function TokenAnimationPreview({image,animation,id,aspect=2/3,fit="contain",alt="Prévia animada do token",alignmentPreview=false}) {
 const host=useRef(null),body=useRef(null),eyes=useRef(null);
 const [size,setSize]=useState({width:400,height:540});const [displayAsset,setDisplayAsset]=useState(null);
 const config=useMemo(() => normalizeTokenAnimation(animation),[animation]);
 useEffect(() => {const node=host.current;if(!node) return;const resize=() => {const bounds=node.getBoundingClientRect();if(bounds.width && bounds.height) setSize({width:bounds.width,height:bounds.height});};resize();const observer=typeof ResizeObserver==='function' ? new ResizeObserver(resize) : null;observer?.observe(node);window.addEventListener('resize',resize);return () => {observer?.disconnect();window.removeEventListener('resize',resize);};},[]);
 useEffect(() => {let frame;const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const paint=time => {const motion=alignmentPreview ? {rotation:0,scaleX:1,scaleY:1,blink:.5} : tokenAnimationFrame(time/1000,config,id,query?.matches);if(body.current) body.current.style.transform=`rotate(${motion.rotation}rad) scale(${motion.scaleX},${motion.scaleY})`;if(eyes.current) eyes.current.style.opacity=String(motion.blink);if(config.enabled && !query?.matches && !alignmentPreview) frame=requestAnimationFrame(paint);};
  const restart=() => {cancelAnimationFrame(frame);paint(performance.now());};restart();query?.addEventListener?.('change',restart);return () => {cancelAnimationFrame(frame);query?.removeEventListener?.('change',restart);};
 },[config,id,alignmentPreview]);
 useEffect(() => {let active=true;setDisplayAsset(null);const loaded=new Image();loaded.crossOrigin='anonymous';loaded.onload=() => {if(!active) return;try {const asset=config.cropTransparent ? croppedTokenData(loaded) : {url:config.image || image,aspect:loaded.naturalWidth/loaded.naturalHeight};setDisplayAsset(asset);} catch {setDisplayAsset({url:config.image || image,aspect:loaded.naturalWidth/loaded.naturalHeight});}};loaded.src=config.image || image;return () => {active=false;};},[image,config.image,config.cropTransparent]);
 const displayAspect=displayAsset?.aspect || aspect;
 const coverWidth=Math.max(size.width,size.height*displayAspect);const fitted=fit==="cover" ? {width:coverWidth,height:coverWidth/displayAspect} : fitTokenImage(size.width,size.height,displayAspect),r=config.region;
 const gradient=(axis,start,length) => `linear-gradient(to ${axis},transparent ${start*100}%,black ${(start+length*.15)*100}%,black ${(start+length*.85)*100}%,transparent ${(start+length)*100}%)`;
 const mask=`${gradient('right',r.x,r.width)},${gradient('bottom',r.y,r.height)}`;
 return <div className="tas-image-preview" ref={host} data-testid="token-image-preview"><div className="tas-image-frame" style={fitted}><div className="tas-image-body" ref={body}>
 <img className="tas-image-base" src={displayAsset?.url || config.image || image} alt={alt} draggable={false}/>
 {config.closedImage && <div className="tas-image-eyes" ref={eyes} style={{opacity:0,maskImage:alignmentPreview ? "none" : mask,maskComposite:"intersect",WebkitMaskImage:alignmentPreview ? "none" : mask,WebkitMaskComposite:"source-in"}}><img src={config.closedImage} alt="" draggable={false} style={{transform:`translate(${config.closedTransform.x*100}%,${config.closedTransform.y*100}%) scale(${config.closedTransform.scale})`,transformOrigin:"50% 50%"}}/></div>}
 </div></div></div>;
}



