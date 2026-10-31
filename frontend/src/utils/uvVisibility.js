import {Box3,Raycaster,Vector3} from 'three';
import {insideUVBeam} from './uvLight.js';

export function uvVisibilityTools(){
 return {box:new Box3(),center:new Vector3(),origin:new Vector3(),target:new Vector3(),direction:new Vector3(),ray:new Raycaster(),samples:Array.from({length:7},()=>new Vector3())};
}
export function revealedByUV(object,scene,tools,height=0){
 const {box,center,origin,target,direction,ray,samples}=tools;
 // Hidden clues still need fresh transforms for cone and wall tests.
 scene.updateMatrixWorld(true);
 box.setFromObject(object);box.getCenter(center);
 if(box.isEmpty())object.localToWorld(center.set(0,height,0));
 samples[0].copy(center);
 samples[1].set(box.min.x,center.y,center.z);samples[2].set(box.max.x,center.y,center.z);
 samples[3].set(center.x,box.min.y,center.z);samples[4].set(center.x,box.max.y,center.z);
 samples[5].set(center.x,center.y,box.min.z);samples[6].set(center.x,center.y,box.max.z);
 let revealed=false;
 scene.traverse(light=>{
  if(revealed || !light.isSpotLight || !light.userData?.uvLight)return;
  for(let parent=light;parent;parent=parent.parent)if(!parent.visible)return;
  light.getWorldPosition(origin);light.target.getWorldPosition(target);
  for(const point of samples){
   direction.copy(target).sub(origin);
   if(!insideUVBeam(point.toArray(),origin.toArray(),direction.toArray(),light.distance,light.angle))continue;
   direction.copy(point).sub(origin);const distance=direction.length();direction.normalize();
   ray.set(origin,direction);ray.near=.03;ray.far=Math.max(.03,distance-.04);
   const blocked=ray.intersectObjects(scene.children,true).some(hit=>{
    for(let node=hit.object;node;node=node.parent)if(node===object || !node.visible || node.userData?.tokenInteraction)return false;
    const materials=Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material];
    return hit.object.isMesh && materials.some(material=>material && material.opacity>.5 && !(material.transmission>.5));
   });
   if(!blocked){revealed=true;break;}
  }
 });
 return revealed;
}
