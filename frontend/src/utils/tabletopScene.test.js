import { activeTabletopScene } from './tabletopScene';
const scene={id:'a',imagensCena:[{id:'photo',url:'image.png'}],mapasBatalha:[{id:'map',mapa3dId:'3d'}]};
test('cena especial prevalece sobre imagem ou mapa selecionados no 3D',()=>{
 const special={ativo:true,midiaUrl:'/opening.gif',tipoMidia:'imagem'};
 expect(activeTabletopScene({cenaAtiva:{...scene,cenaEspecial:special},modo:'especial',midiaAtivaId:'map'})).toEqual({type:'special',media:special});
 expect(activeTabletopScene({cenaAtiva:{...scene,cenaEspecial:special},modo:'mapa',midiaAtivaId:'map'}).type).toBe('map');
});
test('seleciona imagem ativa mesmo quando a mesma cena possui mapa 3D', () => {
 expect(activeTabletopScene({cenaAtiva:scene,midiaAtivaId:'photo'})).toEqual({type:'static',media:scene.imagensCena[0]});
});
test('seleciona mapa explícito e mantém suporte a imagens antigas', () => {
 expect(activeTabletopScene({cenaAtiva:scene,midiaAtivaId:'map'}).type).toBe('map');
 expect(activeTabletopScene({cenaAtiva:{id:'old',imagem_url:'old.png'}}).media.url).toBe('old.png');
});
test('cena sem mídia ativa prioriza imagem e modo mapa prioriza o 3D', () => {
 expect(activeTabletopScene({cenaAtiva:scene,modo:'cena'}).type).toBe('static');
 expect(activeTabletopScene({cenaAtiva:scene,modo:'mapa'}).type).toBe('map');
});
