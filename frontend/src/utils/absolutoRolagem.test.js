import { criarBaseV1 } from '../data/absolutoV1';
import { executarTesteAtributo, executarTesteDominio } from './absolutoRolagem';

const ficha = () => criarBaseV1({forca:1,fonitude:1,inteligencia:3,vontade:1,reflexos:1},{razao:2});

test('Atributo usa sua reserva e apenas 6 como êxito, independentemente dos Domínios', () => {
  const p = {...ficha(), dominios:{razao:5}};
  expect(executarTesteAtributo(p,'inteligencia',{},()=>.7).rolagem).toMatchObject({chaveAtributo:'inteligencia',modo:'Teste de Atributo',dados:[5,5,5],exitos:0,sucesso:false});
  expect(executarTesteAtributo({...p,dominios:{}},'inteligencia',{dt:2},()=>.99).rolagem).toMatchObject({dados:[6,6,6],exitos:3,sucesso:true,critico:true});
});

test('Atributo respeita vantagem, Medo, Esforço, saldo e bloqueio em zero', () => {
  const p = {...ficha(),medo:3};
  const resultado = executarTesteAtributo(p,'inteligencia',{vantagem:2,contraFonte:true,esforco:true},()=>.99);
  expect(resultado.rolagem.dados).toHaveLength(5);
  expect(resultado.personagem.esperanca.atual).toBe(p.esperanca.atual-1);
  expect(() => executarTesteAtributo({...p,atributos:{forca:0}},'forca',{vantagem:2})).toThrow('Atributo 0');
  expect(() => executarTesteAtributo(p,'invalido')).toThrow('válido');
  expect(() => executarTesteAtributo({...p,esperanca:{atual:0}},'forca',{esforco:true})).toThrow('insuficiente');
});

test('Última Tentativa de Atributo conserva reserva e DT e gasta Esperança uma única vez', () => {
  const p = ficha();
  const primeiro = executarTesteAtributo(p,'inteligencia',{dt:2,vantagem:1},()=>.99);
  const repetido = executarTesteAtributo(p,'inteligencia',{dt:5,vantagem:-2,repetir:primeiro.rolagem},()=>0);
  expect(repetido.rolagem).toMatchObject({dados:[1,1,1,1],dt:2,repetida:true,falhaCritica:true});
  expect(repetido.personagem.esperanca.atual).toBe(p.esperanca.atual-2);
  expect(() => executarTesteAtributo(p,'inteligencia',{repetir:repetido.rolagem})).toThrow('repetido');
  expect(() => executarTesteAtributo(p,'forca',{repetir:primeiro.rolagem})).toThrow('mesmo teste');
});
test('o rolador da ficha original conserva três dados ao mudar o Domínio e aplica o Êxito adicional uma vez', () => {
  const p=ficha();
  expect(executarTesteDominio(p,'razao',{dt:2},()=>.5).rolagem).toMatchObject({dados:[4,4,4],exitos:1,sucesso:false});
  expect(executarTesteDominio({...p,dominios:{razao:5}},'razao',{dt:2},()=>.5).rolagem).toMatchObject({dados:[4,4,4],exitos:3,sucesso:true});
});
test('Última Tentativa conserva os parâmetros da rolagem, desconta dois pontos e não pode ser repetida', () => {
  const p=ficha(), primeiro=executarTesteDominio(p,'razao',{dt:3},()=>.9);
  const repetido=executarTesteDominio(p,'razao',{repetir:primeiro.rolagem},()=>0);
  expect(repetido.rolagem).toMatchObject({dados:[1,1,1],dt:3,repetida:true,sucesso:false});
  expect(repetido.personagem.esperanca.atual).toBe(5);
  expect(() => executarTesteDominio(repetido.personagem,'razao',{repetir:repetido.rolagem})).toThrow('repetido');
});
test('Esperança respeita saldo, exclusão de gastos no mesmo teste e dano já resolvido', () => {
  const p=ficha(), esforco=executarTesteDominio(p,'razao',{esforco:true});
  expect(esforco.rolagem.dados).toHaveLength(4);
  expect(esforco.personagem.esperanca.atual).toBe(6);
  expect(() => executarTesteDominio(p,'razao',{repetir:esforco.rolagem})).toThrow();
  expect(() => executarTesteDominio({...p,esperanca:{atual:0,max:7}},'razao',{esforco:true})).toThrow('insuficiente');
  expect(() => executarTesteDominio(p,'razao',{repetir:{...esforco.rolagem,esforco:false,danoResolvido:true}})).toThrow();
});
