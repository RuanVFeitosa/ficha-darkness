import catalogo from './habilidadesDarknessAdaptadas.json';
import { FONTES_OFENSIVAS_MESCLADAS, OFENSIVAS_CONSOLIDADAS } from './ofensivasConsolidadas';

export const CLASSES_HABILIDADES_DARKNESS = ['Ofensiva', 'Resistência', 'Percepção', 'Apoio'];

function aprimoramento(ability) {
  if (ability.category === 'Percepção') return '1×/cena: no sucesso, faça uma pergunta extra sobre as evidências acessíveis.';
  if (ability.category === 'Resistência') return '1×/cena: +1 Proteção contra o próximo dano da ameaça até seu próximo turno.';
  if (ability.category === 'Apoio') return '1×/cena: um beneficiário recebe +1 dado no próximo teste ligado à ajuda, até o fim do próximo turno. Não soma ao bônus original.';
  return '1×/cena: repita um dado de ataque sem êxito e aceite o resultado. Não repete Pressão.';
}

export const HABILIDADES_DARKNESS_ORIGINAIS = catalogo;
export const HABILIDADES_DARKNESS_ADAPTADAS = [...catalogo.filter(ability =>
  ability.category !== 'Ofensiva' || !FONTES_OFENSIVAS_MESCLADAS.has(ability.sourceId)
).map(ability => {
  const refinement = aprimoramento(ability);
  const mastery = ability.limit === 'cena'
    ? '1×/sessão: ative sem consumir o uso por cena. Mantenha custos e limites por paciente.'
    : '1×/cena: repita um dado de Atributo sem êxito ligado à habilidade. Aceite o resultado; não repete Pressão.';
  return { ...ability, levels: [ability.detail, `${ability.detail} ${refinement}`, `${ability.detail} ${refinement} ${mastery}`] };
}), ...OFENSIVAS_CONSOLIDADAS];
