import {integridadeInicial} from './absolutoV1';
import {normalizarFichaAbsoluto} from '../utils/absolutoModificadores';
test.each([0,1,2,3,4,5])('aplica as oito fórmulas para Fortitude %s',fort=>{
 const members=integridadeInicial(fort);
 const expected={cabeca:18+fort*3,pescoco:14+fort*3,torso:40+fort*5,abdomen:32+fort*4,bracoDireito:20+fort*4,bracoEsquerdo:20+fort*4,pernaDireita:24+fort*4,pernaEsquerda:24+fort*4};
 for(const [key,max] of Object.entries(expected))expect(members[key]).toMatchObject({max,atual:max});
});
test('fichas existentes migram uma vez, preservando dano, incapacidade, proteção e condições',()=>{
 const old={versaoRegras:'1.0',atributos:{fonitude:2},membros:{cabeca:{max:5,atual:3,ferido:true,defesa:2},torso:{max:12,atual:0,grave:true},bracoDireito:{max:6,atual:6}},inventario:[{nome:'Faca'}]};
 const next=normalizarFichaAbsoluto(old);
 expect(next.membros.cabeca).toMatchObject({max:24,atual:22,ferido:true,defesa:2});
 expect(next.membros.torso).toMatchObject({max:50,atual:0,grave:true});
 expect(next.membros.bracoDireito).toMatchObject({max:28,atual:28});
 expect(next.inventario).toEqual(old.inventario);
 expect(normalizarFichaAbsoluto(next)).toEqual(next);
 expect(old.membros.cabeca.max).toBe(5);
});
