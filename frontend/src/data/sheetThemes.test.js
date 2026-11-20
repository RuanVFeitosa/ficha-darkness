import {PRIDE_FLAGS,UNIVERSE_THEMES,sheetTheme,applySheetTheme,prideThemeStyle} from './sheetThemes';
import {freshProtocolSheet} from './protocoloDarkness';

test.each(UNIVERSE_THEMES.map(theme=>[theme.id]))('tema %s troca apenas a aparência e preserva o personagem',id=>{
 const sheet={...freshProtocolSheet(),integrity:21,hope:4,relationships:[{id:'ana',grade:2}]};
 const next=applySheetTheme(sheet,id);
 expect(next.themePreset).toBe(id);
 expect(next.temaFicha).toEqual(sheetTheme(id).palette);
 expect(next.integrity).toBe(21);
 expect(next.hope).toBe(4);
 expect(next.relationships).toEqual(sheet.relationships);
 expect(next.pavor).toEqual(sheet.pavor);
});
test('todas as bandeiras têm cores válidas e temas próprios',()=>{
 for(const flag of PRIDE_FLAGS){expect(flag.colors.every(color=>/^#[\da-f]{6}$/i.test(color))).toBe(true);expect(sheetTheme(`pride-${flag.id}`).flag.id).toBe(flag.id);}
 expect(sheetTheme('tema-inexistente').id).toBe('darkness');
});

test('bandeiras diferentes geram fundos, painéis e destaques distintos',()=>{
 const ids=['pride-trans','pride-bisexual','pride-aromantic','pride-intersex'];
 const themes=ids.map(id=>sheetTheme(id));
 for(const key of ['primaria','secundaria','fundo','borda'])expect(new Set(themes.map(theme=>theme.palette[key])).size).toBe(ids.length);
 expect(prideThemeStyle(themes[0])['--pd-pride-stripes']).toContain('#5bcefa');
 const custom=applySheetTheme({customPrideFlag:['#ff0000','#ffff00','#000000']},'pride-custom');
 expect(custom.temaFicha.primaria).toBe(sheetTheme('pride-custom',custom.customPrideFlag).palette.primaria);
 expect(prideThemeStyle(sheetTheme('espiral'))).toEqual({});
});
