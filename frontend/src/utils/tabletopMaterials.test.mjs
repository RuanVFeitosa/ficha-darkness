import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshStandardMaterial,DoubleSide,FrontSide} from 'three';
import {prepareTabletopMaterials,legacyOpeningPixels} from './tabletopMaterials.js';
import {mapCollisionMeshes,createTokenCollisionWorld,moveTokenWithCollision} from './tabletopCollision.js';

test('prepares interior faces and glass without changing shared source materials',()=>{
  const wall=new MeshStandardMaterial();
  const glass=new MeshStandardMaterial({transparent:true,opacity:.2});
  const cutout=new MeshStandardMaterial({transparent:true,alphaTest:.5});
  const scene=new Group();
  const mesh=new Mesh(new BoxGeometry(),[wall,glass,cutout]);
  const shared=new Mesh(mesh.geometry,wall);
  scene.add(mesh,shared);
  const dispose=prepareTabletopMaterials(scene);
  assert.equal(mesh.material[0].side,DoubleSide);
  assert.equal(mesh.material[1].depthWrite,false);
  assert.equal(mesh.material[2].depthWrite,true);
  assert.equal(shared.material,mesh.material[0]);
  assert.equal(wall.side,FrontSide);
  assert.equal(glass.depthWrite,true);
  let disposed=0;
  mesh.material.forEach(material=>material.addEventListener('dispose',()=>disposed++));
  dispose();
  assert.equal(disposed,3);
});

test('zero-opacity exported backing faces neither cast shadows nor block passage',()=>{
  const scene=new Group();scene.userData.mapCollision=true;
  const material=new MeshStandardMaterial({transparent:true,opacity:0});
  const backing=new Mesh(new BoxGeometry(2,2,.01),material);
  backing.position.y=1;backing.castShadow=true;scene.add(backing);scene.updateMatrixWorld(true);
  prepareTabletopMaterials(scene);
  assert.equal(backing.material.visible,false);
  assert.deepEqual(mapCollisionMeshes(scene),[]);
  const world=createTokenCollisionWorld(mapCollisionMeshes(scene));
  const result=moveTokenWithCollision(world,[0,0,.5],[0,-.5]);
  assert.ok(Math.abs(result.position[1]+.5)<1e-8);
  assert.equal(material.visible,true);
});

test('legacy black backing repair only applies to the identified house',()=>{
  for(const legacy of [false,true]) {
    const scene=new Group();scene.userData.mapCollision=true;
    if(legacy) scene.userData.tabletopModelSource='https://sketchfab.com/3d-models/house-5a9e087fbd3a4ae79b4c51d6279f0466';
    const material=new MeshStandardMaterial({name:'material_1'});
    const backing=new Mesh(new BoxGeometry(),material);scene.add(backing);
    prepareTabletopMaterials(scene);
    assert.equal(backing.material.visible,!legacy);
    assert.equal(mapCollisionMeshes(scene).length,legacy ? 0 : 1);
    assert.equal(material.visible,true);
  }
});

test('legacy opening mask removes black holes while preserving frame colors and alpha',()=>{
  const pixels=new Uint8ClampedArray([0,0,0,255,1,1,1,255,25,45,30,255,100,90,70,127]);
  legacyOpeningPixels(pixels);
  assert.deepEqual([...pixels],[0,0,0,0,1,1,1,0,25,45,30,255,100,90,70,127]);
});
