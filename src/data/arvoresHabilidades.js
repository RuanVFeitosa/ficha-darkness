const criarArvoreVazia = (nome) => ({
  classe: nome,
  titulo: nome,
  beneficio: "As habilidades desta classe ainda serao adicionadas.",
  absolutas: [],
  bases: [],
  aptidoes: [],
  especialidades: [],
});
const arvoreAniquilador = {
  classe: "Aniquilidador",
  titulo: "A ANIQUILACAO ABSOLUTA",
  beneficio: "Todos os danos de seus ataques aumentam em +1 dado.",
  absolutas: [
    {
      id: "concentracao-aniquiladora",
      nome: "Concentracao Aniquiladora",
      descricao:
        "Ao gastar um Turno de Preparo, voce concentra poder destrutivo em seus membros. Ate o fim do turno, seus ataques desarmados causam dano maximo em um dos dados. No nivel 8, pode ser usado como acao livre 1 vez por cena.",
    },
    {
      id: "impacto-aterrorizante",
      nome: "Impacto Aterrorizante",
      descricao:
        "Quando acerta um ataque desarmado, pode gastar uma reacao para tentar amedrontar o alvo. Se falhar, o alvo fica abalado por 1d6 rodadas. No nivel 6, vira panico contra inimigos de NV menor.",
    },
    {
      id: "furia-exterminador",
      nome: "Furia do Exterminador",
      descricao:
        "Ao reduzir um inimigo a 0 PV, recebe +2 em acerto e dano corpo a corpo ate o fim do combate, acumulando ate +6. No nivel 10, cada pilha reduz a resistencia a dano do alvo em 5.",
    },
    {
      id: "aniquilacao-total",
      nome: "Aniquilacao Total",
      descricao:
        "Uma vez por dia, ao acertar um ataque desarmado, role o dano e multiplique o resultado por 10. Se reduzir o alvo a 0 PV, pode fazer um novo ataque normal. A partir do nivel 10, pode usar 2 vezes por dia.",
    },
    {
      id: "sentenca-executada",
      nome: "Sentenca Executada",
      descricao:
        "Ao atacar um alvo culpado de crime violento ou fugitivo da justica, ignora 5 pontos de Defesa e resistencia fisica. Pode usar Forca para interrogatorios intimidatorios.",
    },
    {
      id: "predador-alfa",
      nome: "Predador Alfa",
      descricao:
        "Ao cacar uma criatura ou ameaca humana em territorio natural ou estudado, recebe +3D em Sobrevivencia para rastrear e em Violencia no primeiro ataque surpresa. Identifica instintivamente o membro mais perigoso de um grupo.",
    },
    {
      id: "impenetravel",
      nome: "Impenetravel",
      descricao:
        "Ao defender um ponto especifico e nao se mover no turno, sua Defesa aumenta em +2 contra corpo a corpo. Recebe vantagem em Fortitude para resistir a efeitos que tentem move-lo ou derruba-lo.",
    },
  ],
  aptidoes: [
    {
      id: "golpe-sem-misericordia",
      nome: "Golpe Sem Misericordia",
      custo: "10 PE",
      descricao:
        "Uma vez por cena, caso o alvo esteja na metade de PI de membro critico, transforme um ataque em execucao, podendo desmembrar um membro de inimigos comuns.",
    },
    {
      id: "corpo-como-arma",
      nome: "Corpo como Arma",
      custo: "5 PE",
      descricao:
        "Uma vez por combate, cause dano massivo ignorando armadura ao alvo agarrado.",
    },
    {
      id: "tanque-apocalipse",
      nome: "Tanque do Apocalipse",
      custo: "Passiva",
      descricao:
        "Pontos de Integridade do corpo contem 20 PIs negativos. Caso zere PIs positivos, tera +20 pontos antes de morrer.",
    },
    {
      id: "encarar-morte",
      nome: "Encarar a Morte",
      custo: "10 PE",
      descricao:
        "Uma vez por sessao, ignora completamente um efeito ou dano que o mataria.",
    },
    {
      id: "indomavel",
      nome: "Indomavel",
      custo: "Passiva",
      descricao:
        "Ganha resistencia a um tipo de dano a sua escolha. Em interludio, pode treinar para trocar esse tipo de resistencia.",
    },
    {
      id: "investida-esmagadora",
      nome: "Investida Esmagadora",
      custo: "2 PE",
      descricao:
        "Como acao de movimento aprimorada, avanca em linha reta, ignora obstaculos menores e faz ataque corpo a corpo. Se acertar, empurra o alvo e pode derruba-lo.",
    },
    {
      id: "ponto-pressao",
      nome: "Ponto de Pressao",
      custo: "4 PE",
      descricao:
        "Ao acertar ataque corpo a corpo, ignora temporariamente resistencia a dano do alvo. Se nao houver resistencia, causa +1d6 contundente.",
    },
    {
      id: "postura-inquebravel",
      nome: "Postura Inquebravel",
      custo: "3 PE - Reacao",
      descricao:
        "Ao ser atingido corpo a corpo, reduz dano em 1d6 + mod Fortitude. Se zerar o dano, faz ataque de oportunidade imediato.",
    },
    {
      id: "aura-dano",
      nome: "Aura de Dano",
      custo: "1 PE/rodada",
      descricao:
        "Emana aura de dor em 3m. Inimigos que comecarem o turno na aura testam Fortitude; se falharem, sofrem 1d4 e -2 em concentracao ou precisao fina.",
    },
    {
      id: "rompe-defesas",
      nome: "Rompe Defesas",
      custo: "2 PE",
      descricao:
        "Ao acertar ataque corpo a corpo, reduz Defesa do alvo em -2 contra o proximo ataque ate o final do proximo turno.",
    },
    {
      id: "recuperacao-rapida",
      nome: "Recuperacao Rapida",
      custo: "Passiva",
      descricao:
        "Uma vez por cena, quando sua Sanidade cair abaixo de 50%, recupera Integridade igual ao nivel + mod Fortitude como acao livre.",
    },
    {
      id: "agarrao-esmagador",
      nome: "Agarrao Esmagador",
      custo: "4 PE",
      descricao:
        "Ao agarrar com sucesso, o alvo sofre 1d6 contundente no inicio de seus turnos enquanto voce mantiver o agarramento, e voce ganha +2 para mante-lo.",
    },
    {
      id: "foco-dor",
      nome: "Foco na Dor",
      custo: "1 PE - Reacao",
      descricao:
        "Quando um inimigo ao alcance de movimento sofre dano, move-se ate metade do deslocamento em direcao a ele e ganha +2 no proximo ataque contra esse alvo.",
    },
    {
      id: "passo-inabalavel",
      nome: "Passo Inabalavel",
      custo: "Passiva",
      descricao:
        "Imune a empurrar, derrubar, agarrar e puxar forcados. Terreno dificil nao reduz seu deslocamento.",
    },
    {
      id: "contra-ataque-devastador",
      nome: "Contra-Ataque Devastador",
      custo: "3 PE - Reacao",
      descricao:
        "Quando um ataque corpo a corpo erra voce, pode contra-atacar. Se acertar, causa +1d8 de dano adicional.",
    },
    {
      id: "quebra-ritmo",
      nome: "Quebra de Ritmo",
      custo: "2 PE",
      descricao:
        "Ao acertar ataque, forca teste de Vontade contra Forca. Se falhar, o alvo nao pode usar habilidades ativas ou poderes de acao padrao no proximo turno.",
    },
    {
      id: "vigor-batalha",
      nome: "Vigor da Batalha",
      custo: "Passiva",
      descricao:
        "No terceiro turno consecutivo de combate, ganha +1 em ataques e dano corpo a corpo. Aumenta para +2 a partir do sexto turno.",
    },
    {
      id: "investida-poderosa",
      nome: "Investida Poderosa",
      custo: "4 PE",
      descricao:
        "Como acao completa, move-se em linha reta e faz ataque unico com +2. Se acertar, causa dano normal +2d6.",
    },
    {
      id: "pele-aco",
      nome: "Pele de Aco",
      custo: "3 PE - Reacao",
      descricao:
        "Ao ser atingido, ganha resistencia igual ao mod Forca contra um tipo de dano daquele ataque ate o inicio de seu proximo turno.",
    },
    {
      id: "sinal-aniquilacao",
      nome: "Sinal de Aniquilacao",
      custo: "5 PE",
      descricao:
        "Marca um inimigo por 1 rodada. Ataques corpo a corpo contra ele causam +1d12. Se o alvo morrer, pode marcar outro como acao livre.",
    },
    {
      id: "golpe-desestabilizador",
      nome: "Golpe Desestabilizador",
      custo: "1 PE",
      descricao:
        "Ao acertar ataque corpo a corpo, reduz o deslocamento do alvo pela metade por 1d4 rodadas.",
    },
    {
      id: "furia-contida",
      nome: "Furia Contida",
      custo: "Passiva",
      descricao:
        "Quando ataca corpo a corpo sem usar aptidao de PE, ganha 1 Furia, maximo 3. Gaste 2 para +1d6 ou 3 para transformar acerto normal em critico.",
    },
    {
      id: "olho-furacao",
      nome: "Olho do Furacao",
      custo: "2 PE - Movimento",
      descricao:
        "Ate o inicio do proximo turno, nao sofre flanqueamento e pode usar Reacao para aplicar -2 no ataque de um inimigo.",
    },
  ],
  especialidades: [
    {
      id: "pugilista",
      nome: "O Pugilista",
      passiva: "Dano desarmado padrao: 3d6.",
      habilidades: [
        {
          id: "ataque-rapido",
          nivel: "I",
          nome: "Ataque Rápido",
          descricao:
            "Faça um ataque corpo a corpo com um bônus de +2 no teste de ataque. Se acertar, o alvo deve fazer um teste de Reflexos ou Destreza para evitar ficar Atordoado até o próximo turno.",
        },

        {
          id: "esquiva-agil",
          nivel: "II",
          nome: "Esquiva Ágil",
          descricao:
            "Gaste uma ação de reação para aumentar sua Defesa ou Classe de Armadura em +4 contra um ataque que você possa ver. Se o ataque ainda assim acertar, você recebe apenas metade do dano.",
        },

        {
          id: "golpe-precisao",
          nivel: "III",
          nome: "Golpe de Precisão",
          descricao:
            "Realize um ataque corpo a corpo. Se acertar, adicione metade do seu modificador de Destreza ao dano causado. Este ataque ignora metade da Redução de Dano do alvo.",
        },

        {
          id: "investida-acrobatica",
          nivel: "IV",
          nome: "Investida Acrobática",
          descricao:
            "Mova-se até 9 metros em linha reta em direção a um inimigo e faça um ataque corpo a corpo. Se acertar, adicione o seu modificador de Destreza ao dano. Se errar, você pode se mover até 3 metros para longe do inimigo sem provocar ataques de oportunidade.",
        },

        {
          id: "mestre-marcial",
          nivel: "V",
          nome: "Mestre Marcial",
          descricao:
            "Você ganha +1D6 em testes de ataque com armas ágeis, em manobras com essas armas e em ataques desarmados.",
        },

        {
          id: "contragolpe-veloz",
          nivel: "VI",
          nome: "Contragolpe Veloz",
          descricao:
            "Se um inimigo errar um ataque corpo a corpo contra você, você pode gastar uma reação para realizar um ataque corpo a corpo contra esse inimigo com um bônus de +2 no teste de ataque.",
        },

        {
          id: "golpe-destruidor",
          nivel: "VII",
          nome: "Golpe Destruidor",
          descricao:
            "Você pode usar um de seus bônus de +5 da sua habilidade Ataque Especial para aumentar a margem de ameaça de um golpe. Esta habilidade só pode ser usada uma vez por uso de Ataque Especial e apenas com ataques corpo a corpo.",
        },

        {
          id: "meditacao-combate",
          nivel: "VIII",
          nome: "Meditação de Combate",
          descricao:
            "Você ganha +1 na Resistência ou Reflexos. Uma vez por cena, pode gastar uma ação completa para se concentrar no combate. Até o final da cena, sofre -5 em Reflexos e Resistência, mas ganha 1d6 +1 PE temporários. Os PE aumentam para 3d6 +1 no NV5 e 6d6 +1 no NV10.",
        },

        {
          id: "mestre-artes-marciais",
          nivel: "IX",
          nome: "Mestre das Artes Marciais",
          descricao:
            "Sua margem de ameaça com armas ágeis aumenta. Você recebe +3D6 em testes e o dano com essas armas aumenta em +3D.",
        },

        {
          id: "brutamonte",
          nivel: "X",
          nome: "Brutamonte",
          descricao:
            "Acertos críticos forçam o alvo a realizar um teste de Força. Se falhar, ele é derrubado.",
        },
      ],
    },
    {
      id: "muralha-indomavel",
      nome: "Muralha Indomável",
      passiva:
        "Especialidade defensiva voltada a reações, defesa, esquiva e permanência em combate.",
      habilidades: [
        {
          id: "esquiva-estrategica",
          nivel: "I",
          nome: "Esquiva Estratégica",
          descricao:
            "1x por rodada, ao sofrer um ataque corpo a corpo, pode fazer um teste de Reflexos para evitar totalmente o ataque.",
        },

        {
          id: "parry-preciso",
          nivel: "II",
          nome: "Parry Preciso",
          descricao:
            "Quando atacado, pode gastar uma reação para fazer um teste de Ataque. Se vencer, reduz o dano do golpe pela metade.",
        },

        {
          id: "fortaleza-inabalavel",
          nivel: "III",
          nome: "Fortaleza Inabalável",
          descricao:
            "+2 em testes de resistência contra efeitos que causam dano mental ou físico.",
        },

        {
          id: "contra-ataque-oportuno",
          nivel: "IV",
          nome: "Contra-Ataque Oportuno",
          descricao:
            "Se um inimigo errar um ataque corpo a corpo contra você, pode usar sua reação para contra-atacar e causar dano adicional.",
        },

        {
          id: "postura-defensiva",
          nivel: "V",
          nome: "Postura Defensiva",
          descricao:
            "Ao usar a ação de Esquiva, recebe +3 de bônus em Defesa até o início do próximo turno.",
        },

        {
          id: "desarme-rapido",
          nivel: "VI",
          nome: "Desarme Rápido",
          descricao:
            "Após um sucesso em Parry Preciso, pode gastar outra reação para tentar desarmar o inimigo imediatamente.",
        },

        {
          id: "defesa-impecavel",
          nivel: "VII",
          nome: "Defesa Impecável",
          descricao:
            "1x por combate, pode declarar que um ataque contra você automaticamente erra antes de rolar o dano.",
        },

        {
          id: "retaliacao-imediata",
          nivel: "VIII",
          nome: "Retaliação Imediata",
          descricao:
            "Após sofrer um ataque bem-sucedido, pode gastar uma reação para atacar imediatamente o atacante.",
        },

        {
          id: "fortaleza-mental",
          nivel: "IX",
          nome: "Fortaleza Mental",
          descricao: "Você se torna imune a efeitos de medo e encanto.",
        },

        {
          id: "esquiva-agil-muralha",
          nivel: "X",
          nome: "Esquiva Ágil",
          descricao:
            "Pode usar Esquiva Estratégica duas vezes por rodada, desde que sejam ataques separados.",
        },
      ],
    },
    {
      id: "guerreiro-armas-duplas",
      nome: "Guerreiro de Armas Duplas",
      passiva:
        "Especialidade focada em combate agressivo, múltiplos ataques e domínio de estilos variados de armas.",
      habilidades: [
        {
          id: "armas-especificas",
          nivel: "I",
          nome: "Armas Específicas",
          descricao:
            "Escolha uma arma específica, como espada longa, lança ou machado. Você recebe +2 em ataques e dano com essa arma. Quando empunha uma arma em cada mão, não sofre penalidades nos ataques secundários.",
        },

        {
          id: "armas-improvisadas",
          nivel: "II",
          nome: "Armas Improvisadas",
          descricao:
            "Pode usar objetos como armas improvisadas: sofre -2 no ataque, mas causa 1d6 + Força de dano. Além disso, pode usar uma ação bônus para encontrar rapidamente uma arma improvisada.",
        },

        {
          id: "especialista-dual",
          nivel: "III",
          nome: "Especialista em Dual",
          descricao:
            "Você não sofre penalidades ao lutar com duas armas e pode realizar um ataque adicional com a arma secundária como parte da ação de ataque.",
        },

        {
          id: "acougueiro-machado",
          nivel: "IV",
          nome: "Açougueiro de Machado de Batalha",
          descricao:
            "Acertos críticos forçam o inimigo a realizar um teste de Resistência. Se falhar, fica Atordoado e sofre Sangramento.",
        },

        {
          id: "extrema-agressividade",
          nivel: "V",
          nome: "Extrema Agressividade",
          descricao:
            "Você recebe +5 em jogadas de ataque e dano corpo a corpo. Além disso, se um inimigo errar um ataque corpo a corpo contra você, pode usar uma reação para realizar um ataque corpo a corpo contra ele. Ao acertar um crítico, realiza dois ataques extras. Se ambos acertarem, derruba o alvo como ação livre. Esta habilidade não é cumulativa.",
        },

        {
          id: "furia-descomunal",
          nivel: "VI",
          nome: "Fúria Descomunal",
          descricao:
            "Você pode entrar em estado de fúria como ação de preparo por 1 minuto. Enquanto estiver em fúria, recebe +3 em dano corpo a corpo e resistência a dano perfurante, cortante e contundente. Se reduzir um inimigo a 0 PV durante a fúria, recupera 1d6 + Constituição PV e pode realizar imediatamente um ataque adicional contra outro inimigo adjacente. Pode usar esta habilidade um número de vezes igual ao modificador de Constituição, recuperando após descanso longo.",
        },

        {
          id: "mordida-ferro",
          nivel: "VII",
          nome: "Mordida de Ferro",
          descricao:
            "Quando utiliza armas de haste, como lanças, alabardas ou chicotes, seu alcance corpo a corpo aumenta em 1,5m. Após acertar um ataque, pode usar uma ação bônus para tentar desarmar o inimigo. Além disso, uma vez por turno, se um inimigo sair voluntariamente do seu alcance, você pode realizar um ataque de oportunidade sem gastar reação.",
        },

        {
          id: "dancarino-macabro",
          nivel: "VIII",
          nome: "Dançarino Macabro",
          descricao:
            "Enquanto empunha duas armas leves, recebe +1 de Defesa e pode realizar o ataque da arma secundária sem gastar ação bônus. Se ambos os ataques acertarem o mesmo alvo, causa +1d6 de dano adicional e reduz a velocidade do alvo pela metade até o fim do próximo turno. Críticos com a arma secundária permitem um terceiro ataque.",
        },

        {
          id: "estilhacos-faiscas",
          nivel: "IX",
          nome: "Estilhaços e Faíscas",
          descricao:
            "O dano de armas improvisadas aumenta para 1d8 + Força e o penalizador de ataque reduz para -1. Após acertar um ataque, pode destruir a arma improvisada para causar +1d6 de dano adicional ou aplicar cegueira temporária até o fim do próximo turno do alvo.",
        },

        {
          id: "tolerancia-zero",
          nivel: "X",
          nome: "Estilo Tolerância Zero",
          descricao:
            "Uma vez por rodada, quando um inimigo errar um ataque corpo a corpo contra você, pode usar sua reação para forçá-lo a realizar um teste de Sabedoria. Se falhar, fica Apavorado até o fim do próximo turno. Se passar, sofre dano psíquico igual ao seu modificador de Carisma. Além disso, você recebe vantagem em testes de Intimidação contra criaturas que tenham errado ataques contra você recentemente.",
        },
      ],
    },
    {
      id: "rompe-muralhas",
      nome: "Rompe-Muralhas",
      passiva:
        "Especialidade focada em agarrões, imobilizações e domínio físico total do combate.",
      habilidades: [
        {
          id: "agarre-eficaz",
          nivel: "I",
          nome: "Agarre Eficaz",
          descricao:
            "Quando acerta um ataque desarmado, pode optar por agarrar o inimigo. Ele deve passar em um teste de Força no próximo turno ou ficará imobilizado.",
        },

        {
          id: "defesa-grappling",
          nivel: "II",
          nome: "Defesa Grappling",
          descricao:
            "Quando tentarem agarrá-lo, pode gastar uma reação para fazer um teste de Força ou Destreza. Se vencer, evita o agarre e pode realizar um ataque desarmado como contra-ataque.",
        },

        {
          id: "chave-articulacao",
          nivel: "III",
          nome: "Chave de Articulação",
          descricao:
            "Se agarrar um inimigo, pode gastar uma ação para aplicar uma chave de articulação: causa dano igual ao modificador de Destreza e o alvo fica incapacitado até escapar.",
        },

        {
          id: "derrubada-mestra",
          nivel: "IV",
          nome: "Derrubada Mestra",
          descricao:
            "Após um agarre bem-sucedido, pode gastar uma ação para tentar derrubar o inimigo. Ele faz um teste de Destreza ou é derrubado e fica caído.",
        },

        {
          id: "imobilizacao-precisa",
          nivel: "V",
          nome: "Imobilização Precisa",
          descricao:
            "Ao manter um inimigo agarrado, você recebe +2 em testes de Força para impedir que ele escape.",
        },

        {
          id: "quebra-postura",
          nivel: "VI",
          nome: "Quebra de Postura",
          descricao:
            "Após uma chave de articulação bem-sucedida, o inimigo sofre -2 em testes de ataque até se libertar.",
        },

        {
          id: "projetil-humano",
          nivel: "VII",
          nome: "Projétil Humano",
          descricao:
            "Quando está agarrando um inimigo, pode usar uma ação para arremessá-lo até 3 metros. Se atingir outro alvo ou parede, causa dano adicional.",
        },

        {
          id: "agarrao-area",
          nivel: "VIII",
          nome: "Agarrão em Área",
          descricao:
            "Uma vez por descanso, você pode tentar agarrar dois inimigos próximos ao mesmo tempo, realizando dois testes de ataque separados.",
        },

        {
          id: "fortaleza-corporal",
          nivel: "IX",
          nome: "Fortaleza Corporal",
          descricao:
            "Recebe resistência a dano de concussão e contusão enquanto estiver agarrando um inimigo.",
        },

        {
          id: "manobra-finalizacao",
          nivel: "X",
          nome: "Manobra de Finalização",
          descricao:
            "Pode declarar que vai tentar finalizar um inimigo agarrado. Gasta uma ação e força o inimigo a fazer um teste de Constituição. Se falhar, ele é nocauteado.",
        },
      ],
    },
  ],
};
export const arvoresHabilidades = {
  aniquilidador: arvoreAniquilador,
  especialista: criarArvoreVazia("Especialista"),
  "atirador-elite": criarArvoreVazia("Atirador de Elite"),
  "medico-campo": criarArvoreVazia("Medico de Campo"),
  renegado: criarArvoreVazia("O Renegado"),
  ocultista: criarArvoreVazia("O Ocultista"),
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const aliasesClasse = {
  aniquilador: "aniquilidador",
  aniquilidador: "aniquilidador",
  especialista: "especialista",
  "atirador-de-elite": "atirador-elite",
  "atirador-elite": "atirador-elite",
  "medico-de-campo": "medico-campo",
  "medico-campo": "medico-campo",
  renegado: "renegado",
  "o-renegado": "renegado",
  ocultista: "ocultista",
  "o-ocultista": "ocultista",
};

export const obterIdArvoreClasse = (personagem = {}) => {
  const idDireto = personagem.classeId || personagem.classeDetalhes?.id;
  const normalizadoDireto = normalizarTexto(idDireto);

  if (arvoresHabilidades[normalizadoDireto]) {
    return normalizadoDireto;
  }

  const nomeNormalizado = normalizarTexto(personagem.classe);
  return aliasesClasse[nomeNormalizado] || "aniquilidador";
};

export const obterArvoreClasse = (personagem = {}) => {
  const id = obterIdArvoreClasse(personagem);
  return arvoresHabilidades[id] || arvoresHabilidades.aniquilidador;
};

export const listarHabilidadesSelecionadas = (personagem = {}) => {
  const arvoreOriginal = obterArvoreClasse(personagem) || {};

  const arvore = {
    classe: "",
    titulo: "",
    beneficio: "",
    absolutas: [],
    bases: [],
    aptidoes: [],
    especialidades: [],
    ...arvoreOriginal,
  };

  const escolhas = {
    habilidadeAbsoluta: "",
    aptidoes: {},
    especialidade: "",
    especialidadeDefinida: false,
    habilidadesEspecialidade: {},
    ...(personagem.habilidadesClasse || {}),
  };

  const selecionadas = [];

  const absoluta = (arvore.absolutas || []).find(
    (habilidade) => habilidade.id === escolhas.habilidadeAbsoluta,
  );

  if (absoluta) {
    selecionadas.push({
      ...absoluta,
      grupo: "Habilidade Absoluta",
    });
  }

  (arvore.bases || []).forEach((habilidade) => {
    selecionadas.push({
      ...habilidade,
      grupo: "Classe",
    });
  });

  (arvore.aptidoes || [])
    .filter((aptidao) => escolhas.aptidoes?.[aptidao.id])
    .forEach((aptidao) => {
      selecionadas.push({
        ...aptidao,
        grupo: aptidao.custo || "Aptidão",
      });
    });

  const especialidade = (arvore.especialidades || []).find(
    (item) => item.id === escolhas.especialidade,
  );

  if (especialidade?.passiva) {
    selecionadas.push({
      id: `${especialidade.id}-passiva`,
      nome: especialidade.nome,
      descricao: especialidade.passiva,
      grupo: "Passiva de especialidade",
    });
  }

  (especialidade?.habilidades || [])
    .filter((habilidade) => escolhas.habilidadesEspecialidade?.[habilidade.id])
    .forEach((habilidade) => {
      selecionadas.push({
        ...habilidade,
        grupo: `Nível ${habilidade.nivel}`,
      });
    });

  return selecionadas;
};
