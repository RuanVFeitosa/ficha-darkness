import {healInjuries} from './espiralInjuries';
const injury=(id,region,impact)=>({id,region,impact,severity:'Grave',criticalRegion:false});

test('cura parcial reduz gravidade e a cura seguinte remove a lesão sem aplicar a mesma cura duas vezes',()=>{
 const sheet={integrity:20,injuries:[injury('a','Braço esquerdo',8)]};
 const first=healInjuries(sheet,3,'Braço esquerdo',35);
 expect(first.sheet.integrity).toBe(23);
 expect(first.sheet.injuries[0]).toMatchObject({remainingImpact:5,severity:'Moderada',impact:8});
 const next=healInjuries(first.sheet,5,'Braço esquerdo',35);
 expect(next.sheet.integrity).toBe(28);
 expect(next.sheet.injuries).toHaveLength(0);
 expect(sheet.injuries[0].severity).toBe('Grave');
});
test('uma reserva de cura é distribuída entre lesões da região sem afetar outras regiões',()=>{
 const result=healInjuries({integrity:10,injuries:[injury('a','Torso',3),injury('b','Braço esquerdo',4),injury('c','Torso',6)]},5,'Torso',35);
 expect(result.removed).toBe(1);
 expect(result.sheet.injuries[0]).toMatchObject({id:'b',impact:4});
 expect(result.sheet.injuries[1]).toMatchObject({id:'c',remainingImpact:4,severity:'Moderada'});
});
test('cura respeita o máximo da Integridade e trata lesões mesmo com Integridade cheia',()=>{
 const result=healInjuries({integrity:35,injuries:[injury('a','Torso',3)]},10,null,35);
 expect(result.recovered).toBe(0);
 expect(result.sheet.integrity).toBe(35);
 expect(result.sheet.injuries).toHaveLength(0);
});
test('lesão manual exige impacto informado e valores inválidos não curam',()=>{
 const sheet={integrity:20,injuries:[{id:'manual',region:'Torso',severity:'Moderada'}]};
 expect(healInjuries(sheet,3,null,35).unquantified).toBe(1);
 expect(healInjuries(sheet,3,null,35,{manual:6}).sheet.injuries[0]).toMatchObject({remainingImpact:3,severity:'Superficial'});
 expect(()=>healInjuries(sheet,-1,null,35)).toThrow();
});
