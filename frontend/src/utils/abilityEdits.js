import {paginasHabilidade,validarPaginas,descricaoDasPaginas} from './abilityPages';
export function solicitarEdicaoHabilidade(personagem,abilityId,draft,requestId){
 const ability=(personagem.habilidadesCriadas||[]).find(a=>a.id===abilityId);
 if(!ability)throw new Error('A habilidade não está mais nesta ficha.');
 if(ability.status!=='aprovada')throw new Error('Aguarde a aprovação inicial antes de editar.');
 if(ability.edicaoPendente)throw new Error('Esta habilidade já possui uma edição aguardando aprovação.');
 const nome=String(draft.nome||'').trim(),paginas=paginasHabilidade(draft),erro=validarPaginas(paginas);
 if(!nome || nome.length>80)throw new Error('Informe um nome com até 80 caracteres.');if(erro)throw new Error(erro);
 const proposal={id:requestId,nome,paginas:structuredClone(paginas),descricao:descricaoDasPaginas(paginas),solicitadaEm:new Date().toISOString()};
 return {...personagem,habilidadesCriadas:personagem.habilidadesCriadas.map(a=>a.id===abilityId?{...a,edicaoPendente:proposal}:a)};
}
export function decidirEdicaoHabilidade(personagem,abilityId,aprovar,requestId){
 const ability=(personagem.habilidadesCriadas||[]).find(a=>a.id===abilityId),proposal=ability?.edicaoPendente;
 if(!proposal || proposal.id!==requestId)throw new Error('Esta solicitação já foi analisada ou mudou. Atualize o painel.');
 const {edicaoPendente,...original}=ability;
 const edited={...original,...(aprovar?{nome:proposal.nome,descricao:proposal.descricao,paginas:proposal.paginas}:{}),ultimaEdicao:{status:aprovar?'aprovada':'recusada',analisadaEm:new Date().toISOString(),solicitacaoId:requestId}};
 const result={...personagem,habilidadesCriadas:personagem.habilidadesCriadas.map(a=>a.id===abilityId?edited:a)};
 if(aprovar)for(const key of ['rituais','poderesAbsolutos'])if(result[key])result[key]=result[key].map(a=>a.id===abilityId && a.criadoPeloJogador?{...a,nome:edited.nome,descricao:edited.descricao,paginas:edited.paginas}:a);
 return result;
}
