import React from 'react';
import {render} from '@testing-library/react';
import {Quaternion} from 'three';
import {useFrame} from '@react-three/fiber';
import HandheldCameraMotion from './HandheldCameraMotion';
jest.mock('three',()=>({
 Euler:class {set(x,y,z){this.values=[x,y,z];return this;}},
 Quaternion:class {
  constructor(){this.values=[0,0,0,1];}
  copy(other){this.values=[...other.values];return this;}
  equals(other){return this.values.every((value,index)=>value===other.values[index]);}
  setFromEuler(euler){this.values=[...euler.values,1];return this;}
  multiply(other){this.values=this.values.map((value,index)=>index<3?value+other.values[index]:1);return this;}
  toArray(){return [...this.values];}
 }
}));
const mockCamera={quaternion:new Quaternion()};
jest.mock('@react-three/fiber',()=>({useThree:()=>({camera:mockCamera}),useFrame:jest.fn()}));

test('cinematic sway follows source time when paused, scrubbed and replayed without accumulating',()=>{
 const {rerender,unmount}=render(<HandheldCameraMotion timelineTime={2} intensity={2} speed={1.5} pitch={5} roll={12}/>);
 const frame=delta=>{const callbacks=useFrame.mock.calls.slice(-2);callbacks[0][0]();callbacks[1][0]({},delta);};
 frame(.016);const atTwo=mockCamera.quaternion.toArray();
 frame(.05);expect(mockCamera.quaternion.toArray()).toEqual(atTwo);
 rerender(<HandheldCameraMotion timelineTime={0} intensity={2} speed={1.5} pitch={5} roll={12}/>);
 frame(.016);expect(mockCamera.quaternion.toArray()).not.toEqual(atTwo);
 rerender(<HandheldCameraMotion timelineTime={2} intensity={2} speed={1.5} pitch={5} roll={12}/>);
 frame(.033);expect(mockCamera.quaternion.toArray()).toEqual(atTwo);
 unmount();expect(mockCamera.quaternion.toArray()).toEqual([0,0,0,1]);
});
