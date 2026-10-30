import { criarBaseV1 } from '../data/absolutoV1';
import { executarTesteDominio } from './absolutoRolagem';

const ficha = () => criarBaseV1({forca:1,fonitude:1,inteligencia:3,vontade:1,reflexos:1},{razao:2});
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
