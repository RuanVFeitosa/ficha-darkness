import React from 'react';
import {render} from '@testing-library/react';
import {useFrame} from '@react-three/fiber';
import CharacterCameraObstruction from './CharacterCameraObstruction';
import {resolveCameraObstruction} from '../../utils/tabletopCollision';
const mockCamera={position:{x:0,y:1,z:3,toArray(){return [this.x,this.y,this.z];},set(x,y,z){Object.assign(this,{x,y,z});}}};
jest.mock('@react-three/fiber',()=>({useThree:()=>({camera:mockCamera,scene:{updateMatrixWorld:jest.fn()}}),useFrame:jest.fn()}));
jest.mock('../../utils/tabletopCollision',()=>({
 mapCollisionMeshes:()=>[],collisionSignature:()=>'',createTokenCollisionWorld:()=>({}),
 resolveCameraObstruction:jest.fn(),
}));
test('restores desired zoom before controls and eases out when the wall clears',()=>{
 mockCamera.position.set(0,1,3);
 resolveCameraObstruction.mockReturnValue({fraction:.25});
 const {unmount}=render(<CharacterCameraObstruction enabled position={[0,0]} elevation={0} height={1}/>);
 const restore=useFrame.mock.calls.find(([,priority])=>priority===-3)[0];
 const collide=useFrame.mock.calls.find(([,priority])=>priority===-.5)[0];
 collide({},1/60);
 expect(mockCamera.position.z).toBe(.75);
 restore();
 expect(mockCamera.position.toArray()).toEqual([0,1,3]);
 resolveCameraObstruction.mockReturnValue({fraction:1});
 collide({},1/60);
 expect(mockCamera.position.z).toBeGreaterThan(.75);
 expect(mockCamera.position.z).toBeLessThan(3);
 restore();
 expect(mockCamera.position.toArray()).toEqual([0,1,3]);
 unmount();
});
