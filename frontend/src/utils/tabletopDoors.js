import {Box3,Group,Matrix4,Vector3} from 'three';

export const isDoorName=name=>/(^|[^a-z])(door|porta)([^a-z]|$)/i.test(name || '') && !/(frame|jamb|handle|knob|batente|macaneta|maçaneta|doorway)/i.test(name);
export const doorStateKey=(instanceId,nodeId='leaf')=>`${instanceId}:${nodeId}`;
export function doorNodeId(node,scene) {
  if(typeof node.userData.tabletopDoorNodeId==='string') return node.userData.tabletopDoorNodeId;
  const path=[];
  let current=node;
  while(current && current!==scene) {path.unshift(`${current.parent.children.indexOf(current)}-${current.name}`);current=current.parent;}
  return path.join('/');
}

export function prepareSceneDoors(scene,identified=[]) {
  scene.updateMatrixWorld(true);
  scene.traverse(node=>{if(node!==scene) node.userData.tabletopDoorNodeId=doorNodeId(node,scene);});
  const candidates=[];
  scene.traverse(node=>{if(node!==scene && (isDoorName(node.name) || identified.includes(doorNodeId(node,scene))) && !node.isLight && (node.isMesh || node.isGroup || node.type==='Object3D')) candidates.push(node);});
  const eligible=candidates.filter(node=>{
    let panel=false,frame=false;
    node.traverse(child=>{
      if(child===node) return;
      if(candidates.includes(child)) panel=true;
      if(/frame|jamb|batente/i.test(child.name)) frame=true;
    });
    return !(panel && frame);
  });
  const selected=eligible.filter(node=>{
    let parent=node.parent;
    while(parent && parent!==scene) {if(eligible.includes(parent)) return false;parent=parent.parent;}
    return node!==scene && node.parent;
  });
  const nodes=selected.map(node=>({node,id:doorNodeId(node,scene)}));
  return nodes.map(({node,id})=>{
    const parent=node.parent;
    const inverse=new Matrix4().copy(parent.matrixWorld).invert();
    const bounds=new Box3();
    node.traverse(child=>{
      if(!child.isMesh || !child.geometry?.attributes?.position) return;
      if(!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      bounds.union(child.geometry.boundingBox.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse,child.matrixWorld)));
    });
    if(bounds.isEmpty()) return null;
    const hinge=bounds.getCenter(new Vector3());
    if(bounds.max.x-bounds.min.x>=bounds.max.z-bounds.min.z) hinge.x=bounds.min.x;
    else hinge.z=bounds.min.z;
    const pivot=new Group();
    pivot.name=`door-hinge:${id}`;
    pivot.position.copy(hinge);
    pivot.userData.tabletopDoorId=id;
    pivot.userData.closedDoorBounds=bounds.clone();
    // The new parent is an untranslated local hinge, preserving the closed pose.
    const position=node.position.clone();
    parent.add(pivot);pivot.add(node);node.position.copy(position).sub(hinge);node.updateMatrix();
    return {id,pivot};
  }).filter(Boolean);
}

export function closedDoorBounds(pivot) {
  const bounds=pivot.userData.closedDoorBounds || new Box3(new Vector3(-.76,.06,-.04),new Vector3(.76,1.84,.08));
  pivot.parent.updateWorldMatrix(true,false);
  return bounds.clone().applyMatrix4(pivot.parent.matrixWorld);
}

export function applyDoorStates(doors,instanceId,states) {
  let changed=false;
  doors.forEach(({id,pivot})=>{
    const rotation=states[doorStateKey(instanceId,id)]?.open ? -Math.PI/2 : 0;
    if(pivot.rotation.y!==rotation) {pivot.rotation.y=rotation;changed=true;}
  });
  return changed;
}

export {mergeDoorStates} from './tabletopTokenState.js';
