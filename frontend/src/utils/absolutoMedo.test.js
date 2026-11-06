import {enfrentarMedo} from './absolutoMedo';
import {criarBaseV1,defesaPersonagem} from '../data/absolutoV1';
import {executarTesteDominio,executarTesteAtributo} from './absolutoRolagem';

const ficha=medo=>({...criarBaseV1({forca:3,fonitude:3,inteligencia:3,vontade:3,reflexos:3},{razao:2,mobilidade:5}),medo});
test.each([0,1,2,3,4,5])('Medo %s aplica consequências cumulativas somente contra a fonte',medo=>{
 const p=ficha(medo);
 const op={contraFonte:true,ajudaAliados:2,acaoMedo:'enfrentar'};
 const r=executarTesteDominio(p,'razao',op);
 expect(r.rolagem.dados).toHaveLength(medo>=3?2:medo>=1?3:5);
 expect(r.personagem.esperanca.atual).toBe(p.esperanca.atual-(medo===6?5:0));
 expect(executarTesteDominio(p,'razao',{ajudaAliados:2}).rolagem.dados).toHaveLength(5);
 expect(defesaPersonagem(p,true,true)).toBe(medo>=5?4:5);
 expect(defesaPersonagem(p,true,false)).toBe(5);
 expect(executarTesteAtributo(p,'inteligencia',op).rolagem.dados).toHaveLength(medo>=1?3:5);
});
test('Pavor bloqueia Esforço sem gastar recursos e deixa testes fora da fonte livres',()=>{
 const p=ficha(4);
 expect(()=>executarTesteDominio(p,'razao',{contraFonte:true,esforco:true})).toThrow('A Esperança');
 expect(()=>executarTesteDominio(p,'razao',{esforco:true})).toThrow('A Esperança');
});
test('enfrentar cobra uma vez, reduz para II e impede cobrança duplicada',()=>{
 const p=ficha(6),next=enfrentarMedo(p);
 expect(next.medo).toBe(2);
 expect(next.esperanca.atual).toBe(p.esperanca.atual-5);
 expect(enfrentarMedo(next)).toBe(next);
 const semSaldo={...p,esperanca:{atual:4,max:9}};
 expect(enfrentarMedo(semSaldo)).toBe(semSaldo);
 expect(()=>executarTesteDominio(p,'razao',{contraFonte:true,acaoMedo:'enfrentar'})).toThrow('Medo VI');
 expect(executarTesteDominio(next,'razao').personagem.esperanca.atual).toBe(next.esperanca.atual);
});
