import {visibleToPlayer,localCameraMotion,audioZoneGain,nearInteraction} from './tabletopExploration';
test('individual reveal respects player aliases, hidden state and master access',()=>{
 expect(visibleToPlayer({audience:['espiral:123']},'123')).toBe(true);
 expect(visibleToPlayer({audience:['123']},'espiral:123')).toBe(true);
 expect(visibleToPlayer({audience:['123']},'456')).toBe(false);
 expect(visibleToPlayer({audience:[]},'123')).toBe(false);
 expect(visibleToPlayer({hidden:true,audience:['123']},'123')).toBe(false);
 expect(visibleToPlayer({hidden:true,audience:[]},'123',true)).toBe(true);
 expect(visibleToPlayer({},'123')).toBe(true);
});
test('local comfort only reduces motion, preserving master configuration',()=>{
 const master={intensity:3,speed:.75,pitch:0,roll:0};
 expect(localCameraMotion(master,.5)).toEqual({...master,intensity:1.5});
 expect(localCameraMotion(master,0).intensity).toBe(0);
 expect(localCameraMotion(master,100).intensity).toBe(3);
 expect(master.intensity).toBe(3);
});
test('positional audio fades with distance and is muffled by obstacles',()=>{
 const zone={x:0,y:1,z:0,radius:5,volume:.8};
 expect(audioZoneGain(zone,[0,1,0])).toBe(.8);
 expect(audioZoneGain(zone,[0,1,5])).toBe(0);
 expect(audioZoneGain(zone,[0,1,20])).toBe(0);
 expect(audioZoneGain(zone,[0,1,2])).toBeLessThan(.8);
 expect(audioZoneGain(zone,[0,1,2],true)).toBeCloseTo(audioZoneGain(zone,[0,1,2])*.22);
 expect(audioZoneGain({...zone,volume:0},[0,1,0])).toBe(0);
});
test('interactions require proximity in all three dimensions',()=>{
 expect(nearInteraction([0,1,0],[.5,1,.5],.65)).toBe(true);
 expect(nearInteraction([0,1,0],[0,4,0],.65)).toBe(false);
 expect(nearInteraction([0,1,0],[4,1,0],.65)).toBe(false);
});
