import {insideUVBeam} from './uvLight';
test('revela apenas dentro do alcance e cone UV, incluindo direção vertical',()=>{
 const beam=point=>insideUVBeam(point,[0,1,0],[0,0,-1],10,Math.PI/8);
 expect(beam([0,1,-5])).toBe(true);
 expect(beam([0,1,5])).toBe(false);
 expect(beam([0,1,-11])).toBe(false);
 expect(beam([5,1,-5])).toBe(false);
 expect(insideUVBeam([0,5,0],[0,0,0],[0,1,0],10,Math.PI/8)).toBe(true);
 expect(insideUVBeam([0,5,0],[0,0,0],[0,0,0],10,Math.PI/8)).toBe(false);
});
