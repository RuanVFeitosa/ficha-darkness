import { mesclarPassivosPorRevisao, normalizarPassivosParaNovaEscala } from './personagemMerge';
import { normalizarFichaAbsoluto } from './absolutoModificadores';

test('primeira abertura de ficha sem cache mantém os dados do servidor', () => {
 const ficha = {nome:'Caio Moura',classe:'O Renegado',atributos:{forca:47,fonitude:23},habilidadesPassivas:{atletismo:0}};
 expect(mesclarPassivosPorRevisao(ficha,null)).toEqual(normalizarFichaAbsoluto(ficha));
 expect(normalizarPassivosParaNovaEscala(null)).toBeNull();
});
test('cache com revisão de passivos mais recente não substitui identidade e atributos', () => {
 const servidor = {nome:'Caio',atributos:{forca:47},habilidadesPassivas:{atletismo:5},sincronizacaoCampos:{habilidadesPassivas:1}};
 const local = {nome:'Antigo',atributos:{forca:0},habilidadesPassivas:{atletismo:2},sincronizacaoCampos:{habilidadesPassivas:2}};
 const atualizada = mesclarPassivosPorRevisao(servidor,local);
 expect(atualizada).toEqual(normalizarFichaAbsoluto(servidor));
 expect(atualizada.legadoAbsoluto).toEqual(servidor);
});
test('ausência de ficha principal permite recuperar a cópia local', () => {
 const local = {nome:'Lia',habilidadesPassivas:{atletismo:1}};
 expect(mesclarPassivosPorRevisao(null,local)).toEqual({...local,habilidadesPassivas:{atletismo:5}});
});
