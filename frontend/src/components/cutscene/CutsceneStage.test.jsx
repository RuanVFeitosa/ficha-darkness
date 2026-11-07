import React from 'react';
import {render,screen} from '@testing-library/react';
import CutsceneStage from './CutsceneStage';
const mockMount=jest.fn();
jest.mock('./CutsceneMap3D',()=>{
 const React=require('react');
 return function MockMap({time,cameraMotion}){
  React.useEffect(()=>{mockMount();},[]);
  return <output data-testid="map-time">{time}:{cameraMotion.intensity}</output>;
 };
});
test('cuts switch source time and sway without remounting the 3D preview',async()=>{
 const recording3D={frames:[{time:0,position:[0,1,3],target:[0,1,0],fov:42},{time:4,position:[2,1,3],target:[0,1,0],fov:42}]};
 const common={type:'map3d',map3D:{id:'church',assets:[]},recording3D,fadeIn:0,fadeOut:0};
 const project={duration:5,layers:[{...common,id:'first',start:0,end:1,sourceIn:0,cameraMotion3D:{intensity:1.5}},{...JSON.parse(JSON.stringify(common)),id:'second',start:1,end:3,sourceIn:2,cameraMotion3D:{intensity:.5}}]};
 const {rerender}=render(<CutsceneStage project={project} time={.5}/>);
 expect(await screen.findByTestId('map-time')).toHaveTextContent('0.5:1.5');
 rerender(<CutsceneStage project={project} time={1.5}/>);
 expect(screen.getByTestId('map-time')).toHaveTextContent('2.5:0.5');
 expect(mockMount).toHaveBeenCalledTimes(1);
});
