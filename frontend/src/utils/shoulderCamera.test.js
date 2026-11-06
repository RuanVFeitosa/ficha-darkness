import {shoulderCameraTarget} from './shoulderCamera';
test.each([0,45,90,135,180,225,270,315])('shoulder composition rotates with yaw %s',degrees=>{
 const yaw=degrees*Math.PI/180,fx=Math.sin(yaw),fz=-Math.cos(yaw);
 const target=shoulderCameraTarget([4,7],2,3,[fx,fz]);
 const dx=target[0]-4,dz=target[2]-7;
 expect(dx*(-fz)+dz*fx).toBeCloseTo(.64,10);
 expect(dx*fx+dz*fz).toBeCloseTo(.9,10);
 expect(target[1]).toBeCloseTo(4.56,10);
});
test('zero direction retains a finite forward shoulder view',()=>{
 expect(shoulderCameraTarget([0,0],1,0,[0,0])).toEqual([.32,.78,-.45]);
});

test('switching shoulders mirrors lateral placement without changing height or forward focus',()=>{
 const right=shoulderCameraTarget([0,0],1,0,[0,-1],1);
 const left=shoulderCameraTarget([0,0],1,0,[0,-1],-1);
 expect(left).toEqual([-right[0],right[1],right[2]]);
});
