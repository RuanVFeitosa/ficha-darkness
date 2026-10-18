jest.mock('three', () => {
 class Vector3 { constructor() {this.set(0,0,0);} set(x,y,z) {this.x=x;this.y=y;this.z=z;return this;} toArray() {return [this.x,this.y,this.z];} }
 return {Raycaster:class {setFromCamera() {} intersectObjects() {return [];}},Vector2:class {},Vector3,Plane:class {},PerspectiveCamera:class {position=new Vector3(); updateProjectionMatrix() {}},MOUSE:{},TOUCH:{}};
});
import React from 'react';
import { render,screen,fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import { Camera, PlayerTokenNavigation, StaticSceneCinema, SceneBoundary } from './Tabletop3D';
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
test('preserva navegação após atualizar campanha e aplica spawn ao trocar mapa', () => {
 const {rerender}=render(<Camera view="room" spawnKey="a" spawnPose={spawn}/>);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
 mockCamera.position.set(8,9,10);
 rerender(<Camera view="room" spawnKey="a" spawnPose={{...spawn}}/>);
 expect(mockCamera.position.toArray()).toEqual([8,9,10]);
 rerender(<Camera view="panorama" spawnKey="a" spawnPose={{...spawn}}/>);
 expect(mockCamera.position.toArray()).toEqual([8,9,10]);
 expect(mockCamera.fov).toBe(65);
 rerender(<Camera view="panorama" spawnKey="b" spawnPose={spawn}/>);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
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
 expect(mockOrbit.target.toArray()).not.toEqual(spawn.target);
 expect(mockOrbit.enabled).toBe(false);
 expect(mockCamera.position.toArray()).toEqual(before);
 window.dispatchEvent(pointer('pointerup',200,150));
 expect(mockOrbit.enabled).toBe(true);
 expect(mockCamera.position.toArray()).toEqual(before);
});
test('Meu personagem enquadra o token próximo, à esquerda e na altura da superfície', () => {
 render(<Camera mode="character" followPosition={[10,20]} followHeight={2} followElevation={3}/>);
 expect(mockCamera.position.toArray()).toEqual([10.7,4.5,22.2]);
 expect(mockOrbit.target.toArray()).toEqual([10.7,4.3,20]);
 expect(mockCamera.fov).toBe(50);
});
test('WASD movimenta o token na direção da câmera e salva ao soltar', () => {
 const move=jest.fn(),stop=jest.fn();
 render(<PlayerTokenNavigation enabled position={[10,20]} onMove={move} onStop={stop}/>);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));
 const frame=useFrame.mock.calls[useFrame.mock.calls.length-1][0];
 frame({camera:{getWorldDirection:vector => vector.set(0,0,-1)}},0.05);
 expect(move).toHaveBeenCalledWith([10,19.9675]);
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
 expect(move).toHaveBeenCalledWith([10,19.9675]);
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
 expect(mockOrbit.target.toArray()).not.toEqual(previousTarget);
 expect(mockCamera.position.toArray()).toEqual(before);
 window.dispatchEvent(pointer('pointerup',200,150));
 expect(mockOrbit.enabled).toBe(true);
 expect(mockCamera.position.toArray()).toEqual(before);
});

const touchEvent=(type,id,x,y) => {const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button:0,pointerType:'touch',pointerId:id,clientX:x,clientY:y});return event;};
test('arrasto de toque gira a câmera sem deslocar sua posição', () => {
 render(<Camera view="room" spawnKey="touch" spawnPose={spawn}/>);
 const before=mockCamera.position.toArray();
 mockGl.domElement.getBoundingClientRect=() => ({left:0,top:0,width:600,height:400});
 mockGl.domElement.dispatchEvent(touchEvent('pointerdown',1,100,100));
 window.dispatchEvent(touchEvent('pointermove',1,200,140));
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
