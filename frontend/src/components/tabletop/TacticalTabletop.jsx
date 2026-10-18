import TabletopResolutionLimit from './TabletopResolutionLimit';
import {createTabletopRenderer} from '../../utils/tabletopRenderer';
import {BlinkMaterial,useReducedTokenMotion} from '../tokens/AnimatedTokenArt';
import {normalizeTokenAnimation,tokenAnimationFrame} from '../../utils/tokenAnimation';
import { normalizarLanterna } from "../tokens/TokenFlashlight";
import React, {Suspense,useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import {PlacedAssets} from './MapEditor3D';

function TacticalControls({center,locked}) {
 const {camera,gl}=useThree();
 const controls=useRef();
 useEffect(() => {
  const orbit=new OrbitControls(camera,gl.domElement);
  orbit.enableRotate=false;orbit.enableDamping=true;
  orbit.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  orbit.target.set(center[0],0,center[1]);
  camera.position.set(center[0],100,center[1]+0.001);
  orbit.update();controls.current=orbit;
  return () => orbit.dispose();
 },[camera,gl,center]);
 useEffect(() => {if(controls.current) controls.current.enabled=!locked;},[locked]);
 useFrame(() => controls.current?.update());
 return null;
}
function TokenImage({url,animation,id}) {
 const config=useMemo(() => normalizeTokenAnimation(animation || {enabled:false}),[animation]);
 const texture=useLoader(THREE.TextureLoader,url),blink=useMemo(() => ({value:0}),[]),reduced=useReducedTokenMotion();
 useFrame(({clock}) => {blink.value=tokenAnimationFrame(clock.elapsedTime,config,id,reduced).blink;});
 useEffect(() => {texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;},[texture]);
 if(config.closedImage && (!config.image || config.image===url)) return <BlinkMaterial texture={texture} config={config} blink={blink}/>;
 return <meshBasicMaterial map={texture} transparent depthTest={false} toneMapped={false}/>;
}
function TacticalToken({token,selected,mestre,onSelect,onDragStart,onMove,onDragEnd}) {
 const ref=useRef(),drag=useRef(null),art=useRef(null),reduced=useReducedTokenMotion();
 const animation=useMemo(() => normalizeTokenAnimation(token.animation && (!token.animation.image || token.animation.image===token.image) ? token.animation : {enabled:false}),[token.animation,token.image]);
 useFrame(({clock}) => {if(!art.current) return;const motion=tokenAnimationFrame(clock.elapsedTime,animation,token.id,reduced);art.current.scale.set(motion.scaleX,motion.scaleY,1);art.current.rotation.z=-(Number(token.rotacao)||0)*Math.PI/180+motion.rotation;});
 const light=normalizarLanterna(token.lanterna);
 const plane=useMemo(() => new THREE.Plane(new THREE.Vector3(0,1,0),0),[]);
 const hit=useMemo(() => new THREE.Vector3(),[]);
 const start=event => {
  event.stopPropagation();onSelect();
  if(!mestre || event.button!==0) return;
  plane.constant=-(token.elevation || 0);
  if(!event.ray.intersectPlane(plane,hit)) return;
  drag.current={pointer:event.pointerId,offset:[token.x-hit.x,token.z-hit.z],position:[token.x,token.z]};
  event.target.setPointerCapture?.(event.pointerId);onDragStart();
 };
 const move=event => {
  if(drag.current?.pointer!==event.pointerId) return;
  event.stopPropagation();
  if(!event.ray.intersectPlane(plane,hit)) return;
  const position=[hit.x+drag.current.offset[0],hit.z+drag.current.offset[1]];
  drag.current.position=position;ref.current.position.set(position[0],token.elevation || 0,position[1]);
 };
 const end=event => {
  if(drag.current?.pointer!==event.pointerId) return;
  event.stopPropagation();event.target.releasePointerCapture?.(event.pointerId);
  onMove(drag.current.position);drag.current=null;onDragEnd();
 };
 return <group ref={ref} position={[token.x,token.elevation || 0,token.z]} rotation={[-Math.PI/2,0,0]} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
  {light.ativa && <mesh renderOrder={1000} raycast={() => null}><circleGeometry args={[light.alcance,48,Math.PI/2-(light.abertura/2+light.direcao)*Math.PI/180,light.abertura*Math.PI/180]}/><meshBasicMaterial color={light.cor} transparent opacity={0.12} depthTest={false} depthWrite={false}/></mesh>}
  <mesh renderOrder={1001}><ringGeometry args={[0.22,0.27,40]}/><meshBasicMaterial color={selected ? '#ffe5a0' : token.color || '#ffffff'} depthTest={false}/></mesh>
  <mesh ref={art} renderOrder={1002} rotation={[0,0,-(Number(token.rotacao)||0)*Math.PI/180]}><circleGeometry args={[0.22,40]}/>{token.image ? <TokenImage url={token.image} animation={token.animation} id={token.id}/> : <meshBasicMaterial color={token.color || '#aaa'} depthTest={false}/>}</mesh>
 </group>;
}
export default function TacticalTabletop({assets,tokens,mapKey,center,locked,mestre,onFloor,onSelect,onMove,onDragStart,onDragEnd}) {
 return <div className="tt3-tactical-map" aria-label="Mapa tático 2D">
  <Canvas dpr={1} gl={parameters => createTabletopRenderer(parameters,THREE.WebGLRenderer)} orthographic camera={{position:[center[0],100,center[1]+0.001],zoom:65,near:0.01,far:2000}}>
   <TabletopResolutionLimit/>
   <color attach="background" args={['#101416']}/>
   <ambientLight intensity={2}/><directionalLight position={[0,100,0]} intensity={2}/>
   <TacticalControls key={mapKey} center={center} locked={locked}/>
   <gridHelper args={[2000,2000,'#53636b','#28343a']}/>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.02,0]} onClick={onFloor}><planeGeometry args={[2000,2000]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide}/></mesh>
   <Suspense fallback={null}><PlacedAssets items={assets} selectedId={null} onSelect={() => {}} onSurfaceClick={onFloor}/></Suspense>
   {tokens.map(token => <Suspense key={token.id} fallback={null}><TacticalToken token={token} selected={token.selected} mestre={mestre} onSelect={() => onSelect(token)} onMove={position => onMove(token,position)} onDragStart={onDragStart} onDragEnd={onDragEnd}/></Suspense>)}
  </Canvas>
 </div>;
}



