import {invokeRelationship,relationshipBenefits,startRelationshipMission} from './relationships';

const sheet=(grade=1)=>({hope:5,relationships:[{id:'ana',name:'Ana',grade,used:false}]});
test.each([[1,6],[2,8],[3,12]])('grau %s concede um dado d%s e só pode ser invocado uma vez', (grade,sides)=>{
  const next=invokeRelationship(sheet(grade),'ana','focus','A lembrança dela me dá coragem.');
  expect(next.relationshipBonus.sides).toBe(sides);
  expect(()=>invokeRelationship(next,'ana','help','Vou ajudá-la.')).toThrow(/já foi invocada/);
  const reset=startRelationshipMission(next);
  expect(reset.relationships[0].used).toBe(false);
  expect(reset.relationshipBonus).toBeNull();
});
test('exige sentimento e impede benefícios de grau maior',()=>{
  expect(()=>invokeRelationship(sheet(),'ana','focus',' ')).toThrow(/Descreva/);
  expect(()=>invokeRelationship(sheet(),'ana','motivate','Ela é importante.')).toThrow(/indisponível/);
  expect(relationshipBenefits(2).map(item=>item.id)).not.toContain('action');
});
test.each([[2,[4,3],7],[3,[6,5],11]])('motivação de grau %s registra a recuperação da outra pessoa sem curar quem invoca',(grade,dice,total)=>{
  const next=invokeRelationship(sheet(grade),'ana','motivate','Ela precisa continuar.',dice);
  expect(next.hope).toBe(5);
  expect(next.relationships[0].lastInvocation.message).toContain(`recupera ${total} PE`);
});
test('ação extra exige perigo e um bônus pendente não pode ser sobrescrito',()=>{
  expect(()=>invokeRelationship(sheet(3),'ana','action','Vou protegê-la.')).toThrow(/perigo/);
  expect(invokeRelationship(sheet(3),'ana','action','Vou protegê-la.',[],true).relationships[0].used).toBe(true);
  expect(()=>invokeRelationship({...sheet(),relationshipBonus:{name:'Outra pessoa'}},'ana','focus','Preciso dela.')).toThrow(/pendente/);
});
