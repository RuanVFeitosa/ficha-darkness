import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Vector3} from 'three';
import {audioZoneGain} from '../../utils/tabletopExploration';
import {mapCollisionMeshes,collisionSignature,createTokenCollisionWorld,resolveCameraObstruction} from '../../utils/tabletopCollision';
export default function SpatialAudioZones({context,zones=[],onError}) {
 const {camera,scene}=useThree(),sources=useRef([]),elapsed=useRef(0),world=useRef(null);
 useEffect(()=>{
 if(!context)return;
 const entries=zones.filter(zone=>String(zone.url || '').startsWith('https://') || String(zone.url || '').startsWith('http://')).map(zone=>{
 const audio=new Audio();audio.crossOrigin='anonymous';audio.loop=true;audio.src=zone.url;
 const source=context.createMediaElementSource(audio),panner=context.createPanner(),filter=context.createBiquadFilter(),gain=context.createGain();
 panner.panningModel='HRTF';panner.rolloffFactor=0;panner.positionX.value=Number(zone.x)||0;panner.positionY.value=Number(zone.y)||0;panner.positionZ.value=Number(zone.z)||0;
 filter.type='lowpass';filter.frequency.value=18000;gain.gain.value=0;
 source.connect(panner).connect(filter).connect(gain).connect(context.destination);
 const fail=()=>onError?.('Não foi possível reproduzir '+(zone.name || 'o som')+'. Confira o arquivo e a permissão de áudio da URL.');
 audio.addEventListener('error',fail);audio.play().catch(fail);
 return {zone,audio,source,panner,filter,gain,fail};
 });sources.current=entries;
 return ()=>{sources.current=[];entries.forEach(item=>{item.audio.removeEventListener('error',item.fail);item.audio.pause();item.audio.removeAttribute('src');item.audio.load();item.source.disconnect();item.panner.disconnect();item.filter.disconnect();item.gain.disconnect();});};
 },[context,zones,onError]);
 useFrame((_,delta)=>{
 if(!context||!sources.current.length)return;
 elapsed.current+=delta;if(elapsed.current<.15)return;elapsed.current=0;
 const listener=context.listener,position=camera.position.toArray(),forward=camera.getWorldDirection(new Vector3()),up=new Vector3(0,1,0).applyQuaternion(camera.quaternion);
 if(listener.positionX){
 [listener.positionX,listener.positionY,listener.positionZ].forEach((param,i)=>param.setTargetAtTime(position[i],context.currentTime,.05));
 [listener.forwardX,listener.forwardY,listener.forwardZ].forEach((param,i)=>param.setTargetAtTime(forward.toArray()[i],context.currentTime,.05));
 [listener.upX,listener.upY,listener.upZ].forEach((param,i)=>param.setTargetAtTime(up.toArray()[i],context.currentTime,.05));
 }else{listener.setPosition(...position);listener.setOrientation(...forward.toArray(),...up.toArray());}
 scene.updateMatrixWorld();const meshes=mapCollisionMeshes(scene),signature=collisionSignature(meshes);
 if(world.current?.signature!==signature)world.current={signature,value:createTokenCollisionWorld(meshes)};
 sources.current.forEach(item=>{
 const end=[Number(item.zone.x)||0,Number(item.zone.y)||0,Number(item.zone.z)||0];
 const blocked=resolveCameraObstruction(world.current.value,position,end,.01).fraction<.99;
 item.gain.gain.setTargetAtTime(audioZoneGain(item.zone,position,blocked),context.currentTime,.18);
 item.filter.frequency.setTargetAtTime(blocked?650:18000,context.currentTime,.18);
 });
 });
 return null;
}
