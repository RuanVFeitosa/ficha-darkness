import {tokenImageBounds} from '../utils/tokenImageSizing';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import {normalizeTokenAnimation,tokenAnimationFrame} from '../utils/tokenAnimation';
export function useReducedTokenMotion() {
 const [reduced,setReduced]=useState(false);
 useEffect(() => {const q=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!q) return;const change=() => setReduced(q.matches);change();q.addEventListener?.('change',change);return () => q.removeEventListener?.('change',change);},[]);return reduced;
}
export function BlinkMaterial({texture,config,blink}) {
 const closed=useLoader(THREE.TextureLoader,config.closedImage);
 useEffect(() => {closed.colorSpace=THREE.SRGBColorSpace;closed.needsUpdate=true;},[closed]);
 const compile=useMemo(() => shader => {
  shader.uniforms.tokenBlink=blink;shader.uniforms.tokenClosed={value:closed};const t=config.closedTransform;shader.uniforms.tokenClosedTransform={value:new THREE.Vector3(t.scale,t.x,t.y)};
  const r=config.region;shader.uniforms.tokenEyeRegion={value:new THREE.Vector4(r.x,1-r.y-r.height,r.width,r.height)};
  shader.fragmentShader='uniform vec3 tokenClosedTransform;\nuniform float tokenBlink;\nuniform sampler2D tokenClosed;\nuniform vec4 tokenEyeRegion;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 eyeLocal=(vMapUv-tokenEyeRegion.xy)/tokenEyeRegion.zw;
   vec2 eyeEdge=smoothstep(vec2(0.0),vec2(0.15),eyeLocal)*(1.0-smoothstep(vec2(0.85),vec2(1.0),eyeLocal));
   vec2 closedUv=(vMapUv-vec2(0.5)-vec2(tokenClosedTransform.y,-tokenClosedTransform.z))/tokenClosedTransform.x+vec2(0.5);
   float closedInside=step(0.0,closedUv.x)*step(closedUv.x,1.0)*step(0.0,closedUv.y)*step(closedUv.y,1.0);
   vec3 closedColor=texture2D(tokenClosed,closedUv).rgb;
   diffuseColor.rgb=mix(diffuseColor.rgb,closedColor,tokenBlink*eyeEdge.x*eyeEdge.y*closedInside);
  `);
 },[closed,config.region,config.closedTransform,blink]);
 return <meshStandardMaterial key={JSON.stringify([config.region,config.closedTransform])+config.closedImage} map={texture} transparent alphaTest={0.08} side={THREE.DoubleSide} roughness={0.88} onBeforeCompile={compile} customProgramCacheKey={() => 'token-blink-v1'}/>;
}
export default function AnimatedTokenArt({image,animation,id,height,selected=false,bottom=0}) {
 const config=useMemo(() => normalizeTokenAnimation(animation && (!animation.image || animation.image===image) ? animation : {enabled:false}),[animation,image]);
 const sourceTexture=useLoader(THREE.TextureLoader,config.image || image),group=useRef(),blink=useMemo(() => ({value:0}),[]),reduced=useReducedTokenMotion();
 const bounds=useMemo(() => tokenImageBounds(sourceTexture.image,config.cropTransparent),[sourceTexture,config.cropTransparent]);
 const texture=useMemo(() => {const copy=sourceTexture.clone();if(config.cropTransparent){copy.offset.set(bounds.x/sourceTexture.image.width,1-(bounds.y+bounds.height)/sourceTexture.image.height);copy.repeat.set(bounds.width/sourceTexture.image.width,bounds.height/sourceTexture.image.height);}copy.needsUpdate=true;return copy;},[sourceTexture,bounds,config.cropTransparent]);
 useEffect(() => () => texture.dispose(),[texture]);
 const artWidth=height*bounds.width/bounds.height; useEffect(() => {texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;texture.needsUpdate=true;},[texture]);
 useFrame(({clock}) => {if(!group.current) return;const m=tokenAnimationFrame(clock.elapsedTime,config,id,reduced);group.current.scale.set(m.scaleX,m.scaleY,1);group.current.rotation.z=m.rotation;blink.value=m.blink;});
 return <group position={[0,bottom,0]}><group ref={group}><mesh position={[0,height/2,0]} castShadow receiveShadow scale={selected ? 1.04 : 1}>
 <planeGeometry args={[artWidth,height]}/><meshDepthMaterial attach="customDepthMaterial" map={texture} alphaTest={0.08} side={THREE.DoubleSide} depthPacking={THREE.RGBADepthPacking}/>
 {config.closedImage ? <BlinkMaterial texture={texture} config={config} blink={blink}/> : <meshStandardMaterial map={texture} transparent alphaTest={0.08} side={THREE.DoubleSide} roughness={0.88}/>}
 </mesh></group></group>;
}





