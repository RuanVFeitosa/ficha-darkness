export const ABILITY_PAGE_LIMIT=12000;
export const ABILITY_TOTAL_LIMIT=100000;
export const ABILITY_MAX_PAGES=20;
export const PAGE_BREAK='\n\n<!-- pagina -->\n\n';
export function paginasHabilidade(habilidade={}) {
 if(Array.isArray(habilidade.paginas) && habilidade.paginas.length) return habilidade.paginas;
 return String(habilidade.descricao || '').split(PAGE_BREAK).map((conteudo,i)=>({titulo:`Página ${i+1}`,conteudo}));
}
export function descricaoDasPaginas(paginas) {
 return paginas.map(p=>`${p.titulo ? `## ${p.titulo}\n\n` : ''}${p.conteudo}`).join(PAGE_BREAK);
}
export function validarPaginas(paginas) {
 if(!paginas.length || paginas.length>ABILITY_MAX_PAGES)return 'Use entre 1 e 20 páginas.';
 if(paginas.some(p=>p.conteudo.length>ABILITY_PAGE_LIMIT))return 'Cada página pode ter até 12.000 caracteres.';
 if(paginas.reduce((n,p)=>n+p.conteudo.length,0)>ABILITY_TOTAL_LIMIT)return 'A habilidade pode ter até 100.000 caracteres no total.';
 if(!paginas.some(p=>p.conteudo.trim()))return 'Escreva o conteúdo da habilidade.';
 return '';
}