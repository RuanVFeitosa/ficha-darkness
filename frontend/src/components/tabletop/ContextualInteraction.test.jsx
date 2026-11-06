import React from 'react';
import {render,fireEvent} from '@testing-library/react';
import {useFrame} from '@react-three/fiber';
import ContextualInteraction from './ContextualInteraction';
let mockHits=[];
const mockScene={updateMatrixWorld:jest.fn(),traverse:jest.fn(),add:jest.fn(),remove:jest.fn()};
jest.mock('@react-three/fiber',()=>({useFrame:jest.fn(),useThree:()=>({camera:{},scene:mockScene})}));
jest.mock('../../utils/tabletopCollision',()=>({mapCollisionMeshes:()=>[]}));
jest.mock('../../utils/tabletopDoors',()=>({closedDoorBounds:()=>({bounds:true}),doorStateKey:(id,leaf)=>id+':'+leaf}));
jest.mock('three',()=>({
 Vector2:class{},Vector3:class{toArray(){return [this.x,this.y,this.z];}},
 Box3:class{setFromObject(object){this.object=object;return this;}getCenter(out){[out.x,out.y,out.z]=this.object.center;return out;}},
 Raycaster:class{setFromCamera(){}intersectObjects(){return mockHits;}},
 BoxHelper:class{userData={};dispose(){}update(){}},
}));
beforeEach(()=>{useFrame.mockClear();mockHits=[];});
test('E interacts only with a nearby visible door under the aim point',()=>{
 const root={userData:{tabletopInstanceId:'house'}},door={userData:{tabletopDoorId:'front'},parent:root,center:[0,.5,.5]};
 mockHits=[{object:door}];
 const hint=jest.fn(),toggle=jest.fn();
 const {unmount}=render(<ContextualInteraction enabled position={[0,0]} onHint={hint} onDoor={toggle}/>);
 const frame=useFrame.mock.calls[0][0];frame({},.11);
 expect(hint).toHaveBeenLastCalledWith(expect.objectContaining({label:'Abrir / fechar porta'}));
 fireEvent.keyDown(window,{code:'KeyE'});expect(toggle).toHaveBeenCalledWith('house:front',{bounds:true});
 door.center=[0,.5,10];frame({},.11);
 toggle.mockClear();fireEvent.keyDown(window,{code:'KeyE'});expect(toggle).not.toHaveBeenCalled();
 unmount();
});
test('a wall in front of the door blocks contextual interaction',()=>{
 const door={userData:{tabletopDoorId:'front'},center:[0,.5,.5]},wall={userData:{}};
 mockHits=[{object:wall},{object:door}];
 const hint=jest.fn(),toggle=jest.fn();
 const {unmount}=render(<ContextualInteraction enabled position={[0,0]} onHint={hint} onDoor={toggle}/>);
 useFrame.mock.calls[0][0]({},.11);
 fireEvent.keyDown(window,{code:'KeyE'});
 expect(toggle).not.toHaveBeenCalled();expect(hint).not.toHaveBeenCalledWith(expect.objectContaining({label:'Abrir / fechar porta'}));
 unmount();
});
