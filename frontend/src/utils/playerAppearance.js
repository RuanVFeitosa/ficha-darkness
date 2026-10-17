import { buscarPersonagem, salvarPersonagem } from '../services/personagemApi';
export const PALETA_MONO = {primaria:'#ffffff',secundaria:'#111111',texto:'#eeeeee',fundo:'#000000',borda:'#3a3a3a'};
export const PALETA_CLARA = {primaria:'#111111',secundaria:'#f0f0f0',texto:'#151515',fundo:'#ffffff',borda:'#b8b8b8'};
export const CAMPOS_PALETA = [['primaria','Destaques'],['secundaria','Painéis'],['texto','Texto'],['fundo','Fundo'],['borda','Bordas']];
export const paletaValida = p => p && CAMPOS_PALETA.every(([k])=>/^#[0-9a-f]{6}$/i.test(p[k] || ''));
export function variaveisPaleta(p) {
  if (!paletaValida(p)) return {};
  return {'--pj-accent':p.primaria,'--pj-panel':p.secundaria,'--pj-ink':p.texto,'--pj-bg':p.fundo,'--pj-line':p.borda,'--pj-muted':`color-mix(in srgb, ${p.texto} 70%, ${p.fundo})`,'--pj-cyan':p.primaria,'--pj-symbol-filter':(parseInt(p.fundo.slice(1,3),16)*.299+parseInt(p.fundo.slice(3,5),16)*.587+parseInt(p.fundo.slice(5,7),16)*.114)>140 ? 'none' : 'invert(1)'};
}
export async function salvarPaletaFicha(ref, paleta) {
  if (!paletaValida(paleta)) throw new Error('Escolha uma cor válida para cada campo.');
  if (ref.sistema === 'espiral') {
    const key=`espiral:sheet:v1:${ref.id}`;
    const atual=JSON.parse(localStorage.getItem(key) || 'null');
    if (!atual?.attributes) throw new Error('Ficha ESPIRAL não encontrada neste dispositivo.');
    const proxima={...atual,temaFicha:{...paleta}};
    localStorage.setItem(key,JSON.stringify(proxima));
    return proxima;
  }
  const atual=await buscarPersonagem(ref.id);
  if (!atual || atual.tipo==='perfil-jogador') throw new Error('Ficha do Sistema Absoluto não encontrada.');
  return salvarPersonagem(ref.id,{...atual,temaFicha:{...paleta}});
}
