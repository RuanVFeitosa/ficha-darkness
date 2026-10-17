import { hasEspiralToken, readEspiralTabletopSheet, espiralTabletopUrl } from './espiralTabletop';
beforeEach(() => localStorage.clear());
test('foto de perfil e avatar 3D não substituem a imagem de corpo inteiro', () => {
 expect(hasEspiralToken({profileImage:'photo',avatar3D:{modelUrl:'model'}})).toBe(false);
 expect(hasEspiralToken({tabletopTokenImage:'   '})).toBe(false);
 expect(hasEspiralToken({tabletopTokenImage:'body'})).toBe(true);
});
test('link mantém a ficha ESPIRAL exata e o papel de jogador', () => {
 const params=new URL(espiralTabletopUrl('minha ficha',{codigo:'ABCD'}),'http://localhost').searchParams;
 expect(params.get('ficha')).toBe('minha ficha');
 expect(params.get('sistema')).toBe('espiral');
 expect(params.get('papel')).toBe('jogador');
 expect(params.get('tabletop3d')).toBe('1');
 expect(params.get('campanha')).toBe('ABCD');
});
test('acesso direto encontra a imagem e bloqueia dados corrompidos', () => {
 localStorage.setItem('espiral:sheet:v1:ana',JSON.stringify({version:1,tabletopTokenImage:'body'}));
 expect(hasEspiralToken(readEspiralTabletopSheet('ana'))).toBe(true);
 localStorage.setItem('espiral:sheet:v1:ana','invalid');
 expect(hasEspiralToken(readEspiralTabletopSheet('ana'))).toBe(false);
});