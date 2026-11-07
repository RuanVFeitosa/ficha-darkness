import {act,renderHook} from '@testing-library/react';
import {RemoteAsset} from './MapEditor3D';
const mockLoad=jest.fn();
const mockPrepareMaterials=jest.fn();
jest.mock('three/examples/jsm/loaders/GLTFLoader.js',()=>({GLTFLoader:class {load(...args){mockLoad(...args);}}}));
jest.mock('three',()=>({
 LoadingManager:class {setURLModifier(){}},
 Group:class {userData={};add(){}traverse(){}},
 Vector3:class {},
 Box3:class {min={y:0};setFromObject(){return this;}getSize(v){Object.assign(v,{x:1,y:1,z:1});return v;}getCenter(v){Object.assign(v,{x:0,y:0,z:0});return v;}}
}));
jest.mock('../../utils/tabletopMaterials',()=>({prepareTabletopMaterials:(...args)=>{mockPrepareMaterials(...args);return ()=>{};}}));
jest.mock('../../utils/tabletopDoors',()=>({prepareSceneDoors:()=>[],applyDoorStates:()=>false}));

test('switching saved clips with equivalent model dependencies does not restart model loading',()=>{
 const initial={file:'/church.glb',dependencies:{'ground.png':'/ground.png','leaves.png':'/leaves.png'},instanceId:'church'};
 const {rerender}=renderHook(props=>RemoteAsset(props),{initialProps:initial});
 expect(mockLoad).toHaveBeenCalledTimes(1);
 act(()=>mockLoad.mock.calls[0][1]({scene:{userData:{},clone:()=>({})},asset:{}}));
 expect(mockPrepareMaterials).toHaveBeenCalledTimes(1);
 // A reopened project has different object identities, and may reorder keys.
 rerender({...initial,dependencies:{'leaves.png':'/leaves.png','ground.png':'/ground.png'}});
 expect(mockLoad).toHaveBeenCalledTimes(1);
 expect(mockPrepareMaterials).toHaveBeenCalledTimes(1);
 rerender({...initial,dependencies:{'ground.png':'/updated-ground.png','leaves.png':'/leaves.png'}});
 expect(mockLoad).toHaveBeenCalledTimes(2);
 rerender({...initial,file:'/other-map.glb'});
 expect(mockLoad).toHaveBeenCalledTimes(3);
});
