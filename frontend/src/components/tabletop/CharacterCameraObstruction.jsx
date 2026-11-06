import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {mapCollisionMeshes,collisionSignature,createTokenCollisionWorld,resolveCameraObstruction} from '../../utils/tabletopCollision';

export default function CharacterCameraObstruction({enabled,position,elevation=0,height=.65,getPose}) {
 const {camera,scene}=useThree();
 const cache=useRef(null),correction=useRef(null),fraction=useRef(1);
 // Restore the requested camera before controls run, preserving zoom and orbit.
 const restore=()=>{
  if(correction.current) {
   camera.position.x+=correction.current[0];camera.position.y+=correction.current[1];camera.position.z+=correction.current[2];
   correction.current=null;
  }
 };
 useFrame(restore,-3);
 useEffect(()=>()=>restore(),[camera]);
 useFrame((_,delta)=>{
  if(!enabled || !position) {fraction.current=1;return;}
  const pose=getPose?.(),feet=pose?.position || position;
  scene.updateMatrixWorld();
  const meshes=mapCollisionMeshes(scene),signature=collisionSignature(meshes);
  if(cache.current?.signature!==signature)cache.current={signature,world:createTokenCollisionWorld(meshes)};
  const anchor=[feet[0],(pose?.elevation ?? elevation)+height*.78,feet[1]];
  const desired=camera.position.toArray();
  const result=resolveCameraObstruction(cache.current.world,anchor,desired,Math.max(.025,height*.09));
  // Pull in immediately; ease back out when the obstruction clears.
  const next=result.fraction<fraction.current ? result.fraction : fraction.current+(result.fraction-fraction.current)*(1-Math.exp(-8*Math.min(delta,.05)));
  fraction.current=next;
  const actual=anchor.map((value,i)=>value+(desired[i]-value)*next);
  correction.current=desired.map((value,i)=>value-actual[i]);
  camera.position.set(...actual);
 },-.5);
 return null;
}
