import {arvoresHabilidades} from './Classes/arvoresHabilidades';
import {ABSOLUTAS_BALANCEADAS,balancearAbsoluta} from './absolutasBalanceamento';
import {prepararUso,aplicarUso,renovarUsos} from '../utils/absolutoHabilidadeUso';
import {converterCustoUso,custoUsoRito} from './absolutoCustos';
const absolutas=Object.values(arvoresHabilidades).flatMap(a=>a.absolutas);
test('todas as 25 Absolutas têm regra própria, 10 PE e limite por cena',()=>{
 expect(absolutas).toHaveLength(25);
 for(const h of absolutas){
  expect(ABSOLUTAS_BALANCEADAS[h.id]).toBeDefined();
  expect(h.custo).toBe('10 PE');
  const uso=prepararUso({...h,grupo:'Habilidade Absoluta'});
  expect(uso.custoAtivacao).toBe(10);expect(uso.passiva).toBe(false);expect(uso.limiteUso).toBe('cena');
  expect(h.descricao).not.toMatch(/multiplique|3d20|margem de ameaça/);
  expect(balancearAbsoluta(h)).toEqual(h);
 }
});
test('cópia antiga com custo passivo ou numérico salvo sempre custa dez',()=>{
 for(const custo of ['Passiva','0 PE','1 PE','20 PE']){
  const h={nome:'Absoluta antiga',grupo:'Habilidade Absoluta',custo,custoAtivacao:0};
  expect(converterCustoUso(h).custoAtivacao).toBe(10);
  expect(prepararUso(h).custoAtivacao).toBe(10);
 }
 expect(custoUsoRito({circulo:5})).toBe(6);
});
test('debitada uma vez, não pode usar sem saldo, e respeita renovação e bloqueio de Medo',()=>{
 const h={...absolutas[0],grupo:'Habilidade Absoluta'};
 const p={esperanca:{atual:20,max:20},medo:0};
 const next=aplicarUso(p,h);
 expect(next.esperanca.atual).toBe(10);
 expect(()=>aplicarUso(next,h)).toThrow('Limite');
 expect(aplicarUso(renovarUsos(next,'cena'),h).esperanca.atual).toBe(0);
 expect(()=>aplicarUso({...p,esperanca:{atual:9}},h)).toThrow('insuficientes');
 expect(()=>aplicarUso({...p,medo:4},h)).toThrow('A Esperança');
});
