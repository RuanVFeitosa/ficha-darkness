import { mesclarPassivosPorRevisao, normalizarPassivosParaNovaEscala } from './personagemMerge';

test('primeira abertura de ficha sem cache mantém os dados do servidor', () => {
 const ficha = {nome:'Caio Moura',classe:'O Renegado',atributos:{forca:47,fonitude:23},habilidadesPassivas:{atletismo:0}};
 expect(mesclarPassivosPorRevisao(ficha,null)).toEqual(ficha);
 expect(normalizarPassivosParaNovaEscala(null)).toBeNull();
});
test('cache com revisão de passivos mais recente não substitui identidade e atributos', () => {
 const servidor = {nome:'Caio',atributos:{forca:47},habilidadesPassivas:{atletismo:5},sincronizacaoCampos:{habilidadesPassivas:1}};
 const local = {nome:'Antigo',atributos:{forca:0},habilidadesPassivas:{atletismo:2},sincronizacaoCampos:{habilidadesPassivas:2}};
 expect(mesclarPassivosPorRevisao(servidor,local)).toEqual({...servidor,habilidadesPassivas:{atletismo:5},sincronizacaoCampos:{habilidadesPassivas:2}});
});
test('ausência de ficha principal permite recuperar a cópia local', () => {
 const local = {nome:'Lia',habilidadesPassivas:{atletismo:1}};
 expect(mesclarPassivosPorRevisao(null,local)).toEqual({...local,habilidadesPassivas:{atletismo:5}});
});
