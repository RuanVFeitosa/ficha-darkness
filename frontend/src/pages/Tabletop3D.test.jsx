jest.mock('three', () => {
 class Vector3 { constructor() {this.set(0,0,0);} set(x,y,z) {this.x=x;this.y=y;this.z=z;return this;} add(v) {this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} copy(v) {return this.set(v.x,v.y,v.z);} sub(v) {this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;} multiplyScalar(k) {this.x*=k;this.y*=k;this.z*=k;return this;} toArray() {return [this.x,this.y,this.z];} }
 return {Raycaster:class {setFromCamera() {} intersectObjects() {return [];}},Vector2:class {},Vector3,Plane:class {},PerspectiveCamera:class {position=new Vector3(); updateProjectionMatrix() {}},MOUSE:{},TOUCH:{}};
});
jest.mock('../utils/tabletopCollision', () => ({mapCollisionPending:jest.fn(() => false),mapCollisionMeshes:jest.fn(() => []),collisionSignature:jest.fn(() => ''),createTokenCollisionWorld:jest.fn(() => ({})),moveTokenWithCollision:jest.fn()}));
import {moveTokenWithCollision,mapCollisionPending,mapCollisionMeshes,createTokenCollisionWorld} from '../utils/tabletopCollision';
import React from 'react';
import { render,screen,fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import { Camera, useTokenDragCollision, PlayerTokenNavigation, StaticSceneCinema, SceneBoundary } from './Tabletop3D';
import { useFrame } from '@react-three/fiber';
const mockCamera = new THREE.PerspectiveCamera();
let mockOrbit;
const mockGl = { domElement: document.createElement('canvas') };
jest.mock('@react-three/fiber', () => ({useThree: () => ({camera:mockCamera,gl:mockGl,scene:{children:[]}}),useFrame:jest.fn()}));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({OrbitControls:class {target=new (require('three').Vector3)(); constructor() {mockOrbit=this;} update() {} dispose() {}}}));
jest.mock('../components/tabletop/MapEditor3D', () => ({}));
jest.mock('../components/tabletop/RealisticAvatar3D', () => ({}));
jest.mock('../services/imageCompression', () => ({}));
jest.mock('../services/mesaApi', () => ({}));
const spawn={position:[3,4,5],target:[0,1,0],fov:42};

test('loading map preserves saved token height until collision geometry is ready',()=>{
 createTokenCollisionWorld.mockReturnValue({});
 mapCollisionPending.mockReturnValue(true);
 const move=jest.fn(),controller={current:null};
 const before=moveTokenWithCollision.mock.calls.length;
 const {unmount}=render(<PlayerTokenNavigation collision enabled position={[10,20]} elevation={3} collisionController={controller} onMove={move}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 const camera={getWorldDirection:vector=>vector.set(0,0,-1)};
 for(let i=0;i<120;i++) frame({camera},1/60);
 expect(moveTokenWithCollision.mock.calls.length).toBe(before);
 expect(move).not.toHaveBeenCalled();
 expect(controller.current([11,20])).toEqual({position:[10,20],elevation:3,velocity:0});
 mapCollisionPending.mockReturnValue(false);
 moveTokenWithCollision.mockReturnValue({position:[10,20],elevation:3,velocity:0});
 window.dispatchEvent(new Event('darkness:map-collision-changed'));
 frame({camera},1/60);
 expect(moveTokenWithCollision).toHaveBeenLastCalledWith(expect.anything(),[10,3,20],[10,20],expect.objectContaining({recoverSpawn:true,velocity:0}));
 expect(move).not.toHaveBeenCalled();
 unmount();
});

test('player collision follows every frame and releasing movement stops immediately',()=>{
 const move=jest.fn(),stop=jest.fn();
 moveTokenWithCollision.mockImplementation((_world,_feet,destination)=>({position:destination,elevation:0,velocity:0}));
 const {unmount}=render(<PlayerTokenNavigation collision enabled position={[10,20]} onMove={move} onStop={stop}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 const camera={getWorldDirection:vector=>vector.set(0,0,-1)};
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));
 for(let i=0;i<6;i++) frame({camera},1/120);
 expect(move).toHaveBeenCalledTimes(6);
 expect(move.mock.calls[5][0][1]).toBeLessThan(move.mock.calls[0][0][1]);
 window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));
 expect(stop).toHaveBeenCalledTimes(1);
 frame({camera},1/120);
 expect(move).toHaveBeenCalledTimes(6);
 unmount();
});
test('preserva navegação após atualizar campanha e aplica spawn ao trocar mapa', () => {
 const {rerender}=render(<Camera view="room" spawnKey="a" spawnPose={spawn}/>);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
 mockCamera.position.set(8,9,10);
 rerender(<Camera view="room" spawnKey="a" spawnPose={{...spawn}}/>);
 expect(mockCamera.position.toArray()).toEqual([8,9,10]);
 rerender(<Camera view="panorama" spawnKey="a" spawnPose={{...spawn}}/>);
 expect(mockCamera.position.toArray()).toEqual([8,9,10]);
 expect(mockCamera.fov).not.toBe(65);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({},.05);
 expect(mockCamera.fov).toBeGreaterThan(spawn.fov);
 expect(mockCamera.fov).toBeLessThan(65);
 for(let i=0;i<14;i++) frame({},.05);
 expect(mockCamera.fov).toBe(65);
 rerender(<Camera view="panorama" spawnKey="b" spawnPose={spawn}/>);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
});

test('Cinema troca imediatamente e cancela uma transição de câmera em andamento', () => {
 const {rerender}=render(<Camera view="room"/>);
 rerender(<Camera view="panorama"/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({},.05);
 expect(mockCamera.fov).toBeLessThan(65);
 rerender(<Camera view="cinema"/>);
 const cinemaFov=mockCamera.fov;
 const nextFrame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<15;i++) nextFrame({},.05);
 expect(mockCamera.fov).toBe(cinemaFov);
});
test('aplica spawn carregado depois da entrada', () => {
 const {rerender}=render(<Camera view="room" spawnKey="a"/>);
 rerender(<Camera view="room" spawnKey="a" spawnPose={spawn}/>);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
});
test('arrastar com botão direito muda a direção sem deslocar a câmera', () => {
 render(<Camera view="room" spawnKey="a" spawnPose={spawn}/>);
 const before=mockCamera.position.toArray();
 const pointer=(type,x,y) => {
  const event=new Event(type,{bubbles:true,cancelable:true});
  Object.assign(event,{button:2,pointerId:1,clientX:x,clientY:y});
  return event;
 };
 mockGl.domElement.dispatchEvent(pointer('pointerdown',100,100));
 window.dispatchEvent(pointer('pointermove',200,150));
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},1/60);
 expect(mockOrbit.target.toArray()).not.toEqual(spawn.target);
 expect(mockOrbit.enabled).toBe(false);
 expect(mockCamera.position.toArray()).toEqual(before);
 window.dispatchEvent(pointer('pointerup',200,150));
 expect(mockOrbit.enabled).toBe(true);
 const first=mockOrbit.target.toArray();
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({},1/60);
 expect(mockOrbit.target.toArray()).not.toEqual(first);
 for(let i=0;i<120;i++)frame({},1/60);
 const settled=mockOrbit.target.toArray();
 frame({},1/60);
 expect(mockOrbit.target.toArray()).toEqual(settled);
 expect(mockCamera.position.toArray()).toEqual(before);
});

test('jogador não gira com botão direito e mantém o controle esquerdo',()=>{
 render(<Camera allowRightLook={false} view="room" spawnKey="player-right-blocked" spawnPose={spawn}/>);
 const before=mockOrbit.target.toArray();
 const pointer=(type,x)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button:2,pointerId:1,clientX:x,clientY:100});return event;};
 mockGl.domElement.dispatchEvent(pointer('pointerdown',100));
 window.dispatchEvent(pointer('pointermove',200));
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},1/60);
 expect(mockOrbit.target.toArray()).toEqual(before);
 expect(mockOrbit.mouseButtons.RIGHT).toBeNull();
 expect(mockOrbit.mouseButtons).toHaveProperty('LEFT');
 expect(mockOrbit.enabled).toBe(true);
 window.dispatchEvent(pointer('pointerup',200));
});

test('distância do jogador aproxima suavemente preservando o alvo',()=>{
 render(<Camera mode="character" characterDistance={2} view="room" spawnKey="distance" spawnPose={spawn}/>);
 const target=mockOrbit.target.toArray();
 const distance=()=>Math.hypot(mockCamera.position.x-mockOrbit.target.x,mockCamera.position.y-mockOrbit.target.y,mockCamera.position.z-mockOrbit.target.z);
 const initial=distance();const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({},1/60);
 expect(distance()).toBeLessThan(initial);expect(distance()).toBeGreaterThan(2);
 for(let i=0;i<120;i++)frame({},1/60);
 expect(distance()).toBeCloseTo(2,2);
 expect(mockOrbit.target.toArray()).toEqual(target);
});

test('primeira pessoa segue os olhos e permite olhar com o esquerdo sem orbitar',()=>{
 const props={mode:'character',followPosition:[4,7],followHeight:2,followElevation:1,allowRightLook:false};
 const {rerender}=render(<Camera {...props} view="room"/>);
 const original=mockCamera.position.toArray();
 rerender(<Camera {...props} view="firstPerson"/>);
 let frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<90;i++)frame({},1/60);
 expect(mockCamera.position.x).toBeCloseTo(4,3);
 expect(mockCamera.position.y).toBeCloseTo(2.8,3);
 expect(mockCamera.position.z).toBeCloseTo(7,3);
 expect(mockOrbit.enabled).toBe(false);
 const target=mockOrbit.target.toArray();
 const pointer=(type,x)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button:0,pointerId:1,clientX:x,clientY:100});return event;};
 mockGl.domElement.dispatchEvent(pointer('pointerdown',100));
 window.dispatchEvent(pointer('pointermove',180));frame({},1/60);
 expect(mockOrbit.target.toArray()).not.toEqual(target);
 expect(mockCamera.position.x).toBeCloseTo(4,3);
 window.dispatchEvent(pointer('pointerup',180));
 rerender(<Camera {...props} view="room"/>);
 frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<40;i++)frame({},1/60);
 expect(mockCamera.position.toArray()).toEqual(original);
});

test('câmera acompanha a posição renderizada do token sem atraso relativo nem saltos da rede',()=>{
 let pose={position:[0,0],elevation:0};
 const props={mode:'character',followPosition:[0,0],followHeight:1,followElevation:0,getFollowPose:()=>pose};
 const {rerender}=render(<Camera {...props}/>);
 let frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=1;i<=60;i+=1) {
   pose={position:[i*.01,i*.02],elevation:i*.001};
   frame({},1/60);
   expect(mockCamera.position.x-pose.position[0]).toBeCloseTo(.35,6);
   expect(mockCamera.position.y-pose.elevation).toBeCloseTo(.75,6);
   expect(mockCamera.position.z-pose.position[1]).toBeCloseTo(1.1,6);
 }
 const before=mockCamera.position.toArray();
 rerender(<Camera {...props} followPosition={[100,100]}/>);
 frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];frame({},1/60);
 expect(mockCamera.position.toArray()).toEqual(before);
 expect(useFrame.mock.calls[useFrame.mock.calls.length-1][1]).toBe(-1);
 expect(mockOrbit.zoomToCursor).toBe(false);
 expect(mockOrbit.enablePan).toBe(false);
 expect(mockOrbit.minDistance).toBe(.8);
});
test('Meu personagem enquadra o token próximo, à esquerda e na altura da superfície', () => {
 render(<Camera mode="character" followPosition={[10,20]} followHeight={2} followElevation={3}/>);
 expect(mockCamera.position.toArray()).toEqual([10.7,4.5,22.2]);
 expect(mockOrbit.target.toArray()).toEqual([10.7,4.3,20]);
 expect(mockCamera.fov).toBe(50);
});
test('navegação aplica posição e altura resolvidas pela colisão, inclusive em repouso', () => {
 const move=jest.fn(),controller={current:null};
 moveTokenWithCollision.mockReturnValue({position:[10,20],elevation:3.1,velocity:0});
 const {unmount}=render(<PlayerTokenNavigation collision enabled elevation={0} baseElevation={3} position={[10,20]} collisionController={controller} onMove={move}/>);
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]({camera:{getWorldDirection:vector=>vector.set(0,0,-1)}},0.05);
 expect(move).toHaveBeenCalledWith([10,20],expect.closeTo(0.1));
 expect(controller.current([12,21])).toEqual({position:[10,20],elevation:3.1,velocity:0});
 unmount();
 expect(controller.current).toBeNull();
});

test('personagem parado suspende a física e reaproveita o mundo de colisão', () => {
 moveTokenWithCollision.mockReturnValue({position:[10,20],elevation:0,velocity:0});
 const beforeMoves=moveTokenWithCollision.mock.calls.length;
 const beforeScans=mapCollisionMeshes.mock.calls.length;
 const beforeBuilds=createTokenCollisionWorld.mock.calls.length;
 const {unmount}=render(<PlayerTokenNavigation collision enabled position={[10,20]} onMove={jest.fn()}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 const camera={getWorldDirection:vector=>vector.set(0,0,-1)};
 for(let i=0;i<120;i+=1) frame({camera},1/60);
 expect(moveTokenWithCollision.mock.calls.length-beforeMoves).toBe(1);
 expect(mapCollisionMeshes.mock.calls.length-beforeScans).toBe(1);
 expect(createTokenCollisionWorld.mock.calls.length-beforeBuilds).toBe(1);
 unmount();
});

test('interação com porta revalida a colisão imediatamente, inclusive com jogador parado',()=>{
 moveTokenWithCollision.mockReturnValue({position:[10,20],elevation:0,velocity:0});
 const before=mapCollisionMeshes.mock.calls.length;
 const {unmount}=render(<PlayerTokenNavigation collision enabled position={[10,20]} onMove={jest.fn()}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 const camera={getWorldDirection:vector=>vector.set(0,0,-1)};
 frame({camera},.05);
 window.dispatchEvent(new Event('darkness:map-collision-changed'));
 frame({camera},.05);
 expect(mapCollisionMeshes.mock.calls.length-before).toBe(2);
 unmount();
});

test('WASD movimenta o token na direção da câmera e salva ao soltar', () => {
 const move=jest.fn(),stop=jest.fn();
 render(<PlayerTokenNavigation enabled position={[10,20]} onMove={move} onStop={stop}/>);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({camera:{getWorldDirection:vector => vector.set(0,0,-1)}},0.05);
 expect(move.mock.calls[0][0][0]).toBe(10);
 expect(move.mock.calls[0][0][1]).toBeGreaterThan(19.9675);
 expect(move.mock.calls[0][0][1]).toBeLessThan(20);
 window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));
 expect(stop).toHaveBeenCalledTimes(1);
});
test('WASD não movimenta token quando o controle está desativado', () => {
 const move=jest.fn();
 render(<PlayerTokenNavigation enabled={false} position={[10,20]} onMove={move}/>);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({camera:{getWorldDirection:vector => vector.set(0,0,-1)}},0.05);
 expect(move).not.toHaveBeenCalled();
});
test('cena estática oculta interface uma vez e devolve interface ao retornar ao mapa', () => {
 const change=jest.fn();
 const {rerender}=render(<StaticSceneCinema activeKey="scene-1" mestre={false} onHudChange={change}/>);
 expect(change).toHaveBeenLastCalledWith(true);
 change.mockClear();
 rerender(<StaticSceneCinema activeKey="scene-1" mestre={false} onHudChange={change}/>);
 expect(change).not.toHaveBeenCalled();
 rerender(<StaticSceneCinema activeKey="" mestre={false} onHudChange={change}/>);
 expect(change).toHaveBeenLastCalledWith(false);
});
test('cena estática não força modo cinema para o mestre', () => {
 const change=jest.fn();
 render(<StaticSceneCinema activeKey="scene-1" mestre onHudChange={change}/>);
 expect(change).not.toHaveBeenCalled();
});
test('WASD no mapa tático segue os eixos do mapa independentemente da câmera 3D', () => {
 const move=jest.fn();
 render(<PlayerTokenNavigation enabled cameraRelative={false} position={[10,20]} onMove={move}/>);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({camera:{getWorldDirection:vector => vector.set(1,0,0)}},0.05);
 expect(move.mock.calls[0][0][0]).toBe(10);
 expect(move.mock.calls[0][0][1]).toBeGreaterThan(19.9675);
 expect(move.mock.calls[0][0][1]).toBeLessThan(20);
 window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));
});
test('enquadra o token suavemente ao abrir a ficha e restaura ao fechar',()=>{
 const {rerender}=render(<Camera mode="character" followPosition={[4,7]} followHeight={1} followElevation={2}/>);
 const previous=mockCamera.position.toArray();
 rerender(<Camera mode="character" followPosition={[4,7]} followHeight={1} followElevation={2} sheetFocus/>);
 expect(mockCamera.position.toArray()).toEqual(previous);
 let frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({},0.05);
 expect(mockCamera.position.toArray()).not.toEqual(previous);
 expect(mockCamera.position.toArray()).not.toEqual([4,2.6,8.7]);
 for(let i=0;i<11;i++)frame({},0.05);
 const left=4-1.1*Math.tan(25*Math.PI/180)*(16/9)*0.64;
 expect(mockOrbit.target.toArray()).toEqual([left,2.65,7]);
 expect(mockCamera.position.toArray()).toEqual([left,2.75,8.1]);
 rerender(<Camera mode="character" followPosition={[4,7]} followHeight={1} followElevation={2}/>);
 frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)frame({},0.05);
 expect(mockCamera.position.toArray()).toEqual(previous);
});
test('compact mobile sheet frames the character in the centre of the remaining right field',()=>{
 const bounds=mockGl.domElement.getBoundingClientRect;
 mockGl.domElement.getBoundingClientRect=()=>({left:0,top:0,width:920,height:430});
 const props={touchNavigation:true,mode:'character',followPosition:[4,7],followHeight:1,getSheetBounds:()=>({right:452})};
 try {
  const {rerender}=render(<Camera {...props}/>);
  const before=mockCamera.position.toArray();
  rerender(<Camera {...props} sheetFocus/>);
  const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
  for(let i=0;i<12;i++)frame({},.05);
  const expectedRight=1.1*Math.tan(25*Math.PI/180)*(Number(mockCamera.aspect)||16/9)*(452/920);
  expect(4-mockOrbit.target.x).toBeCloseTo(expectedRight);
  expect(mockCamera.position.y).toBe(before[1]);
  expect(mockCamera.position.z).toBe(before[2]);
  rerender(<Camera {...props}/>);
  const restore=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
  for(let i=0;i<12;i++)restore({},.05);
  expect(mockCamera.position.toArray()).toEqual(before);
 } finally {mockGl.domElement.getBoundingClientRect=bounds;}
});

test('ajusta a câmera lateralmente preservando ângulo e distância',()=>{
 const props={mode:'character',followPosition:[4,7],followHeight:1};
 const {rerender}=render(<Camera {...props}/>);
 mockCamera.position.set(3,0.7,8.5);
 mockOrbit.target.set(3,0.5,7);
 const previous=mockCamera.position.toArray();
 rerender(<Camera {...props} sheetFocus/>);
 expect(mockCamera.position.toArray()).toEqual(previous);
 expect(mockOrbit.target.toArray()).toEqual([3,0.5,7]);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)frame({},0.05);
 expect(mockCamera.position.y).toBe(0.7);
 expect(mockCamera.position.z).toBe(8.5);
 expect(mockCamera.position.x).toBe(mockOrbit.target.x);
 expect(mockCamera.position.x).not.toBe(3);
 rerender(<Camera {...props}/>);
 const closeFrame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)closeFrame({},0.05);
 expect(mockCamera.position.toArray()).toEqual(previous);
});
test.each([0,45,90,135,180,225,270,315])('enquadra à direita preservando o ângulo de %s graus',angle=>{
 const props={mode:'character',followPosition:[4,7],followHeight:1};
 const {rerender}=render(<Camera {...props}/>);
 const radians=angle*Math.PI/180;
 mockOrbit.target.set(4,0.5,7);
 mockCamera.position.set(4+Math.sin(radians)*2,0.7,7+Math.cos(radians)*2);
 const dx=mockCamera.position.x-mockOrbit.target.x,dz=mockCamera.position.z-mockOrbit.target.z;
 rerender(<Camera {...props} sheetFocus/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)frame({},0.05);
 expect(mockCamera.position.x-mockOrbit.target.x).toBeCloseTo(dx);
 expect(mockCamera.position.z-mockOrbit.target.z).toBeCloseTo(dz);
 const right=(4-mockOrbit.target.x)*Math.cos(radians)-(7-mockOrbit.target.z)*Math.sin(radians);
 expect(right).toBeCloseTo(2*Math.tan(25*Math.PI/180)*(16/9)*0.64);
});
test('foco do mestre viaja suavemente até o enquadramento do jogador',()=>{
 const {rerender}=render(<Camera mode="free" view="room"/>);
 rerender(<Camera mode="character" focusRequest={1} followPosition={[4,7]} followHeight={1} followElevation={2}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)frame({},0.05);
 expect(mockCamera.position.toArray()).toEqual([4.35,2.75,8.1]);
 expect(mockOrbit.target.toArray()).toEqual([4.35,2.65,7]);
 rerender(<Camera mode="character" focusRequest={2} followPosition={[8,3]} followHeight={1}/>);
 const nextFrame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)nextFrame({},0.05);
 expect(mockCamera.position.toArray()).toEqual([8.35,0.75,4.1]);
});
test('desvincula do token sem reposicionar ao escolher modos do mestre',()=>{
 const {rerender}=render(<Camera mode="character" focusRequest={1} followPosition={[4,7]} followHeight={1}/>);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 for(let i=0;i<12;i++)frame({},0.05);
 const position=mockCamera.position.toArray(),target=mockOrbit.target.toArray();
 for(const view of ['room','cinema','close','top']) {
  rerender(<Camera mode="free" focusRequest={1} view={view}/>);
  expect(mockCamera.position.toArray()).toEqual(position);
  expect(mockOrbit.target.toArray()).toEqual(target);
 }
});
test('olhar no mesmo lugar também funciona na câmera vinculada ao token', () => {
 render(<Camera mode="character" followPosition={[10,20]} followHeight={2}/>);
 const before=mockCamera.position.toArray();
 const previousTarget=mockOrbit.target.toArray();
 const pointer=(type,x,y) => {const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button:2,pointerId:99,clientX:x,clientY:y});return event;};
 mockGl.domElement.dispatchEvent(pointer('pointerdown',100,100));
 window.dispatchEvent(pointer('pointermove',200,150));
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},1/60);
 expect(mockOrbit.target.toArray()).not.toEqual(previousTarget);
 expect(mockCamera.position.toArray()).toEqual(before);
 window.dispatchEvent(pointer('pointerup',200,150));
 expect(mockOrbit.enabled).toBe(true);
 expect(mockCamera.position.toArray()).toEqual(before);
});

const touchEvent=(type,id,x,y) => {const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button:0,pointerType:'touch',pointerId:id,clientX:x,clientY:y});return event;};

test('mobile player uses the same native orbit across the whole canvas without a stationary-look jump',()=>{
 const raycast=jest.spyOn(THREE.Raycaster.prototype,'intersectObjects');
 const forwarded=jest.fn();
 render(<Camera touchNavigation mode="character" view="room" followPosition={[10,20]} followHeight={1}/>);
 mockGl.domElement.addEventListener('pointerdown',forwarded);
 try {
  const initial=mockCamera.position.toArray();
  const down=touchEvent('pointerdown',1,100,100);
  mockGl.domElement.dispatchEvent(down);
  expect(forwarded).toHaveBeenCalledTimes(1);
  expect(down.defaultPrevented).toBe(false);
  expect(raycast).not.toHaveBeenCalled();
  expect(mockOrbit.enabled).toBe(true);
  expect(mockOrbit.enablePan).toBe(false);
  expect(mockOrbit.zoomToCursor).toBe(false);
  expect(mockOrbit.minPolarAngle).toBe(.45);
  expect(mockOrbit.maxPolarAngle).toBeGreaterThan(Math.PI/2);
  expect(mockOrbit.maxPolarAngle).toBeLessThan(Math.PI);
  window.dispatchEvent(touchEvent('pointermove',1,200,-200));
  useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},1/60);
  expect(mockCamera.position.toArray()).toEqual(initial);
  window.dispatchEvent(touchEvent('pointerup',1,200,-200));
 } finally {mockGl.domElement.removeEventListener('pointerdown',forwarded);raycast.mockRestore();}
});

test('mobile first person keeps native orbit disabled after finishing a look gesture',()=>{
 render(<Camera touchNavigation mode="character" view="firstPerson" followPosition={[10,20]}/>);
 mockGl.domElement.dispatchEvent(touchEvent('pointerdown',1,100,100));
 window.dispatchEvent(touchEvent('pointermove',1,160,120));
 window.dispatchEvent(touchEvent('pointerup',1,160,120));
 expect(mockOrbit.enabled).toBe(false);
});

test('arrasto de toque gira a câmera sem deslocar sua posição', () => {
 render(<Camera view="room" spawnKey="touch" spawnPose={spawn}/>);
 const before=mockCamera.position.toArray();
 mockGl.domElement.getBoundingClientRect=() => ({left:0,top:0,width:600,height:400});
 mockGl.domElement.dispatchEvent(touchEvent('pointerdown',1,100,100));
 window.dispatchEvent(touchEvent('pointermove',1,200,140));
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},1/60);
 expect(mockCamera.position.toArray()).toEqual(before);
 expect(mockOrbit.target.toArray()).not.toEqual(spawn.target);
 expect(mockOrbit.enabled).toBe(false);
 window.dispatchEvent(touchEvent('pointerup',1,200,140));
 expect(mockOrbit.enabled).toBe(true);
});
test('pinça aproxima a câmera e libera os controles após soltar', () => {
 render(<Camera view="room" spawnKey="pinch" spawnPose={spawn}/>);
 mockGl.domElement.dispatchEvent(touchEvent('pointerdown',1,100,100));
 mockGl.domElement.dispatchEvent(touchEvent('pointerdown',2,200,100));
 window.dispatchEvent(touchEvent('pointermove',2,210,100));
 const distance=() => Math.hypot(mockCamera.position.x-mockOrbit.target.x,mockCamera.position.y-mockOrbit.target.y,mockCamera.position.z-mockOrbit.target.z);
 const before=distance();
 window.dispatchEvent(touchEvent('pointermove',2,300,100));
 expect(distance()).toBeLessThan(before);
 window.dispatchEvent(touchEvent('pointerup',2,300,100));
 window.dispatchEvent(touchEvent('pointerup',1,100,100));
 expect(mockOrbit.enabled).toBe(true);
});

test('WebGL failures offer retry and an ordinary 2D table without losing the campaign',() => {const log=jest.spyOn(console,'error').mockImplementation(() => {});let fail=true;function Scene(){if(fail) throw new Error('FEATURE_FAILURE_WEBGL_EXHAUSTED_DRIVERS');return <div>Cena recuperada</div>;}try{render(<SceneBoundary><Scene/></SceneBoundary>);expect(screen.getByRole('heading')).toHaveTextContent('O navegador não conseguiu iniciar o 3D');expect(screen.getByRole('link',{name:'Abrir mesa 2D'})).toBeInTheDocument();fail=false;fireEvent.click(screen.getByRole('button',{name:'Tentar abrir o 3D novamente'}));expect(screen.getByText('Cena recuperada')).toBeInTheDocument();}finally{log.mockRestore();}});
test('asset failures do not incorrectly blame graphics acceleration',() => {const log=jest.spyOn(console,'error').mockImplementation(() => {});function Scene(){throw new Error('Could not load image');}try{render(<SceneBoundary><Scene/></SceneBoundary>);expect(screen.getByRole('heading')).toHaveTextContent('Não foi possível carregar a cena');expect(screen.queryByText(/aceleração de hardware/)).not.toBeInTheDocument();}finally{log.mockRestore();}});

test('drag collision uses rendered feet and preserves the pose while the map loads',()=>{
 const ref={current:{position:{x:2,y:3,z:4}}};
 let resolve;
 function Harness() {resolve=useTokenDragCollision(ref,.35,1);return null;}
 createTokenCollisionWorld.mockReturnValue({});
 mapCollisionPending.mockReturnValue(false);
 moveTokenWithCollision.mockReturnValue({position:[5,6],elevation:3.2});
 const {unmount}=render(<Harness/>);
 expect(resolve([8,9])).toEqual({position:[5,6],elevation:3.2});
 expect(moveTokenWithCollision).toHaveBeenLastCalledWith({},[2,3,4],[8,9],expect.objectContaining({scale:.35,baseElevation:1,recoverSpawn:true}));
 ref.current.position={x:5,y:3.2,z:6};
 mapCollisionPending.mockReturnValue(true);
 moveTokenWithCollision.mockClear();
 expect(resolve([10,10])).toEqual({position:[5,6],elevation:3.2});
 expect(moveTokenWithCollision).not.toHaveBeenCalled();
 mapCollisionPending.mockReturnValue(false);
 unmount();
});

test('over shoulder camera frames ahead and follows rendered feet without drifting',()=>{
 let pose={position:[4,7],elevation:2};
 render(<Camera overShoulder mode="character" view="room" followPosition={[4,7]} followHeight={1} followElevation={2} getFollowPose={()=>pose}/>);
 expect(mockCamera.position.toArray()).toEqual([4.32,2.86,7.95]);
 expect(mockOrbit.target.toArray()).toEqual([4.32,2.7800000000000002,6.55]);
 expect(mockCamera.fov).toBe(48);
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 const start=mockCamera.position.toArray();
 for(let i=0;i<120;i++) frame({},1/60);
 start.forEach((value,index)=>expect(mockCamera.position.toArray()[index]).toBeCloseTo(value,8));
 pose={position:[5,9],elevation:2.3};
 frame({},1/60);
 expect(mockCamera.position.x).toBeCloseTo(start[0]+1,8);
 expect(mockCamera.position.y).toBeCloseTo(start[1]+.3,8);
 expect(mockCamera.position.z).toBeCloseTo(start[2]+2,8);
});

test.each([false,true])('shoulder camera can look above and below the horizon (touch: %s)',touch=>{
 render(<Camera overShoulder touchNavigation={touch} mode="character" view="room" followPosition={[0,0]} followHeight={1}/>);
 expect(mockOrbit.minPolarAngle).toBeLessThan(Math.PI/2);
 expect(mockOrbit.maxPolarAngle).toBeGreaterThan(Math.PI/2+Math.PI/3);
 expect(mockOrbit.maxPolarAngle).toBeLessThan(Math.PI);
});
