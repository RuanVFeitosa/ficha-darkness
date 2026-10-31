import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Euler,Quaternion} from 'three';
import {easeCameraAngle} from '../../utils/cameraMotion';

// Apply only to the rendered orientation; navigation and shared poses stay steady.
export default function HandheldCameraMotion({intensity=1,speed=1,pitch=0,roll=0}){
 const {camera}=useThree();
 const reduced=useRef(false);
 const time=useRef(0);
 const inclination=useRef({pitch,roll});
 const pose=useMemo(()=>({base:new Quaternion(),rendered:new Quaternion(),offset:new Quaternion(),angles:new Euler(),applied:false}),[]);
 useEffect(()=>{
  const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const update=()=>{reduced.current=Boolean(query?.matches);};
  update();query?.addEventListener('change',update);
  return ()=>{
   query?.removeEventListener('change',update);
   if(pose.applied && camera.quaternion.equals(pose.rendered)) camera.quaternion.copy(pose.base);
  };
 },[camera,pose]);
 useFrame(()=>{
  if(pose.applied && camera.quaternion.equals(pose.rendered)) camera.quaternion.copy(pose.base);
  pose.applied=false;
 },-100);
 useFrame((_,delta)=>{
  const amount=reduced.current ? 0 : intensity;
  inclination.current.pitch=easeCameraAngle(inclination.current.pitch,pitch,delta,reduced.current);
  inclination.current.roll=easeCameraAngle(inclination.current.roll,roll,delta,reduced.current);
  const smooth=inclination.current;
  if(amount===0 && smooth.pitch===0 && smooth.roll===0) return;
  time.current+=Math.min(delta,.05)*speed;
  const t=time.current;
  // Slow overlapping rhythms avoid a repetitive bob or a sharp shake.
  pose.angles.set(
   (Math.sin(t*.83)*.0018+Math.sin(t*1.71)*.00045)*amount + smooth.pitch*Math.PI/180,
   (Math.sin(t*.61+.8)*.0022+Math.sin(t*1.37)*.0004)*amount,
   Math.sin(t*.47)*.0012*amount + smooth.roll*Math.PI/180
  );
  pose.base.copy(camera.quaternion);
  pose.offset.setFromEuler(pose.angles);
  camera.quaternion.multiply(pose.offset);
  pose.rendered.copy(camera.quaternion);
  pose.applied=true;
 });
 return null;
}
