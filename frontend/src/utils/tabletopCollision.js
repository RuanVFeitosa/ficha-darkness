import { Box3, Matrix4, Ray, Triangle, Vector2, Vector3 } from 'three';
import { collisionGeometry } from './collisionGeometry.js';
import {isInvisibleMapMaterial} from './tabletopMaterials.js';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

const SKIN = 0.002;
const DOWN = new Vector3(0, -1, 0);
const WALKABLE = Math.cos(55 * Math.PI / 180);

function faceMaterial(entry,id) {
  if(!Array.isArray(entry.material)) return entry.material;
  const group=entry.geometry.groups.find(group=>id*3>=group.start && id*3<group.start+group.count);
  return group ? entry.material[group.materialIndex] : null;
}

// Legacy frames are textured planes. Use their repaired alpha mask for physics
// too, otherwise the now-visible opening would still act as a solid rectangle.
function cutoutBlocksCapsule(entry,id,capsule,face) {
  const material=faceMaterial(entry,id);
  if(isInvisibleMapMaterial(material)) return false;
  const mask=material.userData?.tabletopCutout;
  const uv=entry.geometry.attributes.uv;
  if(!mask || !uv || !material.map) return true;
  const indices=[0,1,2].map(i=>entry.geometry.index ? entry.geometry.index.getX(id*3+i) : id*3+i);
  const coords=indices.map(i=>new Vector2().fromBufferAttribute(uv,i));
  const point=new Vector3(),bary=new Vector3(),texturePoint=new Vector2();
  const opaque=sample=>{
    face.closestPointToPoint(sample,point);
    if(!face.getBarycoord(point,bary)) return true;
    texturePoint.set(0,0);
    coords.forEach((coord,i)=>texturePoint.addScaledVector(coord,bary.getComponent(i)));
    material.map.transformUv(texturePoint);
    const x=Math.max(0,Math.min(mask.width-1,Math.floor(texturePoint.x*mask.width)));
    const y=Math.max(0,Math.min(mask.height-1,Math.floor(texturePoint.y*mask.height)));
    return mask.alpha[y*mask.width+x]>=128;
  };
  const tangent=new Vector3().subVectors(face.b,face.a).normalize();
  const bitangent=new Vector3().crossVectors(face.getNormal(new Vector3()),tangent).normalize();
  const sample=new Vector3();
  for(const center of [capsule.start,capsule.end,new Vector3().addVectors(capsule.start,capsule.end).multiplyScalar(.5)]) {
    if(opaque(center)) return true;
    for(let i=0;i<8;i+=1) {
      const angle=i*Math.PI/4;
      sample.copy(center).addScaledVector(tangent,Math.cos(angle)*capsule.radius).addScaledVector(bitangent,Math.sin(angle)*capsule.radius);
      if(opaque(sample)) return true;
    }
  }
  return false;
}

// Only map geometry participates: tokens, lights, clues and loading previews do not.
export function mapCollisionPending(scene) {
  let pending=false;
  const visit=(node,solid=false)=>{
    if(node.visible===false) return;
    if(solid && node.userData?.mapCollisionPending) pending=true;
    if(node.userData?.mapCollision!==undefined) solid=node.userData.mapCollision;
    node.children?.forEach(child=>visit(child,solid));
  };
  visit(scene);
  return pending;
}

export function mapCollisionMeshes(scene) {
  const meshes = [];
  const visit = (node, solid = false) => {
    if(node.visible===false) return;
    if (node.userData?.mapCollision !== undefined) solid = node.userData.mapCollision;
    if (solid && node.isMesh && node.geometry?.attributes?.position &&
      (Array.isArray(node.material) ? node.material.some(material=>!isInvisibleMapMaterial(material)) : !isInvisibleMapMaterial(node.material))) meshes.push(node);
    node.children?.forEach(child => visit(child, solid));
  };
  visit(scene);
  return meshes;
}

export function collisionSignature(meshes) {
  return meshes.map(mesh => `${mesh.uuid}:${mesh.geometry.uuid}:${mesh.geometry.attributes.position.version}:${mesh.matrixWorld.elements.join(',')}`).join('|');
}

export function createTokenCollisionWorld(meshes) {
  // World creation only records mesh bounds. Geometry trees are shared by all
  // instances and built lazily when a query actually reaches that mesh.
  const entries=meshes.map(mesh => {
    if(!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    return {geometry:mesh.geometry,material:mesh.material,matrix:mesh.matrixWorld.clone(),inverse:new Matrix4().copy(mesh.matrixWorld).invert(),box:mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)};
  }).filter(entry=>!entry.box.isEmpty() && entry.matrix.determinant()!==0);
  const tester=new Octree(); // Only its triangle/capsule narrow-phase is used.
  const triangle=new Triangle(), reversed=new Triangle();
  const localBox=new Box3(), queryBox=new Box3();
  const visit = (box,callback) => {
    entries.forEach(entry => {
      if(!entry.box.intersectsBox(box)) return;
      const geometry=collisionGeometry(entry.geometry);
      localBox.copy(box).applyMatrix4(entry.inverse);
      geometry.query(localBox,id => {
        geometry.read(id,triangle);
        triangle.a.applyMatrix4(entry.matrix);
        triangle.b.applyMatrix4(entry.matrix);
        triangle.c.applyMatrix4(entry.matrix);
        callback(triangle,entry,id);
      });
    });
  };
  const hitCapsule = capsule => {
    queryBox.makeEmpty().expandByPoint(capsule.start).expandByPoint(capsule.end).expandByScalar(capsule.radius);
    const corrected=capsule.clone();
    let hit=false;
    visit(queryBox,(face,entry,id) => {
      const contact=tester.triangleCapsuleIntersect(corrected,face) || tester.triangleCapsuleIntersect(corrected,reversed.set(face.c,face.b,face.a));
      if(contact && cutoutBlocksCapsule(entry,id,corrected,face)) {hit=true;corrected.translate(contact.normal.multiplyScalar(contact.depth));}
    });
    if(!hit) return false;
    const normal=corrected.start.clone().sub(capsule.start);
    const depth=normal.length();
    return {normal:normal.normalize(),depth};
  };
  const groundAt = (x,z,top,bottom) => {
    const ray=new Ray(new Vector3(x,top,z),DOWN);
    queryBox.min.set(x-SKIN,bottom-SKIN,z-SKIN);queryBox.max.set(x+SKIN,top+SKIN,z+SKIN);
    let nearest=null, walkable=false;
    const point=new Vector3(),normal=new Vector3();
    visit(queryBox,(face,entry,id) => {
      if(isInvisibleMapMaterial(faceMaterial(entry,id))) return;
      if(!ray.intersectTriangle(face.a,face.b,face.c,false,point) || point.y<bottom || (nearest!==null && point.y<=nearest)) return;
      nearest=point.y;
      walkable=Math.abs(face.getNormal(normal).y)>=WALKABLE;
    });
    return walkable ? nearest : null;
  };
  return {hitCapsule,groundAt,minY:entries.reduce((y,entry)=>Math.min(y,entry.box.min.y),Infinity)};
}

// Feet are world coordinates. Short substeps prevent tunnelling through thin walls.
export function moveTokenWithCollision(world, feet, destination, {scale = 0.35, baseElevation = 0, delta = 1/60, velocity = 0, recoverSpawn = false} = {}) {
  const size = Math.max(0.1, Number(scale) || 0.35);
  const radius = 0.32 * size, height = 1.86 * size, stepHeight = 0.48 * size;
  const capsuleAt = p => new Capsule(new Vector3(p[0], p[1]+radius+SKIN, p[2]), new Vector3(p[0], p[1]+height-radius, p[2]), radius);
  const clear = p => {
    const hit = world.hitCapsule(capsuleAt(p));
    return !hit || hit.depth < SKIN;
  };
  const lowest = Math.min(baseElevation,Number.isFinite(world.minY) ? world.minY : baseElevation);
  const floorBelow = (x,z,top) => world.groundAt(x,z,top,Math.min(lowest,top)-SKIN);
  const ground = (x,z,top,bottom) => {
    const y = world.groundAt(x,z,top,bottom);
    if (y !== null) return y;
    // The invisible stage is at the token spawn, not at the lowest decoration.
    // A real floor below takes precedence so stairs and basements still work.
    if(baseElevation > top || baseElevation < bottom) return null;
    return floorBelow(x,z,top) === null ? baseElevation : null;
  };
  let p = [...feet];
  // Repair persisted falls and positions below a floor that finished loading.
  // Preserve legitimate lower levels whenever a real supporting floor exists.
  if(p[1]<baseElevation-SKIN && floorBelow(p[0],p[2],p[1]+SKIN)===null) {
    p[1]=floorBelow(p[0],p[2],baseElevation+stepHeight) ?? baseElevation;
    velocity=0;
  }
  // On first contact with a loaded map, recover a saved pose embedded under
  // its floor. Do not lift a supported basement token onto the next storey.
  if(recoverSpawn && world.groundAt(p[0],p[2],p[1]+SKIN,p[1]-stepHeight)===null && !clear(p)) {
    const above=world.groundAt(p[0],p[2],p[1]+height,p[1]+SKIN);
    if(above!==null && clear([p[0],above,p[2]])) {p[1]=above;velocity=0;}
  }
  const distance = Math.hypot(destination[0]-p[0], destination[1]-p[2]);
  const count = Math.max(1, Math.ceil(distance/(radius*0.4)));
  const dx = (destination[0]-p[0])/count, dz = (destination[1]-p[2])/count;
  const tryMove = (x,z) => {
      const y = ground(x,z,p[1]+stepHeight+SKIN,p[1]-stepHeight);
      const next = [x,y === null ? p[1] : y,z];
      // Check head clearance before stepping up under a ceiling.
      if (next[1] > p[1]+SKIN && !clear([p[0],next[1],p[2]])) return false;
      if (!clear(next)) {
        const raised = [x,p[1]+stepHeight,z];
        if (!clear([p[0],raised[1],p[2]]) || !clear(raised)) return false;
        let low = next[1], high = raised[1];
        for (let j=0;j<10;j+=1) {
          const middle = (low+high)/2;
          if (clear([x,middle,z])) high=middle; else low=middle;
        }
        const contact = world.hitCapsule(capsuleAt([x,low,z]));
        if (contact && contact.normal.y < WALKABLE) return false;
        next[1]=high;
      }
      p = next;
      return true;
  };
  for (let i=0; i<count; i+=1) {
    if (!tryMove(p[0]+dx,p[2]+dz)) {
      tryMove(p[0]+dx,p[2]);
      tryMove(p[0],p[2]+dz);
    }
  }
  const dt = Math.min(Math.max(delta,0),0.05);
  velocity -= 9.8 * dt;
  const fall = -velocity*dt;
  const floor = ground(p[0],p[2],p[1]+SKIN,p[1]-fall-SKIN);
  if (floor !== null) { p[1]=floor; velocity=0; }
  else {
    const steps = Math.max(1,Math.ceil(fall/(radius*0.4)));
    for (let i=0;i<steps;i+=1) {
      const next = [p[0],p[1]-fall/steps,p[2]];
      if (!clear(next)) {velocity=0;break;}
      p=next;
    }
  }
  return {position:[p[0],p[2]], elevation:p[1], velocity};
}

// A swept camera volume catches thin walls, ceilings and back-facing geometry.
export function resolveCameraObstruction(world,origin,destination,radius=.06) {
 const start=new Vector3(...origin),end=new Vector3(...destination);
 const blocked=fraction=>world.hitCapsule(new Capsule(start.clone(),start.clone().lerp(end,fraction),radius));
 if(!blocked(1)) return {position:[...destination],fraction:1};
 let low=0,high=1;
 for(let i=0;i<12;i++) {const mid=(low+high)/2;if(blocked(mid))high=mid;else low=mid;}
 return {position:start.lerp(end,low).toArray(),fraction:low};
}
