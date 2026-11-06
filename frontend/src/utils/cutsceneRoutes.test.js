import {cutsceneEditorUrl,cutsceneReturnUrl} from './cutsceneRoutes';
test('o projeto tem URL própria e preserva campanha, cena e origem',()=>{
 const url=new URL(cutsceneEditorUrl({codigo:'ABC12'},'scene-1','3d'),'https://example.com');
 expect(Object.fromEntries(url.searchParams)).toEqual({cutscene:'1',campanha:'ABC12',cena:'scene-1',retorno:'3d'});
 expect(cutsceneReturnUrl('ABC12','3d')).toBe('/?campanha=ABC12&papel=mestre&tabletop3d=1');
 expect(cutsceneReturnUrl('ABC12','2d')).toBe('/?campanha=ABC12&papel=mestre');
 expect(cutsceneReturnUrl('ABC12','untrusted')).toContain('mestre=1&aba=campanha&campanhaPainel=ABC12&area=cutscenes');
});
