import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Group, PlaneGeometry, Texture, Vector3 } from 'three';
import {resolveCameraObstruction, createTokenCollisionWorld, moveTokenWithCollision, mapCollisionMeshes,mapCollisionPending} from './tabletopCollision.js';
import {collisionGeometry} from './collisionGeometry.js';

const box = (x,y,z,w,h,d) => {
  const mesh=new Mesh(new BoxGeometry(w,h,d),new MeshBasicMaterial());
  mesh.position.set(x,y,z);mesh.updateMatrixWorld(true);
  return mesh;
};
const walk = (meshes, start, end, options={}) => moveTokenWithCollision(createTokenCollisionWorld(meshes),start,end,options);

test('only a loading solid map pauses physics, not a token or disabled decoration',()=>{
 const scene=new Group(),map=new Group(),loading=new Group();
 map.userData.mapCollision=true;
 loading.userData={mapCollision:false,mapCollisionPending:true};
 map.add(loading);scene.add(map);
 assert.equal(mapCollisionPending(scene),true);
 map.userData.mapCollision=false;
 assert.equal(mapCollisionPending(scene),false);
 map.userData.mapCollision=true;map.remove(loading);
 assert.equal(mapCollisionPending(scene),false);
});

test('restored token trapped beneath a loaded floor returns to the floor',()=>{
 const floor=box(0,.48,0,4,.04,4);
 const result=walk([floor],[0,.3,0],[0,0],{recoverSpawn:true});
 assert.ok(Math.abs(result.elevation-.5)<.005);
 assert.equal(result.velocity,0);
});

test('spawn recovery preserves a supported lower storey beneath another floor',()=>{
 const lower=box(0,-.02,0,4,.04,4),upper=box(0,.48,0,4,.04,4);
 const result=walk([lower,upper],[0,0,0],[0,0],{recoverSpawn:true,scale:.2});
 assert.ok(Math.abs(result.elevation)<.005);
});

test('a repaired texture opening permits passage while its frame stays solid',()=>{
  const texture=new Texture();texture.flipY=false;texture.updateMatrix();
  const material=new MeshBasicMaterial({map:texture,alphaTest:.5});
  const width=64,height=64;
  material.userData.tabletopCutout={width,height,alpha:Uint8Array.from({length:width*height},(_,i)=>{
    const x=i%width,y=Math.floor(i/width);
    return x>=8 && x<56 && y<60 ? 0 : 255;
  })};
  const frame=new Mesh(new PlaneGeometry(2,2),material);frame.position.y=1;frame.updateMatrixWorld(true);
  const through=walk([frame],[0,0,.5],[0,-.5]);
  assert.ok(Math.abs(through.position[1]+.5)<1e-8);
  const edge=walk([frame],[.9,0,.5],[.9,-.5]);
  assert.ok(edge.position[1]>.1);
});

test('hidden door geometry and hidden parent groups do not block an opening',()=>{
  const scene=new Group();scene.userData.mapCollision=true;
  const door=box(0,1,0,1.5,2,.1);
  const hidden=new Group();hidden.visible=false;
  hidden.add(box(0,1,0,1.5,2,.1));scene.add(door,hidden);
  const cross=()=>walk(mapCollisionMeshes(scene),[0,0,.5],[0,-.5]);
  assert.ok(cross().position[1]>.1);
  door.visible=false;
  assert.deepEqual(mapCollisionMeshes(scene),[]);
  assert.ok(Math.abs(cross().position[1]+.5)<1e-8);
  door.visible=true;
  assert.ok(cross().position[1]>.1);
});

test('bloqueia paredes finas mesmo com um deslocamento longo', () => {
  const result=walk([box(0,1,0,4,2,0.02)],[0,0,1],[0,-1]);
  assert.ok(result.position[1] > 0.1);
  assert.ok(Math.abs(result.elevation-(0)) < 0.005);
});

test('desliza ao longo de uma parede ao caminhar na diagonal', () => {
  const result=walk([box(0,1,0,8,2,0.1)],[0,0,0.2],[1,-0.3]);
  assert.ok(result.position[0] > 0.9);
  assert.ok(result.position[1] > 0.1);
});

test('sobe degraus baixos e não sobe um bloco alto', () => {
  const step=box(0,0.06,0,2,0.12,1);
  const result=walk([step],[0,0,0.8],[0,0]);
  assert.ok(Math.abs(result.position[1]-(0)) < 0.005);
  assert.ok(Math.abs(result.elevation-(0.12)) < 0.01);
  const blocked=walk([box(0,0.5,0,2,1,1)],[0,0,0.8],[0,0]);
  assert.ok(blocked.position[1] > 0.5);
});

test('mantém o jogador sob o andar superior e bloqueia degraus sem espaço para a cabeça', () => {
  const upper=box(0,1,0,4,0.1,4);
  const below=walk([upper],[0,0,1],[0,0]);
  assert.ok(Math.abs(below.elevation-(0)) < 0.005);
  const ceiling=box(0,0.73,0,4,0.1,4);
  const blocked=walk([ceiling,box(0,0.06,0,2,0.12,1)],[0,0,0.8],[0,0]);
  assert.ok(blocked.position[1] > 0.5);
});

test('permanece sobre um piso elevado e cai ao sair da borda', () => {
  const upper=box(0,1,0,2,0.1,2);
  const supported=walk([upper],[0,1.05,0],[0.5,0]);
  assert.ok(Math.abs(supported.elevation-(1.05)) < 0.005);
  const falling=walk([upper],[0.9,1.05,0],[1.5,0],{delta:0.05});
  assert.ok(falling.elevation < 1.05);
});

test('acompanha uma rampa inclinada', () => {
  const ramp=new Mesh(new PlaneGeometry(4,4),new MeshBasicMaterial());
  ramp.rotation.x=-Math.PI/2-Math.PI/6;ramp.position.y=1;ramp.updateMatrixWorld(true);
  const result=walk([ramp],[0,1,0],[0,0.5]);
  assert.ok(Math.abs(result.position[1]-(0.5)) < 0.005);
  assert.ok(result.elevation > 1.2);
});

test('seleciona apenas objetos sólidos do mapa', () => {
  const scene=new Group(), map=new Group(), ignored=new Group();
  map.userData.mapCollision=true;ignored.userData.mapCollision=false;
  const solid=box(0,0,0,1,1,1);
  map.add(solid,ignored);ignored.add(box(0,0,0,1,1,1));
  scene.add(map,box(0,0,0,1,1,1));
  assert.deepEqual(mapCollisionMeshes(scene),[solid]);
});

test('spawn no andar superior permite descer até pisos mais baixos', () => {
  const lower=box(0,-1,0,8,0.1,8);
  const result=walk([lower],[0,2,0],[0.5,0],{baseElevation:2,delta:0.05});
  assert.ok(result.elevation < 2);
});

test('um plano com faces invertidas também sustenta o jogador', () => {
  const floor=new Mesh(new PlaneGeometry(4,4),new MeshBasicMaterial());
  floor.rotation.x=Math.PI/2;floor.position.y=1;floor.updateMatrixWorld(true);
  const result=walk([floor],[0,1,0],[0.5,0]);
  assert.ok(Math.abs(result.elevation-1)<0.005);
});

test('objetos muito abaixo do cenário não puxam o jogador para o limbo', () => {
  const decoration=box(100,-200,100,1,1,1);
  const result=walk([decoration],[0,3,0],[0,0],{baseElevation:3,delta:0.05});
  assert.equal(result.elevation,3);
  assert.equal(result.velocity,0);
});

test('recupera uma altura inválida salva abaixo do piso mesmo com decoração subterrânea', () => {
  const floor=box(0,-0.05,0,4,0.1,4),decoration=box(100,-200,100,1,1,1);
  const result=walk([floor,decoration],[0,-5,0],[0,0],{baseElevation:0,delta:0.05,velocity:-20});
  assert.ok(Math.abs(result.elevation)<0.00001);
  assert.equal(result.velocity,0);
});

test('mapa ainda sem geometria recupera uma queda já persistida', () => {
  const result=walk([],[0,-100,0],[0,0],{baseElevation:2,velocity:-40});
  assert.equal(result.elevation,2);
  assert.equal(result.velocity,0);
});

test('recuperação preserva porões com um piso real sob o personagem', () => {
  const basement=box(0,-3.05,0,4,0.1,4);
  const result=walk([basement],[0,-3,0],[0.1,0],{baseElevation:2,delta:0.05});
  assert.ok(Math.abs(result.elevation+3)<0.00001);
});

test('queda de um andar elevado termina no piso inferior e permanece estável', () => {
  const world=createTokenCollisionWorld([box(0,-0.05,0,4,0.1,4),box(100,-200,100,1,1,1)]);
  let feet=[0,3,0],velocity=0;
  for(let i=0;i<240;i+=1) {
    const result=moveTokenWithCollision(world,feet,[0,0],{baseElevation:3,velocity,delta:1/30});
    feet=[result.position[0],result.elevation,result.position[1]];
    velocity=result.velocity;
    assert.ok(feet[1]>=-0.00001);
  }
  assert.ok(Math.abs(feet[1])<0.00001);
  assert.equal(velocity,0);
});

test('malha densa armazena cada triângulo uma única vez e limita a consulta à região próxima', t => {
  const geometry=new PlaneGeometry(100,100,200,200);
  const started=performance.now();
  const tree=collisionGeometry(geometry);
  const buildMs=performance.now()-started;
  let stored=0,largestLeaf=0;
  const count=node=>{
    if(node.left) {count(node.left);count(node.right);}
    else {stored+=node.end-node.start;largestLeaf=Math.max(largestLeaf,node.end-node.start);}
  };
  count(tree.root);
  assert.equal(stored,80000);
  assert.ok(largestLeaf<=16);
  let candidates=0;
  const query=new Box3(new Vector3(-0.01,-0.01,-0.01),new Vector3(0.01,0.01,0.01));
  const queryStarted=performance.now();
  for(let i=0;i<100;i+=1) tree.query(query,()=>{candidates+=1;});
  assert.ok(candidates<=6400);
  assert.equal(collisionGeometry(geometry),tree);
  t.diagnostic(`80.000 triângulos: construção ${buildMs.toFixed(1)} ms; 100 consultas ${(performance.now()-queryStarted).toFixed(1)} ms; ${candidates/100} candidatos por consulta`);
});

test('não constrói árvores de objetos distantes e reaproveita a geometria entre instâncias', () => {
  const near=box(0,0,0,1,1,1),far=box(100,0,100,1,1,1);
  far.geometry.computeBoundingBox();
  let reads=0;
  const original=far.geometry.attributes.position.getX;
  far.geometry.attributes.position.getX=function(...args) {reads+=1;return original.apply(this,args);};
  const world=createTokenCollisionWorld([near,far]);
  world.groundAt(0,0,2,-2);
  assert.equal(reads,0);
  const tree=collisionGeometry(near.geometry);
  const second=new Mesh(near.geometry);second.position.y=3;second.updateMatrixWorld(true);
  assert.equal(createTokenCollisionWorld([second]).groundAt(0,0,4,2),3.5);
  assert.equal(collisionGeometry(second.geometry),tree);
  near.geometry.attributes.position.needsUpdate=true;
  assert.notEqual(collisionGeometry(near.geometry),tree);
});

test('camera sweep stops in front of a thin wall and clears when the wall moves',()=>{
 const wall=box(0,1,1,4,4,.02);
 let result=resolveCameraObstruction(createTokenCollisionWorld([wall]),[0,1,0],[0,1,3],.08);
 assert.ok(result.position[2]<.92 && result.position[2]>.90);
 wall.position.x=10;wall.updateMatrixWorld(true);
 result=resolveCameraObstruction(createTokenCollisionWorld([wall]),[0,1,0],[0,1,3],.08);
 assert.deepEqual(result.position,[0,1,3]);assert.equal(result.fraction,1);
});
test('camera sweep respects ceilings and ignores hidden map meshes',()=>{
 const ceiling=box(0,2,0,4,.02,4);
 const result=resolveCameraObstruction(createTokenCollisionWorld([ceiling]),[0,1,0],[0,3,0],.08);
 assert.ok(result.position[1]<1.92 && result.position[1]>1.90);
 const scene=new Group();scene.userData.mapCollision=true;scene.add(ceiling);ceiling.visible=false;
 assert.deepEqual(resolveCameraObstruction(createTokenCollisionWorld(mapCollisionMeshes(scene)),[0,1,0],[0,3,0]).position,[0,3,0]);
});
