import {easeCameraAngle,cameraDamping} from './cameraMotion';
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
