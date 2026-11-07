import { converterTextoAbsoluto, normalizarConteudoAbsoluto, normalizarFichaAbsoluto, prepararDadosAbsoluto, rolarDadosAbsoluto } from './absolutoModificadores';
import { quantidadeDados, criarBaseV1, resolverTeste, rolarDanoV1 } from '../data/absolutoV1';
import { CATALOGO_RITOS_ABSOLUTOS } from '../data/Catalogo/ritosAbsolutos';
import { CATALOGO_COMBATE } from '../data/Catalogo/combate';
import { salvarArvoresCustom, obterArvoreClasse } from '../data/Classes/arvoresHabilidades';

test('fichas antigas são migradas automaticamente uma única vez, preservando o original', () => {
  const antiga = {nome:'Lia', atributos:{forca:30,fonitude:20,inteligencia:40,vontade:20,reflexos:10}, habilidadesCombate:{firmeza:3,carisma:2}, inventario:[{dano:'2d6+15'}]};
  const atual = normalizarFichaAbsoluto(antiga);
  expect(atual).toMatchObject({versaoRegras:'1.0', atributos:{forca:3,inteligencia:4}, dominios:{mobilidade:3,influencia:2}, configuracaoAbsoluto:{limiteDados:8}});
  expect(atual.legadoAbsoluto).toEqual(antiga);
  expect(atual.inventario[0].dano).toBe('3d6');
  expect(normalizarFichaAbsoluto(atual)).toEqual(atual);
  expect(antiga.versaoRegras).toBeUndefined();
});

test('não converte fichas de outro sistema ou rebaixa uma versão futura', () => {
  const espiral={sistema:'espiral',atributos:{forca:30}};
  expect(normalizarFichaAbsoluto(espiral)).toBe(espiral);
  const futura={versaoRegras:'2.0',atributos:{forca:3}};
  expect(normalizarFichaAbsoluto(futura)).toEqual(futura);
});

test.each([
  ['Recebe +15 em ataques e −10 em esquivas.', 'Recebe +1 dado em ataques e −1 dado em esquivas.'],
  ['Causa +2d de dano adicional.', 'Causa +1 dado de dano adicional.'],
  ['Concede +3 em testes de Percepção.', 'Concede +1 dado em testes de Percepção.'],
  ['Causa 3d6+15 de dano.', 'Causa 4d6 de dano.'],
  ['Causa 3d6-15 de dano.', 'Causa 2d6 de dano.'],
])('converte %s sem conservar pontos fixos', (entrada, saida) => {
  expect(converterTextoAbsoluto(entrada)).toBe(saida);
  expect(converterTextoAbsoluto(saida)).toBe(saida);
});

test('custos, recursos, medidas, intervalos e progressão não viram modificadores', () => {
  const texto='Gaste 10 PE, perde −5 Sanidade, recebe +2 Esperança e +3 Medo. Recupera +2 de Sanidade. Alcance +3m. Níveis 1-10.';
  expect(converterTextoAbsoluto(texto)).toBe(texto);
  const original={id:'arma-15',nome:'Arma +15',preco:150,custo:'5 PE',nivel:4,efeito:'+15 em ataques',armaStatus:{dmg:'3d6+10'},modificacao:{efeitos:{bonusTesteAtaque:15,penalidadeCurto:-10}}};
  const novo=normalizarConteudoAbsoluto(original);
  expect(novo).toMatchObject({id:'arma-15',nome:'Arma +15',preco:150,custo:'5 PE',nivel:4,efeito:'+1 dado em ataques',armaStatus:{dmg:'3d6+10'},modificacao:{efeitos:{bonusTesteAtaque:1,penalidadeCurto:-1}}});
  expect(original.armaStatus.dmg).toBe('3d6+10');
  expect(normalizarConteudoAbsoluto({bonusMunicao:15})).toEqual({bonusMunicao:15});
});

test('o limite de oito é aplicado após todos os ajustes e antes de gerar qualquer dado', () => {
  const random=jest.fn(() => .9);
  expect(rolarDadosAbsoluto('1000000d6-15', [15,15,-15],random).dados).toHaveLength(8);
  expect(random).toHaveBeenCalledTimes(8);
  expect(prepararDadosAbsoluto('8d6', [15,10,-5])).toMatchObject({quantidade:8});
  expect(prepararDadosAbsoluto('2d6', [-10,-5])).toMatchObject({quantidade:0});
  expect(prepararDadosAbsoluto('3d6+2d6-15')).toMatchObject({quantidade:3});
});

test('bônus e Crítico adicionam dados de dano, sem somar pontos e sem ultrapassar oito', () => {
  expect(rolarDanoV1('2d6+15', true, () => 0)).toMatchObject({dados:[1,1,1,1],total:4,formula:'4d6'});
  expect(rolarDanoV1('8d6+15', true, () => 0).dados).toHaveLength(8);
  const p=criarBaseV1({forca:5,inteligencia:5,vontade:1,fonitude:1,reflexos:1},{razao:5});
  expect(quantidadeDados(p,'razao',7,1)).toBe(8);
  expect(resolverTeste([6,6,6,6,6,6,6,6],5,0)).toMatchObject({exitos:8,critico:true});
  expect(() => resolverTeste(Array(9).fill(6),5,0)).toThrow('oito');
});

test('catálogos e árvores personalizadas usam a mesma conversão das fichas salvas', () => {
  expect(CATALOGO_COMBATE.find(i => i.id==='fuzil-assalto-helena').armaStatus.dmg).toBe('3d10+3');
  expect(CATALOGO_RITOS_ABSOLUTOS.find(i => i.id==='rito-olhos-orvalho').detalhe).toContain('+1 dado');
  salvarArvoresCustom({teste:{classe:'Teste',absolutas:[{id:'h',nome:'H',descricao:'+15 no ataque e -10 no dano'}]}});
  expect(obterArvoreClasse('teste').absolutas[0].descricao).toBe('+1 dado no ataque e −1 dado no dano');
  salvarArvoresCustom({});
  const p={...criarBaseV1(),inventario:[{nome:'Arma',armaStatus:{dmg:'3d6+15'}}],legadoAbsoluto:{bonusTeste:'+15'}};
  const atualizado=normalizarFichaAbsoluto(p);
  expect(atualizado.configuracaoAbsoluto.limiteDados).toBe(8);
  expect(atualizado.inventario[0].armaStatus.dmg).toBe('3d6+15');
  expect(atualizado.legadoAbsoluto.bonusTeste).toBe('+15');
  expect(normalizarFichaAbsoluto(atualizado)).toEqual(atualizado);
  const espiral={sistema:'espiral',attributes:{pulso:3},abilities:'+15 em testes'};
  expect(normalizarFichaAbsoluto(espiral)).toBe(espiral);
});
