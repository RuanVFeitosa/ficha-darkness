import React from 'react';
import {render,fireEvent} from '@testing-library/react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import TabletopCamera from './TabletopCamera';
jest.mock('three',()=>{
 class Vector3 {
  constructor(x=0,y=0,z=0){this.set(x,y,z);}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  copy(v){return this.set(v.x,v.y,v.z);}
  multiplyScalar(k){return this.set(this.x*k,this.y*k,this.z*k);}
  lengthSq(){return this.x**2+this.y**2+this.z**2;}
  normalize(){return this.multiplyScalar(1/(Math.sqrt(this.lengthSq()) || 1));}
  crossVectors(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);}
  toArray(){return [this.x,this.y,this.z];}
 }
 return {Vector3,MOUSE:{ROTATE:0,DOLLY:1,PAN:2},TOUCH:{ROTATE:0,DOLLY_PAN:1}};
});
const mockCamera={position:new THREE.Vector3(),up:new THREE.Vector3(0,1,0),fov:42,updateProjectionMatrix(){},getWorldDirection(vector){return vector.set(0,0,-1);}};
const mockCanvas=document.createElement('canvas');
const mockGl={domElement:mockCanvas};
let mockOrbit;
jest.mock('@react-three/fiber',()=>({useThree:()=>({camera:mockCamera,gl:mockGl,scene:{children:[]}}),useFrame:jest.fn()}));
jest.mock('three/examples/jsm/controls/OrbitControls.js',()=>({OrbitControls:class {target=new (require('three').Vector3)();constructor(){mockOrbit=this;}update(){}dispose(){}}}));
const spawn={position:[3,4,5],target:[0,1,0],fov:42};
const frame=delta=>useFrame.mock.calls.at(-1)[0]({},delta);
function pointer(type,button,x,y){const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{button,pointerId:1,clientX:x,clientY:y});return event;}
beforeEach(()=>document.body.appendChild(mockCanvas));
afterEach(()=>{mockCanvas.remove();jest.clearAllMocks();});

test.each([['room',2],['firstPerson',0]])('%s supports looking in place with button %s and samples the resulting direction', (view,button)=>{
 const sample=jest.fn();
 render(<TabletopCamera keyboardFocus view={view} spawnKey="church" spawnPose={spawn} onPoseSample={sample}/>);
 const before=mockCamera.position.toArray();
 mockCanvas.dispatchEvent(pointer('pointerdown',button,100,100));
 window.dispatchEvent(pointer('pointermove',button,200,150));
 frame(1/60);
 expect(document.activeElement).toBe(mockCanvas);
 expect(mockCamera.position.toArray()).toEqual(before);
 expect(mockOrbit.target.toArray()).not.toEqual(spawn.target);
 expect(sample).toHaveBeenLastCalledWith(expect.objectContaining({position:before,target:mockOrbit.target.toArray()}));
 window.dispatchEvent(pointer('pointerup',button,200,150));
});
test('0.01x uses tabletop movement speed and only navigates while the studio canvas is focused',()=>{
 render(<TabletopCamera keyboardFocus view="room" cameraSpeed={.01} spawnKey="slow" spawnPose={spawn}/>);
 fireEvent.keyDown(window,{key:'ArrowUp'});frame(.05);
 expect(mockCamera.position.toArray()).toEqual(spawn.position);
 mockCanvas.focus();fireEvent.keyDown(window,{key:'ArrowUp'});
 for(let i=0;i<20;i++)frame(.05);
 expect(mockCamera.position.z).toBeCloseTo(5-.65*.01,8);
 const previous=mockCamera.position.toArray();mockCanvas.blur();frame(.05);
 expect(mockCamera.position.toArray()).toEqual(previous);
 expect(mockOrbit.rotateSpeed).toBeCloseTo(.18*.01);
 expect(mockOrbit.panSpeed).toBeCloseTo(.28*.01);
 expect(mockOrbit.zoomSpeed).toBeCloseTo(1.6*.01);
});
test('recording samples every frame including holds while normal publication remains change based',()=>{
 const sample=jest.fn(),publish=jest.fn();
 render(<TabletopCamera view="room" spawnKey="holds" spawnPose={spawn} onPoseSample={sample} onPoseChange={publish}/>);
 frame(.05);frame(.05);
 expect(sample).toHaveBeenCalledTimes(2);expect(publish).toHaveBeenCalledTimes(1);
});
test('cinematic navigation eases both key presses and releases and stops immediately on focus loss',()=>{
 render(<TabletopCamera keyboardFocus cinematicSmoothing view="room" spawnKey="smooth" spawnPose={spawn}/>);
 mockCanvas.focus();fireEvent.keyDown(window,{key:'w'});frame(.05);
 const first=5-mockCamera.position.z;
 expect(first).toBeGreaterThan(0);expect(first).toBeLessThan(.65*.05);
 for(let i=0;i<20;i++)frame(.05);
 fireEvent.keyUp(window,{key:'w'});const released=mockCamera.position.z;frame(.05);
 expect(mockCamera.position.z).toBeLessThan(released);
 const beforeBlur=mockCamera.position.z;mockCanvas.blur();frame(.05);
 expect(mockCamera.position.z).toBe(beforeBlur);
});
