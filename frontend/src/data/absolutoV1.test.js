import { criarBaseV1, resolverTeste, quantidadeDados, custoAtributos, custoDominios, alterarMedo, descansar, recalcularBases, proporMigracaoV1, evoluirV1, rolarDanoV1, defesaPersonagem } from './absolutoV1';

test.each([[0,2],[1,2],[2,2],[3,3],[4,3],[5,4]])('Mobilidade %s define Defesa %s independentemente de Reflexos e proteção', (mobilidade, defesa) => {
  const personagem = {dominios:{mobilidade},atributos:{reflexos:5},defesaGeral:5,bonusDefesa:10};
  expect(defesaPersonagem(personagem)).toBe(defesa);
  expect(defesaPersonagem(personagem,true)).toBe(defesa+1);
});

test.each([
  [0, [1,2,3,4,6], 1], [1, [4,4,5,5,6], 3],
  [2, [4,4,4,5,6], 3], [3, [3,4,4,5,6], 4],
  [4, [3,3,3,4,6], 3], [5, [2,3,3,4,6], 4],
])('Domínio %s conta as faces válidas sem repetir o Êxito adicional', (nivel, dados, esperado) => {
  expect(resolverTeste(dados, 1, nivel).exitos).toBe(esperado);
});

test('Finais só geram Crítico quando a DT é alcançada', () => {
  expect(resolverTeste([6,6,1], 3, 0)).toMatchObject({ exitos:2, finais:2, sucesso:false, critico:false });
  expect(resolverTeste([6,6,1], 2, 0)).toMatchObject({ sucesso:true, critico:true });
  expect(resolverTeste([6,5,5], 2, 1).critico).toBe(false);
});

test('a criação usa 100 EX, custos acumulativos e oito reservas independentes', () => {
  const p = criarBaseV1({forca:3,fonitude:2,inteligencia:2,vontade:1,reflexos:1}, {razao:2,violencia:2,vigor:1});
  expect(p.existencia.pontos).toBe(100);
  expect(custoAtributos(p.atributos)).toBe(45);
  expect(custoDominios(p.dominios)).toBe(50);
  expect(Object.keys(p.membros)).toHaveLength(8);
  expect(p.membros).toMatchObject({cabeca:{max:24},pescoco:{max:20},torso:{max:50},abdomen:{max:40},bracoDireito:{max:28},pernaDireita:{max:32}});
  expect(p.sanidade).toEqual({atual:14,max:14});
  expect(p.esperanca).toEqual({atual:7,max:7});
});

test('reserva respeita incapacidade, limite de oito, vantagem e penalidade de Medo contextual', () => {
  const p = criarBaseV1({inteligencia:3,vontade:1,fonitude:1,forca:0,reflexos:1},{razao:3,violencia:5});
  expect(quantidadeDados(p,'razao')).toBe(3);
  expect(quantidadeDados({...p,dominios:{razao:0}},'razao')).toBe(3);
  expect(quantidadeDados({...p,dominios:{razao:5}},'razao')).toBe(3);
  expect(quantidadeDados(p,'razao',1,1)).toBe(5);
  expect(quantidadeDados(p,'violencia')).toBe(0);
  const medo = {...p,medo:4,dominios:{...p.dominios,razao:0}};
  expect(quantidadeDados(medo,'razao',0,0,true)).toBe(2);
  expect(quantidadeDados(medo,'razao',0,0,false)).toBe(3);
});

test('Medo permanece em VI sem bloqueio por cena e descanso preserva Sanidade', () => {
  const p = {...criarBaseV1(),medo:5};
  const ruptura = alterarMedo(p,1);
  expect(ruptura).toMatchObject({medo:6,rupturaNaCena:true,sanidade:{atual:9}});
  const segunda = alterarMedo(ruptura,3);
  expect(segunda).toMatchObject({medo:6,sanidade:{atual:9}});
  expect(alterarMedo(alterarMedo(segunda,-1),1)).toMatchObject({medo:6,sanidade:{atual:4}});
  const repouso = descansar({...segunda,esperanca:{atual:6,max:7}});
  expect(repouso).toMatchObject({medo:0,sanidade:{atual:9},esperanca:{atual:7,max:7}});
});

test('aumentar atributos preserva o dano já sofrido e os sacrifícios permanentes', () => {
  const p = criarBaseV1();
  p.membros.cabeca.atual = p.membros.cabeca.max - 2;
  p.sanidade = {atual:9,max:11};
  p.ajustesRecursosV1 = {sanidade:-3};
  const next = recalcularBases(p,{...p.atributos,fonitude:2,vontade:2});
  expect(next.membros.cabeca).toMatchObject({atual:22,max:24});
  expect(next.sanidade).toEqual({atual:11,max:13});
});

test('a proposta de migração preserva o original e é idempotente', () => {
  const antigo = {nome:'Lia',atributos:{forca:30,fonitude:20,inteligencia:10,vontade:40,reflexos:50},habilidadesCombate:{firmeza:2,carisma:1},habilidadesPassivas:{investigacao:15},inventario:[{nome:'Lanterna'}]};
  const novo = proporMigracaoV1(antigo);
  expect(novo.legadoAbsoluto).toEqual(antigo);
  expect(novo.dominios).toMatchObject({mobilidade:2,influencia:1,precisao:0});
  expect(novo.habilidadesPassivas).toEqual({});
  expect(novo.inventario).toEqual(antigo.inventario);
  expect(proporMigracaoV1(novo)).toBe(novo);
});

test('evolução de Domínio custa 10 pontos e rejeita saldo insuficiente ou máximo', () => {
  const p = {...criarBaseV1(),pontosEvolucao:{disponiveis:10}};
  expect(evoluirV1(p,'dominios','razao',999)).toMatchObject({dominios:{razao:1},pontosEvolucao:{disponiveis:0}});
  expect(() => evoluirV1({...p,pontosEvolucao:{disponiveis:9}},'dominios','razao',0)).toThrow('insuficientes');
  expect(() => evoluirV1({...p,dominios:{razao:5}},'dominios','razao',10)).toThrow('limite');
});

test('Crítico comum acrescenta um dado ao dano dentro do teto de oito', () => {
  expect(rolarDanoV1('2d6+3',true,()=>0)).toMatchObject({dados:[1,1,1,1],total:4});
  expect(rolarDanoV1('1000000d6').dados).toHaveLength(8);
  expect(() => resolverTeste([6],0,0)).toThrow();
});

test.each([[1,2,10],[2,3,15],[3,4,25],[4,5,30],[1,3,25],[1,5,80]])('Atributo %i para %i custa %i EX acumulados', (atual,destino,custo) => {
  const p={...criarBaseV1(),atributos:{...criarBaseV1().atributos,forca:atual},pontosEvolucao:{disponiveis:100}};
  const novo=evoluirV1(p,'atributos','forca',0,destino);
  expect(novo.atributos.forca).toBe(destino);
  expect(novo.pontosEvolucao.disponiveis).toBe(100-custo);
  expect(()=>evoluirV1({...p,pontosEvolucao:{disponiveis:custo-1}},'atributos','forca',0,destino)).toThrow('insuficientes');
});

test('dois ou mais resultados 1 causam falha crítica; cada 6 conta um Final', () => {
 expect(resolverTeste([1,1],1,1)).toMatchObject({falhaCritica:true,sucesso:false,critico:false,finais:0});
 expect(resolverTeste([1,1,6,6],1,5)).toMatchObject({falhaCritica:true,sucesso:false,critico:false,finais:2});
 expect(resolverTeste([1,6],1,0)).toMatchObject({falhaCritica:false,sucesso:true,finais:1});
 expect(resolverTeste([2,3],1,0)).toMatchObject({falhaCritica:false,sucesso:false,finais:0});
});
