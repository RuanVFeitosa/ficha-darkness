import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial,Vector3} from 'three';
import {isDoorName,prepareSceneDoors,applyDoorStates,doorStateKey,doorNodeId} from './tabletopDoors.js';
import {createTokenCollisionWorld,moveTokenWithCollision} from './tabletopCollision.js';

const mesh=(name,size,position)=>{
  const node=new Mesh(new BoxGeometry(...size),new MeshBasicMaterial());node.name=name;node.position.set(...position);return node;
};
test('identifica portas sem confundir batentes, maçanetas e objetos externos',()=>{
  ['Door','Door_01','SM_Door.002','porta_entrada'].forEach(name=>assert.equal(isDoorName(name),true));
  ['Door_frame','Door_handle','doorway','outdoor_lamp','wall'].forEach(name=>assert.equal(isDoorName(name),false));
});

test('abrir libera a passagem, fechar bloqueia e o batente permanece na posição',()=>{
  const scene=new Group(),door=new Group();door.name='Door_01';scene.add(door);
  const panel=mesh('Door_panel',[1.52,1.78,.12],[0,.95,0]);
  const frame=mesh('Door_frame',[.1,2,.15],[.85,1,0]);door.add(panel,frame);scene.updateMatrixWorld(true);
  const closedPanel=panel.getWorldPosition(new Vector3()).clone(),closedFrame=frame.getWorldPosition(new Vector3()).clone();
  const doors=prepareSceneDoors(scene);scene.updateMatrixWorld(true);
  assert.equal(doors.length,1);
  assert.ok(panel.getWorldPosition(new Vector3()).distanceTo(closedPanel)<1e-8);
  const cross=()=>moveTokenWithCollision(createTokenCollisionWorld([panel,frame]),[0,0,.5],[0,-.5]);
  assert.ok(cross().position[1]>.1);
  const states={[doorStateKey('house',doors[0].id)]:{open:true}};
  assert.equal(applyDoorStates(doors,'house',states),true);scene.updateMatrixWorld(true);
  assert.ok(Math.abs(cross().position[1]+.5)<1e-8);
  assert.ok(frame.getWorldPosition(new Vector3()).distanceTo(closedFrame)<1e-8);
  assert.equal(applyDoorStates(doors,'house',states),false);
  applyDoorStates(doors,'house',{});scene.updateMatrixWorld(true);
  assert.ok(cross().position[1]>.1);
});

test('portas com nomes repetidos têm identificadores estáveis e independentes',()=>{
  const scene=new Group();
  scene.add(mesh('Door',[1,2,.1],[0,1,0]),mesh('Door',[1,2,.1],[4,1,0]));
  const copy=scene.clone(true);
  const doors=prepareSceneDoors(scene),other=prepareSceneDoors(copy);
  assert.equal(new Set(doors.map(door=>door.id)).size,2);
  assert.deepEqual(doors.map(door=>door.id),other.map(door=>door.id));
  applyDoorStates(doors,'house',{[doorStateKey('house',doors[0].id)]:{open:true}});
  assert.equal(doors[1].pivot.rotation.y,0);
});

test('mestre pode identificar uma porta sem nome mesmo após preparar outras portas',()=>{
  const source=new Group();
  source.add(mesh('Door',[1,2,.1],[0,1,0]),mesh('Cube_42',[1,2,.1],[4,1,0]));
  const instance=source.clone(true),unnamed=instance.children[1];
  prepareSceneDoors(instance);
  const selectedId=doorNodeId(unnamed,instance);
  const other=source.clone(true),doors=prepareSceneDoors(other,[selectedId]);
  assert.equal(doors.length,2);
  assert.ok(doors.some(door=>door.id===selectedId));
  applyDoorStates(doors,'house',{[doorStateKey('house',selectedId)]:{open:true}});
  assert.equal(doors.find(door=>door.id===selectedId).pivot.rotation.y,-Math.PI/2);
});
