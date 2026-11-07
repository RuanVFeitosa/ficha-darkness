import {cameraRecordingPose,validCameraRecording,cameraClipTime,splitCameraClip,snapshotCutsceneMap} from './cameraCutscene';
const a={time:0,position:[0,2,4],target:[0,1,0],fov:40};
const b={time:2,position:[4,4,8],target:[2,1,2],fov:60};
const clip={frames:[a,b,{...b,time:4}]};
test('replays position, focus, zoom and recorded pauses with clamped endpoints',()=>{
  expect(cameraRecordingPose(clip,-1)).toEqual(a);
  expect(cameraRecordingPose(clip,1)).toEqual({position:[2,3,6],target:[1,1,1],fov:50});
  expect(cameraRecordingPose(clip,3)).toEqual({position:b.position,target:b.target,fov:b.fov});
  expect(cameraRecordingPose(clip,99)).toEqual(clip.frames[2]);
});
test('rejects malformed recordings while accepting long camera takes',()=>{
  expect(validCameraRecording(clip)).toBe(true);
  for(const frames of [[a],[a,{...b,time:0}],[a,{...b,time:Infinity}],[a,{...b,position:[NaN,0,0]}],[{...a,time:1},b]])expect(validCameraRecording({frames})).toBe(false);
  expect(validCameraRecording({frames:Array.from({length:3001},(_,time)=>({...a,time}))})).toBe(true);
});
test('splitting a trimmed, slowed camera clip preserves source continuity',()=>{
  const layer={id:'one',type:'map3d',name:'Igreja',start:5,end:11,sourceIn:1,playbackRate:.5,recording3D:clip,fadeIn:1,fadeOut:1};
  const [left,right]=splitCameraClip(layer,8,'two');
  expect(left.end).toBe(8);expect(left.fadeOut).toBe(0);
  expect(right).toMatchObject({id:'two',start:8,end:11,sourceIn:2.5,fadeIn:0});
  expect(cameraClipTime(left,8)).toBe(cameraClipTime(right,8));
  expect(cameraClipTime(right,10)).toBe(3.5);
  expect(splitCameraClip(layer,5,'bad')).toBeNull();
});
test('snapshot keeps map token height, orientation and art independently of later positions',()=>{
 const state={x:2,z:3,elevation:1,scale:.5,rotacao:90,image:'/threat.png',olharCamera:false};
 const scene=snapshotCutsceneMap({id:'church',assets:[],spawnPoints:{tokens:{y:4}}},{tokens:[{id:'threat',posicoes:{'__estado:tabletop3d:church':state}},{id:'unplaced'}]});
 state.x=99;
 expect(scene.tokens).toHaveLength(1);
 expect(scene.tokens[0]).toMatchObject({position:[2,5,3],image:'/threat.png',billboard:false,rotation:Math.PI/2,height:.93});
});
