import {tokenAppearance,missingTokenAppearance,olderTokenState,mergeTokenUpdate,tokenTransformCache,mergeDoorStates} from './tabletopTokenState';

test('mestre e jogador usam a mesma aparência compartilhada acima de preferências locais',()=>{
  const shared={image:'body.png',avatar3D:{modelUrl:'hero.glb'},animation:{enabled:true}};
  const master=tokenAppearance({tabletopTokenImage:'old.png'},shared);
  const player=tokenAppearance({avatar3D:{modelUrl:'other.glb'}},shared);
  expect(master).toEqual(player);
  expect(master.avatar3D.modelUrl).toBe('hero.glb');
});

test('publica apenas aparência ausente, sem substituir os ajustes do mestre',()=>{
  expect(missingTokenAppearance({image:'body.png',avatar3D:{modelUrl:'hero.glb'}},{scale:0.8,image:'shared.png'})).toEqual({avatar3D:{modelUrl:'hero.glb'}});
  expect(missingTokenAppearance({image:'',avatar3D:null},{scale:0.8})).toEqual({});
});

test('uma consulta atrasada não substitui uma posição mais recente',()=>{
  expect(olderTokenState({revision:10},{revision:20})).toBe(true);
  expect(olderTokenState({revision:21},{revision:20})).toBe(false);
  expect(olderTokenState({},{})).toBe(false);
});

test('mensagem compacta de movimento preserva aparência, escala e outros mapas',()=>{
  const token={id:'t1',nome:'Victoria',posicoes:{map:{image:'hero.png',scale:0.8,x:1},other:{x:50}}};
  expect(mergeTokenUpdate(token,{id:'t1',posicoes:{map:{x:2,z:3}}})).toEqual({id:'t1',nome:'Victoria',posicoes:{map:{image:'hero.png',scale:0.8,x:2,z:3},other:{x:50}}});
});

test('cache de ajustes não duplica imagens grandes nem o modelo no localStorage',()=>{
 expect(tokenTransformCache({hero:{image:'data:image/png;base64,large',avatar3D:{modelUrl:'hero.glb'},x:2,z:3,elevation:1,scale:0.8,revision:4}})).toEqual({hero:{x:2,z:3,elevation:1,scale:0.8,revision:4}});
});

test('estado antigo de uma porta não desfaz uma abertura recente nem altera outra porta',()=>{
 expect(mergeDoorStates({a:{open:true,revision:2},b:{open:false,revision:3}},{a:{open:false,revision:1}})).toEqual({a:{open:true,revision:2},b:{open:false,revision:3}});
});
