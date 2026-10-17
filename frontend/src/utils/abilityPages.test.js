import {paginasHabilidade,descricaoDasPaginas,validarPaginas,ABILITY_PAGE_LIMIT} from './abilityPages';
test('preserva habilidades antigas e mantém páginas no texto compatível com aprovações',()=>{
 expect(paginasHabilidade({descricao:'Texto antigo'})).toEqual([{titulo:'Página 1',conteudo:'Texto antigo'}]);
 const paginas=[{titulo:'Efeito',conteudo:'**Dano**\n\n| Dado | Efeito |\n| --- | --- |\n| 1 | 2d6 |'},{titulo:'Limites',conteudo:'Uma vez por cena.'}];
 const texto=descricaoDasPaginas(paginas);
 expect(paginasHabilidade({descricao:texto})).toHaveLength(2);
 expect(paginasHabilidade({paginas,descricao:texto})).toEqual(paginas);
 expect(validarPaginas(paginas)).toBe('');
});
test('valida conteúdo, limites de páginas e textos longos',()=>{
 expect(validarPaginas([{titulo:'',conteudo:' '}])).not.toBe('');
 expect(validarPaginas([{titulo:'',conteudo:'a'.repeat(2000)}])).toBe('');
 expect(validarPaginas([{titulo:'',conteudo:'a'.repeat(ABILITY_PAGE_LIMIT+1)}])).not.toBe('');
 expect(validarPaginas(Array.from({length:21},()=>({titulo:'',conteudo:'a'})))).not.toBe('');
 expect(validarPaginas(Array.from({length:10},()=>({titulo:'',conteudo:'a'.repeat(12000)})))).not.toBe('');
});