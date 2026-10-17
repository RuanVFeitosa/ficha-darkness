import { obterTodasArvores } from '../data/Classes/arvoresHabilidades';
import { HABILIDADES_ESPIRAL } from '../data/habilidadesEspiral';
import { VERTENTE_HABILIDADES } from '../data/espiral';
import { DEFAULT_CATALOGO_LOJA } from '../data/catalogoLoja';
import { CATALOGO_ESPIRAL } from '../data/catalogoEspiral';

export function catalogoBuilds() {
  const darkness = [];
  function percorrer(valor, caminho, classe, classeId) {
    if (!valor || typeof valor !== 'object') return;
    if (valor.nome && valor.descricao && !Array.isArray(valor.habilidades)) darkness.push({ ...valor, id: `darkness:${caminho}`, sistema: 'darkness', tipo: 'habilidade', grupo: classe, classeId, categoria: caminho.split(':')[1] });
    Object.entries(valor).forEach(([chave, filho]) => { if (filho && typeof filho === 'object') percorrer(filho, `${caminho}:${filho.id || chave}`, classe, classeId); });
  }
  Object.entries(obterTodasArvores()).forEach(([classeId, arvore]) => percorrer(arvore, classeId, arvore.classe || classeId, classeId));
  const espiral = Object.entries(HABILIDADES_ESPIRAL).flatMap(([grupo, itens]) => itens.map(([nome, acao, descricao]) => ({ id: `espiral:${grupo}:${nome}`, nome, descricao, acao, grupo, categoria: grupo, sistema: 'espiral', tipo: 'habilidade' })));
  const vertentes = Object.entries(VERTENTE_HABILIDADES).map(([grupo, h]) => ({id:`espiral:vertente:${grupo}`,nome:h.nome,descricao:h.niveis[0],niveis:h.niveis,grupo,categoria:'vertentes',sistema:'espiral',tipo:'habilidade'}));
  const absolutoItens = DEFAULT_CATALOGO_LOJA.map(i=>({...i,id:`darkness:item:${i.id}`,sistema:'darkness',tipo:'item',descricao:i.detalhe || i.descricao || '',grupo:i.categoria}));
  const espiralItens = CATALOGO_ESPIRAL.map(i=>({...i,id:`espiral:item:${i.id}`,nome:i.name,descricao:i.detail,grupo:i.category,categoria:i.category,sistema:'espiral',tipo:'item'}));
  return [...new Map([...darkness,...espiral,...vertentes,...absolutoItens,...espiralItens].map(e=>[e.id,e])).values()];
}
