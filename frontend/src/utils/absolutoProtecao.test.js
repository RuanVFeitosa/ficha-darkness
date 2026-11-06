import {protecaoRegional} from './absolutoProtecao';

test('preserva adicionais de fichas antigas sem contar equipamento duas vezes',()=>{
 expect(protecaoRegional({defesa:5},[{defesaBonus:3}])).toEqual({equipamento:3,adicionais:2,total:5});
 expect(protecaoRegional({defesa:3},[{defesaBonus:3}])).toEqual({equipamento:3,adicionais:0,total:3});
});
test('novos adicionais permanecem independentes das alterações no equipamento',()=>{
 expect(protecaoRegional({defesa:99,defesaAdicional:2},[{defesaBonus:3},{defesaBonus:4}]).total).toBe(9);
 expect(protecaoRegional({defesa:99,defesaAdicional:2},[]).total).toBe(2);
});
