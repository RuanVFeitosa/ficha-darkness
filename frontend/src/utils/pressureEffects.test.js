import {pressureEffects,pressureModifier,settlePressure,applyPressureReaction,endPressureEffects} from './pressureEffects';
const sheet=()=>({sanity:10,hope:10,pressure:3});
test('Abalo automático vale exatamente para o próximo teste',()=>{
 let next=settlePressure(sheet(),{pressure:[1,4,5]}).sheet;
 expect(pressureModifier(next,'Investigação')).toBe(-1);expect(next.pressure).toBe(0);expect(pressureEffects(next).pending).toHaveLength(0);
 next=settlePressure(next,{pressure:[]}).sheet;expect(pressureModifier(next,'Investigação')).toBe(0);
});
test.each([[[], 'Controle'],[[1],'Abalo'],[[1,1],'Crise'],[[1,1,1],'Ruptura']])('conta somente resultados 1 de Pressão e preserva as reservas', (pressure,stress)=>{
 const result=settlePressure(sheet(),{dice:[1,1],pressure,successes:3});expect(result.report.stress).toBe(stress);expect(result.sheet.sanity).toBe(10);expect(result.sheet.hope).toBe(10);
});
test('Sobrecarga mantém 2 dados para a próxima rolagem',()=>{
 let next=settlePressure({...sheet(),pressure:2},{pressure:[1,1]}).sheet;
 next=applyPressureReaction(next,1,'overload');expect(next.pressure).toBe(2);expect(pressureEffects(next).pending).toHaveLength(0);
});
test('Ruptura perde dois da reserva escolhida uma vez e mantém a reação',()=>{
 let next=settlePressure(sheet(),{pressure:[1,1,1]}).sheet;
 next=applyPressureReaction(next,1,'paralysis','hope');expect(next.hope).toBe(8);expect(next.sanity).toBe(10);expect(pressureEffects(next).conditions[0].id).toBe('paralysis');
 expect(applyPressureReaction(next,1,'paralysis','hope')).toBe(next);
 next=endPressureEffects(next,'turn');expect(pressureEffects(next).conditions).toHaveLength(0);
});
test('Desligamento penaliza os recursos definidos e ignora só o primeiro Abalo',()=>{
 let next=settlePressure(sheet(),{pressure:[1,1,1]}).sheet;next=applyPressureReaction(next,1,'disconnect');
 expect(pressureModifier(next,'Controle Mental')).toBe(-1);expect(pressureModifier(next,'Propósito')).toBe(-1);expect(pressureModifier(next,'Influência')).toBe(-1);expect(pressureModifier(next,'Pontaria')).toBe(0);
 next=settlePressure(next,{pressure:[1]}).sheet;expect(pressureEffects(next).nextPenalty).toBe(0);
 next=settlePressure(next,{pressure:[1]}).sheet;expect(pressureEffects(next).nextPenalty).toBe(1);
});
test('dados fora do limite da reserva não são consumidos e modificadores condicionais duram um teste',()=>{
 let next=settlePressure({...sheet(),pressure:5},{pressure:[1,1]}).sheet;expect(next.pressure).toBe(3);
 next=applyPressureReaction(next,1,'focus');next.pressureEffects.conditions[0].modifier=-1;
 expect(pressureModifier(next,'Pontaria')).toBe(-1);
 next=settlePressure(next,{pressure:[]}).sheet;expect(pressureModifier(next,'Pontaria')).toBe(0);
});
