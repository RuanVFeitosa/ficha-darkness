import { newOrdemSheet, ordemId, rituals, skills } from './ordemSheet';

export const origins = {
  Acadêmico: [['Ciências', 'Investigação'], 'Saber é Poder', 'Gaste 2 PE para ganhar +5 em um teste de Intelecto.'],
  'Agente de Saúde': [['Intuição', 'Medicina'], 'Técnica Medicinal', 'Some seu Intelecto aos PV que você curar.'],
  Amnésico: [[], 'Vislumbres do Passado', 'Uma vez por sessão, teste Intelecto (DT 10) para reconhecer algo do passado. Se passar, ganhe 1d4 PE temporários e uma possível pista do mestre.'],
  Artista: [['Artes', 'Enganação'], 'Magnum Opus', 'Uma vez por missão, uma pessoa numa interação reconhece sua obra. Você ganha +5 em testes de Presença e perícias baseadas nela contra essa pessoa.'],
  Atleta: [['Acrobacia', 'Atletismo'], '110%', 'Gaste 2 PE para ganhar +5 num teste de perícia de Força ou Agilidade, exceto Luta e Pontaria.'],
  Chef: [['Fortitude', 'Profissão'], 'Ingrediente Secreto', 'No interlúdio, você pode cozinhar um prato especial ao se alimentar. Quem se alimentar recebe benefícios de dois pratos, que podem se acumular.'],
  Criminoso: [['Crime', 'Furtividade'], 'O Crime Compensa', 'Leve um item encontrado para a próxima missão sem contar no limite de itens por patente.'],
  'Cultista Arrependido': [['Ocultismo', 'Religião'], 'Traços do Outro Lado', 'Escolha um poder paranormal. Sua Sanidade inicial é metade da normal.'],
  Desgarrado: [['Fortitude', 'Sobrevivência'], 'Calejado', 'Ganhe +1 PV a cada 5% de NEX.'],
  Engenheiro: [['Profissão', 'Tecnologia'], 'Ferramenta Favorita', 'Escolha um item que não seja uma arma. Para você, ele conta como uma categoria abaixo.'],
  Executivo: [['Diplomacia', 'Profissão'], 'Processo Otimizado', 'Gaste 2 PE para ganhar +5 em um teste estendido ou numa ação de revisar documentos.'],
  Investigador: [['Investigação', 'Percepção'], 'Faro para Pistas', 'Uma vez por cena, gaste 1 PE para ganhar +5 em um teste para procurar pistas.'],
  Lutador: [['Luta', 'Reflexos'], 'Mão Pesada', 'Ganhe +2 em rolagens de dano corpo a corpo.'],
  Magnata: [['Diplomacia', 'Pilotagem'], 'Patrocinador da Ordem', 'Seu limite de crédito é um acima do normal.'],
  Mercenário: [['Iniciativa', 'Intimidação'], 'Posição de Combate', 'No primeiro turno de cada cena de ação, gaste 2 PE para ganhar uma ação de movimento.'],
  Militar: [['Pontaria', 'Tática'], 'Para Bellum', 'Ganhe +2 em rolagens de dano com armas de fogo.'],
  Operário: [['Fortitude', 'Profissão'], 'Ferramenta de Trabalho', 'Escolha, com o mestre, uma arma simples ou tática que serviria como ferramenta. Você sabe usá-la e recebe +1 no ataque, dano e margem de ameaça com ela.'],
  Policial: [['Percepção', 'Pontaria'], 'Patrulha', 'Ganhe +2 em Defesa.'],
  Religioso: [['Religião', 'Vontade'], 'Acalentar', 'Ganhe +5 ao usar Religião para acalmar. Em caso de sucesso, a pessoa recupera 1d6 + sua Presença em SAN.'],
  'Servidor Público': [['Intuição', 'Vontade'], 'Espírito Cívico', 'Gaste 1 PE ao ajudar para aumentar em +2 o bônus concedido.'],
  'Teórico da Conspiração': [['Investigação', 'Ocultismo'], 'Eu Já Sabia', 'Sua resistência a dano mental é igual ao seu Intelecto.'],
  'T.I.': [['Investigação', 'Tecnologia'], 'Motor de Busca', 'Com internet e a critério do mestre, gaste 2 PE para usar Tecnologia no lugar de outra perícia.'],
  'Trabalhador Rural': [['Adestramento', 'Sobrevivência'], 'Desbravador', 'Gaste 2 PE para ganhar +5 em Adestramento ou Sobrevivência. Terreno difícil não reduz seu deslocamento.'],
  Trambiqueiro: [['Crime', 'Enganação'], 'Impostor', 'Uma vez por cena, gaste 2 PE para usar Enganação no lugar de outra perícia.'],
  Universitário: [['Atualidades', 'Investigação'], 'Dedicação', 'Ganhe +1 PE inicial, mais 1 em NEX 15%, 25% e assim por diante. Seu limite de PE por turno aumenta em 1, sem alterar suas DTs.'],
  Vítima: [['Reflexos', 'Vontade'], 'Cicatrizes Psicológicas', 'Ganhe +1 SAN a cada 5% de NEX.'],
};

export const classes = {
  Combatente: {
    pv: 20, pe: 2, san: 12, choices: 1, proficiencies: 'Armas simples e táticas, proteções leves',
    abilities: [['Ataque Especial', 'Ao atacar, gaste 2 PE para ganhar +5 no ataque ou no dano.']],
  },
  Especialista: {
    pv: 16, pe: 3, san: 16, choices: 7, proficiencies: 'Armas simples, proteções leves',
    abilities: [['Eclético', 'Gaste 2 PE para receber os benefícios de ser treinado num teste de perícia.'],
      ['Perito', 'Gaste 2 PE para somar 1d6 ao teste de uma de suas duas perícias de Perito.']],
  },
  Ocultista: {
    pv: 12, pe: 4, san: 20, choices: 3, proficiencies: 'Armas simples',
    abilities: [['Escolhido pelo Outro Lado', 'Você pode conjurar rituais de 1º círculo e começa com três rituais desse círculo.']],
  },
};

export const paranormalPowers = {
  'Aprender Ritual': 'Aprenda um ritual de 1º círculo.',
  'Resistir a um Elemento': 'Receba resistência 10 contra o elemento escolhido.',
  'Percepção Paranormal': 'Ao procurar pistas numa investigação, você pode rerrolar um dado abaixo de 10 e deve aceitar o novo resultado.',
  Sensitivo: '+5 em Diplomacia, Intimidação e Intuição.',
  'Visão do Oculto': '+5 em Percepção e visão no escuro.',
  Afortunado: 'Uma vez por rolagem, rerrole um resultado 1 num dado que não seja d20.',
  'Causalidade Fortuita': 'A DT para você procurar pistas cai em 5 até encontrar uma na cena.',
  'Encarar a Morte': '+1 no limite de PE durante cenas de ação, sem alterar suas DTs.',
  'Potencial Aprimorado': '+1 PE por cada 5% de NEX.',
  'Potencial Reaproveitado': 'Uma vez por rodada, ganhe 2 PE temporários cumulativos ao passar num teste de resistência. Eles duram até o fim da cena.',
  'Arma de Sangue': 'Gaste uma ação de movimento e 2 PE para criar uma arma natural de 1d6 de Sangue. Ao agredir, uma vez por turno, gaste 1 PE para um ataque adicional com ela.',
  'Sangue de Ferro': '+2 PV por cada 5% de NEX.',
};

export const combatGroups = [['Luta', 'Pontaria'], ['Fortitude', 'Reflexos']];
export const skillNames = skills.map(([name]) => name);
export const initialRituals = rituals.filter(ritual => ritual.circle === 1);

export function creationState(draft) {
  const origin = origins[draft.origem];
  const role = classes[draft.classe];
  const baseSkills = draft.origem === 'Amnésico' ? draft.originSkills : (origin?.[0] ?? []);
  const classSkills = draft.classe === 'Combatente' ? draft.combatSkills.filter(Boolean)
    : draft.classe === 'Ocultista' ? ['Ocultismo', 'Vontade'] : [];
  const fixed = [...new Set([...baseSkills, ...classSkills])];
  const freeCount = role ? role.choices + draft.attributes.INT + baseSkills.length + classSkills.length - fixed.length : 0;
  const free = draft.freeSkills.filter(name => !fixed.includes(name)).slice(0, freeCount);
  const trained = [...fixed, ...free];
  const expertOptions = trained.filter(name => !['Luta', 'Pontaria'].includes(name));
  const expert = draft.expert.filter(name => expertOptions.includes(name));
  const points = 9 - Object.values(draft.attributes).reduce((sum, value) => sum + value, 0);
  const dedication = draft.origem === 'Universitário';
  const resources = role && {
    pv: role.pv + draft.attributes.VIG + Number(draft.origem === 'Desgarrado') + 2 * Number(draft.power === 'Sangue de Ferro'),
    pe: role.pe + draft.attributes.PRE + Number(dedication) + Number(draft.power === 'Potencial Aprimorado'),
    san: (draft.origem === 'Cultista Arrependido' ? role.san / 2 : role.san) + Number(draft.origem === 'Vítima'),
  };
  const ritualCount = (draft.classe === 'Ocultista' ? 3 : 0) + Number(draft.power === 'Aprender Ritual');
  const originReady = Boolean(origin)
    && (draft.origem !== 'Amnésico' || baseSkills.length === 2)
    && (!['Engenheiro', 'Operário'].includes(draft.origem) || Boolean(draft.originDetail.trim()))
    && (draft.origem !== 'Cultista Arrependido' || (Boolean(draft.power) && (draft.power !== 'Resistir a um Elemento' || Boolean(draft.element))));
  const profession = draft.origem === 'Chef' ? 'Cozinheiro' : (draft.profession || '').trim();
  const classReady = Boolean(role) && (draft.classe !== 'Combatente' || classSkills.length === 2)
    && free.length === freeCount && (draft.classe !== 'Especialista' || expert.length === 2)
    && (!trained.includes('Profissão') || Boolean(profession))
    && draft.rituals.length === ritualCount;
  return { origin, role, fixed, free, freeCount, trained, expertOptions, expert, points, resources, ritualCount, originReady, classReady, profession };
}

export function createAgent(draft, { deferTraining = false } = {}) {
  const state = creationState(draft);
  if (state.points !== 0 || !state.originReady || !state.role
    || (!deferTraining && (!draft.nome.trim() || !state.classReady))) {
    throw new Error('Conclua as escolhas obrigatórias antes de criar a ficha.');
  }
  const abilities = [[state.origin[1], [state.origin[2], draft.originDetail].filter(Boolean).join(' ')], ...state.role.abilities];
  if (draft.classe === 'Especialista' && state.expert.length) abilities.push(['Perícias de Perito', state.expert.join(', ')]);
  if (draft.power) {
    const detail = draft.element ? `${paranormalPowers[draft.power]} Elemento: ${draft.element}.` : paranormalPowers[draft.power];
    abilities.push([draft.power, detail]);
  }
  const universal = draft.origem === 'Universitário';
  const extraSkills = draft.power === 'Visão do Oculto' ? ['Percepção']
    : draft.power === 'Sensitivo' ? ['Diplomacia', 'Intimidação', 'Intuição'] : [];
  return {
    ...newOrdemSheet(),
    nome: draft.nome.trim(), jogador: draft.jogador.trim(), origem: draft.origem, classe: draft.classe,
    attributes: draft.attributes, limitePe: universal ? 2 : 1, ritualDtPeBonus: universal ? -1 : 0,
    defenseBonus: draft.origem === 'Policial' ? 2 : 0,
    resources: Object.fromEntries(Object.entries(state.resources).map(([key, max]) => [key, { current: max, max, temp: 0 }])),
    skills: Object.fromEntries([...new Set([...state.trained, ...extraSkills])].map(name => [name, {
      rank: state.trained.includes(name) ? 5 : 0, extra: extraSkills.includes(name) ? 5 : 0,
    }])),
    abilities: [...abilities, ['Proficiências', state.role.proficiencies]].map(([name, detail]) => ({ id: ordemId(), name, detail })),
    rituals: draft.rituals,
    notes: [draft.identity?.trim(), draft.concept.trim(), state.profession && state.trained.includes('Profissão') && `Profissão: ${state.profession}`].filter(Boolean).join('\n\n'),
  };
}
