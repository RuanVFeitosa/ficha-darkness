import {TEMA_PADRAO_ESPIRAL} from './espiral';

export const PRIDE_FLAGS=[
  {id:'rainbow',name:'Orgulho LGBTQI+',colors:['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'],accent:'#c49ae8'},
  {id:'progress',name:'Orgulho Progressivo',colors:['#e40303','#ff8c00','#ffed00','#008026','#004dff','#750787'],chevron:true,accent:'#d69ac9'},
  {id:'lesbian',name:'Lésbica',colors:['#d52d00','#ef7627','#ff9a56','#ffffff','#d162a4','#b55690','#a30262'],accent:'#ec92b5'},
  {id:'gay',name:'Gay',colors:['#078d70','#26ceaa','#98e8c1','#ffffff','#7bade2','#5049cc','#3d1a78'],accent:'#82c8ce'},
  {id:'bisexual',name:'Bissexual',colors:['#d60270','#9b4f96','#0038a8'],weights:[2,1,2],accent:'#d486c3'},
  {id:'pansexual',name:'Pansexual',colors:['#ff218c','#ffd800','#21b1ff'],accent:'#f49bd0'},
  {id:'omnisexual',name:'Omnissexual',colors:['#ff9ace','#ff53bf','#200044','#6760fe','#8ca6ff'],accent:'#bd9ee8'},
  {id:'polysexual',name:'Polissexual',colors:['#f61cb9','#07d569','#1c92f6'],accent:'#7bbddd'},
  {id:'asexual',name:'Assexual',colors:['#000000','#a3a3a3','#ffffff','#800080'],accent:'#cda0d9'},
  {id:'demisexual',name:'Demissexual',colors:['#ffffff','#6e0071','#d2d2d2'],weights:[2,1,2],triangle:'#000000',accent:'#c4a1d1'},
  {id:'graysexual',name:'Grayssexual',colors:['#800080','#a3a3a3','#ffffff','#a3a3a3','#800080'],accent:'#c2a2d0'},
  {id:'aromantic',name:'Arromântico',colors:['#3da542','#a7d379','#ffffff','#a9a9a9','#000000'],accent:'#a5ce8f'},
  {id:'aroace',name:'Arromântico e assexual',colors:['#e28c00','#eccd00','#ffffff','#62aedc','#203856'],accent:'#a6c6d9'},
  {id:'trans',name:'Transgênero',colors:['#5bcefa','#f5a9b8','#ffffff','#f5a9b8','#5bcefa'],accent:'#b3ddeb'},
  {id:'nonbinary',name:'Não binário',colors:['#fff430','#ffffff','#9c59d1','#000000'],accent:'#cdb5e7'},
  {id:'agender',name:'Agênero',colors:['#000000','#b9b9b9','#ffffff','#b8f483','#ffffff','#b9b9b9','#000000'],accent:'#b9d9a0'},
  {id:'genderfluid',name:'Gênero-fluido',colors:['#ff75a2','#ffffff','#be18d6','#000000','#333ebd'],accent:'#d5a2d9'},
  {id:'genderqueer',name:'Genderqueer',colors:['#b57edc','#ffffff','#4a8123'],accent:'#c6afd9'},
{
  id: 'bigender', name: 'Bigênero', colors: ['#ED79AA', '#FCF34C', '#FFFFFF', '#AD6CBE', '#719EE2'], accent: '#AD6CBE'
},  {id:'pangender',name:'Pangênero',colors:['#fff798','#ffddcd','#ffebfb','#ffffff','#ffebfb','#ffddcd','#fff798'],accent:'#e6c9cf'},
  {id:'demigirl',name:'Demigênero feminino',colors:['#7f7f7f','#c3c3c3','#ffffff','#ffafca','#ffffff','#c3c3c3','#7f7f7f'],accent:'#e3b5cc'},
  {id:'demiboy',name:'Demigênero masculino',colors:['#7f7f7f','#c3c3c3','#ffffff','#9ad9eb','#ffffff','#c3c3c3','#7f7f7f'],accent:'#b3d4df'},
  {id:'neutrois',name:'Neutrois',colors:['#ffffff','#21a600','#000000'],accent:'#a6cd91'},
  {id:'intersex',name:'Intersexo',colors:['#ffd800'],ring:'#7902aa',accent:'#dcc783'},
  {id:'custom',name:'Minha bandeira',colors:['#5bcefa','#f5a9b8','#ffffff','#f5a9b8','#5bcefa'],accent:'#b3ddeb'},
];

export const UNIVERSE_THEMES=[
  {id:'darkness',name:'Darkness',description:'O dossiê original.',symbol:'darkness',symbolSrc:'/simbolo-darkness.png',palette:{...TEMA_PADRAO_ESPIRAL,secundaria:'#000000',fundo:'#000000'}},
  {id:'ato-iii',name:'ATO III · Julgamento',description:'O Inicio do Fim.',symbol:'judgment',symbolSrc:'/simbolo-darkness.png',image:'/tema-ato-iii-julgamento.png',palette:{primaria:'#c9a35e',secundaria:'#000000',texto:'#f2e7d4',fundo:'#000000',borda:'#612a2c'}},
  {id:'espiral',name:'Espiral',description:'Os Monstros dessa Historia.',symbol:'espiral',symbolSrc:'/simbolo-espiral.svg',palette:{primaria:'#dedede',secundaria:'#000000',texto:'#f0f0f0',fundo:'#000000',borda:'#4c4c4c'}},
  {id:'absoluto',name:'Absoluto',description:'O Começo de Tudo.',symbol:'absoluto',symbolSrc:'/simbolo-absoluto.png',palette:{primaria:'#c6af73',secundaria:'#000000',texto:'#ece8dd',fundo:'#000000',borda:'#49432f'}},
];

function blend(hex,other,weight) {
  return '#'+[1,3,5].map(index=>Math.round(parseInt(hex.slice(index,index+2),16)*weight+parseInt(other.slice(index,index+2),16)*(1-weight)).toString(16).padStart(2,'0')).join('');
}
function brightAccent(hex) {
  let color=hex;
  for(let i=0;i<6;i++){
    const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
    if(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>=.2)break;
    color=blend(color,'#ffffff',.84);
  }
  return color;
}
export function prideThemeColors(flag,customColors) {
  const colors=flag.id==='custom'&&customColors?.length?customColors:flag.colors;
  const colorful=[...new Set([...colors,...(flag.ring?[flag.ring]:[])])].filter(color=>{
    const rgb=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
    return Math.max(...rgb)-Math.min(...rgb)>35;
  });
  const first=colorful[0] || '#dddddd';
  const distance=color=>[1,3,5].reduce((sum,index)=>sum+(parseInt(color.slice(index,index+2),16)-parseInt(first.slice(index,index+2),16))**2,0);
  const second=[...colorful].sort((a,b)=>distance(b)-distance(a))[0] || '#999999';
  const primary=brightAccent(first),secondary=brightAccent(second);
  return {primary,secondary,stripes:`linear-gradient(90deg,${colors.map((color,index)=>`${color} ${index/colors.length*100}% ${(index+1)/colors.length*100}%`).join(',')})`,palette:{primaria:primary,secundaria:blend(first,'#09090d',.2),texto:'#fff6fc',fundo:blend(second,'#060609',.08),borda:blend(first,'#141019',.55)}};
}

export function prideThemeStyle(theme,customColors) {
  if(!theme.flag)return {};
  const colors=prideThemeColors(theme.flag,customColors);
  return {'--pd-pride-primary':colors.primary,'--pd-pride-secondary':colors.secondary,'--pd-pride-stripes':colors.stripes};
}

export function sheetTheme(id,customColors) {
  const base=UNIVERSE_THEMES.find(item=>item.id===id);
  if(base)return base;
  const flag=PRIDE_FLAGS.find(item=>`pride-${item.id}`===id);
  return flag?{id,name:flag.name,symbol:'darkness',symbolSrc:'/simbolo-darkness.png',flag,palette:prideThemeColors(flag,customColors).palette}:UNIVERSE_THEMES[0];
}

export function applySheetTheme(sheet,id) {
  const theme=sheetTheme(id,sheet.customPrideFlag);
  return {...sheet,themePreset:theme.id,temaFicha:{...theme.palette}};
}

// Normalize former preset backgrounds while preserving custom colors.
export function sheetThemeSurface(value, theme, field) {
  if (theme.flag) return value;
  const legacy = field === 'fundo'
    ? ['#050505', '#080506', '#050605']
    : ['#101010', '#170b0d', '#151515', '#10110f'];
  return !value || legacy.includes(value.toLowerCase()) ? '#000000' : value;
}
