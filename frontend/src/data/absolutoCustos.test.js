import { converterCustoUso, custoUsoRito } from './absolutoCustos';
test.each([['Passiva',0],['1 PE',1],['3 PE',1],['4 PE',2],['6 PE',2],['10 PE',3]])('converte Aptidão %s em %s PE', (custo,esperado)=>{
 const original={grupo:'Aptidão',custo};
 const converted=converterCustoUso(original);
 expect(converted.custoAtivacao).toBe(esperado);
 expect(converted.custoLegado).toBe(custo);
 expect(converterCustoUso(converted)).toEqual(converted);
 expect(original.custo).toBe(custo);
});
test('converte todas as Absolutas para 10 PE sem alterar outras categorias',()=>{
 expect(converterCustoUso({grupo:'Habilidade Absoluta',custo:'10 PE'}).custoAtivacao).toBe(10);
 expect(converterCustoUso({grupo:'Habilidade Absoluta',custo:'20 PE'}).custoAtivacao).toBe(10);
 const item={grupo:'Item',custo:20}; expect(converterCustoUso(item)).toBe(item);
});
test('Ritos usam 2–6 PE por círculo ou nível',()=>{
 ['iniciante','intermediario','avançado','experiente','absoluto'].forEach((nivelRito,i)=>expect(custoUsoRito({nivelRito})).toBe(i+2));
 [1,2,3,4,5].forEach(circulo=>expect(custoUsoRito({circulo})).toBe(circulo+1));
});
