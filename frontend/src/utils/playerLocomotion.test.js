import {playerLocomotion,walkingPose} from './playerLocomotion';

test('starts smoothly, caps diagonal speed and stops without drifting',()=>{
  const first=playerLocomotion([0,0],[1,1],1/60);
  expect(Math.hypot(...first.velocity)).toBeGreaterThan(0);
  expect(Math.hypot(...first.velocity)).toBeLessThan(.65);
  let velocity=first.velocity;
  for(let i=0;i<120;i++) velocity=playerLocomotion(velocity,[1,1],1/60).velocity;
  expect(Math.hypot(...velocity)).toBeCloseTo(.65,8);
  expect(playerLocomotion(velocity,[0,0],1/60)).toEqual({velocity:[0,0],offset:[0,0]});
});

test('covers the same distance at 30, 60 and 144 frames per second',()=>{
  const run=fps=>{
    let velocity=[0,0],distance=0;
    for(let i=0;i<fps;i++) {
      const next=playerLocomotion(velocity,[0,-1],1/fps);
      velocity=next.velocity;distance+=next.offset[1];
    }
    return distance;
  };
  expect(run(30)).toBeCloseTo(run(60),9);
  expect(run(144)).toBeCloseTo(run(60),9);
});

test('reversing direction decelerates before moving backwards',()=>{
  const next=playerLocomotion([.65,0],[-1,0],1/60);
  expect(next.velocity[0]).toBeGreaterThan(0);
  expect(next.velocity[0]).toBeLessThan(.65);
});

test('walking stays subtle and settles at rest or when motion is disabled',()=>{
  for(let distance=0;distance<1;distance+=.01) {
    const pose=walkingPose(distance,.65);
    expect(pose.lift).toBeGreaterThanOrEqual(0);
    expect(pose.lift).toBeLessThanOrEqual(.018);
    expect(Math.abs(pose.roll)).toBeLessThanOrEqual(.012);
  }
  expect(walkingPose(.1,0)).toEqual({lift:0,roll:0});
  expect(walkingPose(.1,.65,0)).toEqual({lift:0,roll:0});
});

test('player speed scales movement and remains bounded for invalid settings',()=>{
 const normal=playerLocomotion([0,0],[1,1],1/60,1);
 const fast=playerLocomotion([0,0],[1,1],1/60,2);
 expect(fast.offset[0]).toBeCloseTo(normal.offset[0]*2,10);
 expect(fast.offset[1]).toBeCloseTo(normal.offset[1]*2,10);
 expect(playerLocomotion([0,0],[1,0],1/60,Infinity)).toEqual(playerLocomotion([0,0],[1,0],1/60,1));
 expect(playerLocomotion([0,0],[1,0],1/60,100)).toEqual(playerLocomotion([0,0],[1,0],1/60,5));
 expect(playerLocomotion(fast.velocity,[0,0],1/60,2)).toEqual({velocity:[0,0],offset:[0,0]});
});
