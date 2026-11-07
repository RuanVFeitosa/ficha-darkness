import {easeCameraAngle,cameraDamping,walkingCameraMotion,cameraMotionForViewer,smoothCameraTranslation} from './cameraMotion';

test('cinematic translation accelerates and settles consistently across refresh rates',()=>{
 const run=fps=>{
  let velocity=[0,0,0],position=0;
  for(let i=0;i<fps;i++){const next=smoothCameraTranslation(velocity,[1,0,0],1/fps);velocity=next.velocity;position+=next.offset[0];}
  expect(velocity[0]).toBeGreaterThan(.99);
  for(let i=0;i<fps;i++){const next=smoothCameraTranslation(velocity,[0,0,0],1/fps);velocity=next.velocity;position+=next.offset[0];}
  expect(velocity[0]).toBeLessThan(.004);
  return position;
 };
 expect(run(30)).toBeCloseTo(run(60),8);
 expect(run(60)).toBeCloseTo(run(144),8);
 const first=smoothCameraTranslation([0,0,0],[1,0,0],1/60);
 expect(first.offset[0]).toBeGreaterThan(0);expect(first.offset[0]).toBeLessThan(1/60);
});

test('walking camera follows actual travel and settles when the token stops',()=>{
 let state=walkingCameraMotion(null,[0,0],1/60);
 for(let i=1;i<=30;i++) state=walkingCameraMotion(state,[i*.65/60,0],1/60);
 expect(state.strength).toBeGreaterThan(.9);
 expect(Math.abs(state.roll)).toBeGreaterThan(.0001);
 for(let i=0;i<120;i++) state=walkingCameraMotion(state,state.position,1/60);
 expect(Math.abs(state.roll)).toBeLessThan(.000001);
 expect(Math.abs(state.pitch)).toBeLessThan(.000001);
});

test('walking camera ignores teleports and disables motion immediately',()=>{
 let state=walkingCameraMotion(null,[0,0],1/60);
 state=walkingCameraMotion(state,[.01,0],1/60);
 const disabled=walkingCameraMotion(state,[.02,0],1/60,false);
 expect(disabled.strength).toBe(0);
 expect(disabled.pitch).toBe(0);
 expect(disabled.roll).toBe(0);
 const teleport=walkingCameraMotion(state,[30,0],1/60);
 expect(teleport.strength).toBe(0);
});

test('walking camera has consistent rhythm at different frame rates',()=>{
 const run=fps=>{
  let state=walkingCameraMotion(null,[0,0],1/fps);
  for(let i=1;i<=fps;i++) state=walkingCameraMotion(state,[i*.65/fps,0],1/fps);
  return state;
 };
 const slow=run(30),fast=run(120);
 expect(slow.roll).toBeCloseTo(fast.roll,9);
 expect(slow.pitch).toBeCloseTo(fast.pitch,9);
});
test('inclinação converge suavemente sem ultrapassar e nivela até zero',()=>{
 let angle=0;
 angle=easeCameraAngle(angle,10,1/60);
 expect(angle).toBeGreaterThan(0);expect(angle).toBeLessThan(10);
 for(let i=0;i<120;i++)angle=easeCameraAngle(angle,10,1/60);
 expect(angle).toBe(10);
 for(let i=0;i<120;i++)angle=easeCameraAngle(angle,0,1/60);
 expect(angle).toBe(0);
 expect(easeCameraAngle(0,10,1/60,true)).toBe(10);
});
test('resposta e inércia mantêm duração em 30 e 120 FPS',()=>{
 const simulate=fps=>{let angle=0,remaining=1;for(let i=0;i<fps/2;i++){angle=easeCameraAngle(angle,30,1/fps);remaining*=1-cameraDamping(1/fps);}return {angle,remaining};};
 const slow=simulate(30),fast=simulate(120);
 expect(slow.angle).toBeCloseTo(fast.angle,8);
 expect(slow.remaining).toBeCloseTo(fast.remaining,8);
});

test('walking stays subtle even at 300% and high movement speed',()=>{
 let state=walkingCameraMotion(null,[0,0],1/60,true,3);
 for(let i=1;i<=600;i++){
  const next=walkingCameraMotion(state,[i*3.25/60,0],1/60,true,3);
  expect(Math.abs(next.pitch)).toBeLessThanOrEqual(.0015);
  expect(Math.abs(next.yaw)).toBeLessThanOrEqual(.0005);
  expect(Math.abs(next.roll)).toBeLessThanOrEqual(.001);
  expect(next.phase-state.phase).toBeLessThanOrEqual(.85/60/.6*Math.PI*2+1e-12);
  state=next;
 }
 const off=walkingCameraMotion(state,[33,0],1/60,true,0);
 expect(off.pitch).toBe(0);expect(off.yaw).toBe(0);expect(off.roll).toBe(0);
});

test('players share sway without inheriting the master horizon tilt',()=>{
 const settings={intensity:3,speed:.75,pitch:8,roll:-7};
 expect(cameraMotionForViewer(settings)).toEqual({intensity:3,speed:.75,pitch:0,roll:0});
 expect(cameraMotionForViewer(settings,true)).toEqual(settings);
 expect(settings.roll).toBe(-7);
 expect(cameraMotionForViewer({...settings,intensity:0})).toEqual({intensity:0,speed:.75,pitch:0,roll:0});
});
