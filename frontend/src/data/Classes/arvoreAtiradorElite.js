export const arvoreAtiradorElite = {
  classe: "Atirador de Elite",

  titulo: "A BALÍSTICA ABSOLUTA",

  beneficio:
    "Todos os danos causados por armas de fogo somam com o modificador de Destreza.",

  absolutas: [
    {
      id: "foco-de-precisao-avancado",
      nome: "Foco de Precisão Avançado",
      custo: "2 PE",
      descricao:
        "No próximo ataque com arma de fogo nesta rodada, recebe +2 no teste e pode mirar em cabeça, membros ou equipamento.",
    },
    {
      id: "tiro-penetrante",
      nome: "Tiro Penetrante",
      custo: "1 PE",
      descricao:
        "Ignora cobertura parcial, reduz cobertura total para parcial e ignora pontos de Redução de Dano.",
    },
    {
      id: "posicao-de-tiro-camuflada",
      nome: "Posição de Tiro Camuflada",
      custo: "1 PE + Ação de Movimento",
      descricao:
        "Após atacar à distância, pode se mover metade do deslocamento e fazer Furtividade com vantagem.",
    },
    {
      id: "cadencia-de-precisao",
      nome: "Cadência de Precisão",
      custo: "3 PE",
      descricao:
        "Faz dois ataques com arma de fogo. Cada ataque recebe +1d8 de dano.",
    },
    {
      id: "balistica-calculada",
      nome: "Balística Calculada",
      custo: "2 PE + Ação Completa",
      descricao:
        "Faz um único disparo de alcance extremo, ignora penalidades ambientais e causa dano máximo da arma + 2d12.",
    },
  ],

  bases: [],

  aptidoes: [
    {
      id: "paciencia-de-predador",
      nome: "Paciência de Predador",
      custo: "5 PE",
      descricao:
        "Se passar um turno inteiro imóvel observando um alvo, seu próximo ataque aumenta a margem de ameaça em 1.",
    },
    {
      id: "fantasma-do-campo",
      nome: "Fantasma do Campo",
      custo: "3 PE",
      descricao:
        "Após acertar um ataque à distância furtivo, pode se reposicionar até metade do deslocamento.",
    },
    {
      id: "balistica-aplicada",
      nome: "Balística Aplicada",
      custo: "1 PE",
      descricao:
        "Ignora penalidades por atirar através de aliados ou contra um alvo cuja posição foi deduzida.",
    },
    {
      id: "olho-de-aguia",
      nome: "Olho de Águia",
      custo: "Passiva",
      descricao:
        "Dobra o alcance efetivo da visão e recebe vantagem em Percepção para alvos distantes.",
    },
    {
      id: "ritmo-cardiaco-controlado",
      nome: "Ritmo Cardíaco Controlado",
      custo: "1 PE - Reação",
      descricao:
        "Após ver o resultado de um ataque à distância, adiciona +1d4 antes de saber se acertou.",
    },
    {
      id: "alvo-prioritario",
      nome: "Alvo Prioritário",
      custo: "1 PE",
      descricao:
        "Marca um inimigo. Até o fim do combate, seus ataques contra ele causam +1d6 de dano.",
    },
    {
      id: "zero-absoluto",
      nome: "Zero Absoluto",
      custo: "10 PE",
      descricao:
        "Como ação completa, realiza um ataque automático contra um alvo visível dentro do alcance máximo da arma.",
    },
  ],

  especialidades: [
    {
      id: "atirador",
      nome: "ATIRADOR",
      descricao:
        "Você treinou suas habilidades para ser o mais destrutivo possível com armas de fogo. Seu lema é atirar primeiro, perguntar depois.",

      habilidades: [
        {
          id: "revidar-fogo",
          nome: "Revidar Fogo",
          nivel: 1,
          descricao:
            "Quando um inimigo atacar um aliado, pode gastar sua reação e 2 PE para fazer um ataque imediato com arma de fogo contra o inimigo, se estiver no alcance.",
        },
        {
          id: "franco-atirador",
          nome: "Franco-Atirador",
          nivel: 2,
          descricao:
            "Recebe +2 na margem de ameaça com armas de fogo e ignora cobertura parcial.",
        },
        {
          id: "tiro-rapido",
          nome: "Tiro Rápido",
          nivel: 3,
          descricao:
            "Como ação bônus, pode realizar um ataque adicional com arma de fogo contra o mesmo alvo que atacou no turno.",
        },
        {
          id: "precisao-cirurgica-atirador",
          nome: "Precisão Cirúrgica",
          nivel: 4,
          descricao:
            "Pode gastar 3 PE para ganhar +2 nos ataques de armas de fogo até o final do próximo turno. Este bônus acumula com outros efeitos.",
        },
        {
          id: "rajada-mortal",
          nome: "Rajada Mortal",
          nivel: 5,
          descricao:
            "Quando faz uma rajada com arma automática, pode gastar 4 PE para anular a penalidade de ataque ou adicionar 1 dado extra no dano.",
        },
        {
          id: "supressao-estrategica",
          nome: "Supressão Estratégica",
          nivel: 6,
          descricao:
            "Ao fazer uma rajada, pode gastar 3 PE para forçar inimigos atingidos a sofrerem -2 nas rolagens de ataque até o início do seu próximo turno.",
        },
        {
          id: "tiro-penetrante-atirador",
          nome: "Tiro Penetrante",
          nivel: 7,
          descricao:
            "Quando acerta um ataque, pode fazer um teste de ataque contra um segundo alvo em linha reta atrás do primeiro. Se acertar, causa metade do dano.",
        },
        {
          id: "explosao-de-ricochete",
          nome: "Explosão de Ricochete",
          nivel: 8,
          descricao:
            "Ao atacar um inimigo em cobertura, pode ignorá-la se houver uma superfície próxima para ricochetear. Inimigos adjacentes ao alvo acertado sofrem dano igual ao seu modificador de Destreza.",
        },
        {
          id: "contra-ofensiva-relampago",
          nome: "Contra-Ofensiva Relâmpago",
          nivel: 9,
          descricao:
            "Quando um inimigo errar um ataque corpo a corpo contra você, pode gastar sua reação e 2 PE para realizar imediatamente um ataque corpo a corpo ou disparar um tiro à queima-roupa.",
        },
        {
          id: "mestre-da-chuva-de-balas",
          nome: "Mestre da Chuva de Balas",
          nivel: 10,
          descricao:
            "Uma vez por descanso longo, pode gastar uma ação para disparar contra até 3 alvos diferentes no alcance, realizando um ataque separado contra cada um sem penalidade.",
        },
      ],
    },

    {
      id: "fuzileiro",
      nome: "FUZILEIRO",
      descricao:
        "Parte de sua vida foi feita em serviço militar, e rapidamente você se acostumou a utilizar armas de fogo.",

      habilidades: [
        {
          id: "punho-firme",
          nome: "Punho Firme",
          nivel: 1,
          descricao:
            "Pode disparar armas de fogo usando Força como atributo base nos testes. Disparos corpo a corpo com armas de fogo não sofrem desvantagem.",
        },
        {
          id: "dominio-de-armas-de-cano-curto",
          nome: "Domínio de Armas de Cano Curto",
          nivel: 2,
          descricao:
            "Bônus de +1 nas rolagens de ataque e dano com pistolas e submetralhadoras. Pode recarregar essas armas como ação livre.",
        },
        {
          id: "taticas-de-emboscada",
          nome: "Táticas de Emboscada",
          nivel: 3,
          descricao:
            "Em combates surpresa, você e aliados ganham +1D nas rolagens de ataque durante o primeiro turno.",
        },
        {
          id: "mestre-tatico-urbano",
          nome: "Mestre Tático Urbano",
          nivel: 4,
          descricao:
            "Especialista em combates urbanos: +2 em Percepção na cidade e +1D em manobras táticas dentro de construções. Uma vez por encontro, pode ganhar +2 na Defesa até o início do próximo turno.",
        },
        {
          id: "manuseio-destruidor",
          nome: "Manuseio Destruidor",
          nivel: 5,
          descricao:
            "Pode disparar uma arma de duas mãos com apenas uma mão, sofrendo -1d6 no teste de ataque.",
        },
        {
          id: "especialista-em-armas-leves",
          nome: "Especialista em Armas Leves",
          nivel: 6,
          descricao:
            "Bônus de +1D em ataque e dano com metralhadoras leves e submetralhadoras. Pode mover metade da velocidade sem penalidade ao atirar.",
        },
        {
          id: "agressao-continua",
          nome: "Agressão Contínua",
          nivel: 7,
          descricao:
            "Ao entrar no estado de machucado, recebe +1 na margem de ameaça e no modificador crítico de suas armas.",
        },
        {
          id: "resiliencia-em-ambientes-hostis",
          nome: "Resiliência em Ambientes Hostis",
          nivel: 8,
          descricao:
            "+2 em testes de resistência contra gás venenoso, radiação ou condições climáticas extremas.",
        },
        {
          id: "adiantamento-tatico",
          nome: "Adiantamento Tático",
          nivel: 9,
          descricao:
            "Uma vez por combate, pode fazer um teste de Percepção para prever o próximo ataque de um oponente. Se bem-sucedido, ganha +2 na Defesa contra esse ataque.",
        },
        {
          id: "veterano-urbano",
          nome: "Veterano Urbano",
          nivel: 10,
          descricao:
            "Você pode escolher duas habilidades anteriores para melhorar: +1 bônus extra nelas ou usar duas vezes por combate. Representa o domínio absoluto em combates urbanos.",
        },
      ],
    },

    {
      id: "as-da-mira-afiada",
      nome: "ÁS DA MIRA AFIADA",
      descricao:
        "O Ás da Mira Afiada é um mestre nas artes do tiro de precisão, conhecido por abates letais a longas distâncias.",

      habilidades: [
        {
          id: "olho-de-aguia-especialidade",
          nome: "Olho de Águia",
          nivel: 1,
          descricao:
            "Ganha +2 em testes de Percepção para identificar alvos a longa distância e vantagem para detectar inimigos ocultos ou camuflados.",
        },
        {
          id: "tiro-preciso",
          nome: "Tiro Preciso",
          nivel: 2,
          descricao:
            "Recebe +2 em ataques com armas de fogo a mais de 30 metros e ignora penalidades por atacar a longa distância.",
        },
        {
          id: "posicionamento-tatico-mira",
          nome: "Posicionamento Tático",
          nivel: 3,
          descricao:
            "Pode gastar uma ação bônus para se mover até 9 metros em direção a uma cobertura ou ponto elevado, ganhando vantagem no próximo ataque.",
        },
        {
          id: "precisao-milimetrica",
          nome: "Precisão Milimétrica",
          nivel: 4,
          descricao:
            "Pode gastar 3 PE para ignorar penalidades de distância em ataques, acertando com precisão qualquer alvo dentro do alcance da arma.",
        },
        {
          id: "respiracao-controlada",
          nome: "Respiração Controlada",
          nivel: 5,
          descricao:
            "Como ação bônus, estabiliza sua mira. No próximo ataque, ganha +2 na rolagem de ataque e ignora vento ou movimento do alvo.",
        },
        {
          id: "tiro-cirurgico-mira",
          nome: "Tiro Cirúrgico",
          nivel: 6,
          descricao:
            "Pode gastar 4 PE para adicionar +2 nas rolagens de ataque e dano ao mirar em regiões críticas, causando ferimentos severos.",
        },
        {
          id: "anular-obstrucoes",
          nome: "Anular Obstruções",
          nivel: 7,
          descricao:
            "Pode gastar 3 PE para ignorar cobertura leve de inimigos, disparando através de obstáculos menores com facilidade.",
        },
        {
          id: "estrategia-de-emboscada",
          nome: "Estratégia de Emboscada",
          nivel: 8,
          descricao:
            "Recebe +1D nas rolagens de ataque ao iniciar combates de emboscada ou ataque surpresa.",
        },
        {
          id: "tiro-rapido-de-precisao",
          nome: "Tiro Rápido de Precisão",
          nivel: 9,
          descricao:
            "Como ação bônus, pode realizar um ataque adicional contra o mesmo alvo. Se ambos acertarem, o alvo deve resistir ou ficar atordoado.",
        },
        {
          id: "atirador-implacavel",
          nome: "Atirador Implacável",
          nivel: 10,
          descricao:
            "Após abater um inimigo, pode gastar 4 PE para realizar imediatamente um ataque adicional contra outro alvo próximo, sem penalidade.",
        },
      ],
    },

    {
      id: "executor-inflexivel",
      nome: "EXECUTOR INFLEXÍVEL",
      descricao: "Atirador frio, disciplinado e letal mesmo em meio ao caos.",

      habilidades: [
        {
          id: "foco-imperturbavel",
          nome: "Foco Imperturbável",
          nivel: 1,
          descricao:
            "Ganha +2 em testes de Percepção e Habilidade para resistir a distrações e desorientações.",
        },
        {
          id: "determinacao-implacavel",
          nome: "Determinação Implacável",
          nivel: 2,
          descricao:
            "Vantagem em testes contra medo ou confusão. Mesmo sob penalidades de precisão, não sofre desvantagens em ataques de fogo.",
        },
        {
          id: "controle-do-caos",
          nome: "Controle do Caos",
          nivel: 3,
          descricao:
            "Vantagem em Percepção e Intuição durante combate. Pode usar ação bônus para ignorar cobertura parcial do inimigo uma vez por turno.",
        },
        {
          id: "precisao-cirurgica-executor",
          nome: "Precisão Cirúrgica",
          nivel: 4,
          descricao:
            "Pode gastar 4 PE para adicionar +1D nos ataques e ignorar parcialmente coberturas leves.",
        },
        {
          id: "calculos-mortais",
          nome: "Cálculos Mortais",
          nivel: 5,
          descricao:
            "Pode gastar 3 PE para ignorar penalidades de longa distância nos testes de ataque e dano.",
        },
        {
          id: "mira-imovel",
          nome: "Mira Imóvel",
          nivel: 6,
          descricao:
            "Se não se mover no turno, recebe +2 no teste de ataque com armas de fogo.",
        },
        {
          id: "tiro-cirurgico-executor",
          nome: "Tiro Cirúrgico",
          nivel: 7,
          descricao:
            "Ao acertar um ataque, causa dano adicional igual ao modificador de Destreza. Em críticos, o alvo deve resistir ou fica Incapacitado.",
        },
        {
          id: "calma-sob-fogo",
          nome: "Calma Sob Fogo",
          nivel: 8,
          descricao:
            "Pode usar reação para ganhar +2 na Defesa contra um ataque. Se o ataque errar, pode retaliar com um disparo.",
        },
        {
          id: "dominio-do-campo-de-batalha",
          nome: "Domínio do Campo de Batalha",
          nivel: 9,
          descricao:
            "Vantagem em testes de Furtividade e escolha de terreno. Disparos de locais elevados ou em cobertura causam +1d6 de dano.",
        },
        {
          id: "dominio-absoluto",
          nome: "Domínio Absoluto",
          nivel: 10,
          descricao:
            "Pode combinar Mira Imóvel e Cálculos Mortais simultaneamente uma vez por encontro.",
        },
      ],
    },

    {
      id: "sentinela",
      nome: "SENTINELA",
      descricao:
        "A Sentinela é capaz de causar destruição em larga escala com disparos precisos e arsenal devastador.",

      habilidades: [
        {
          id: "arsenal-destruidor",
          nome: "Arsenal Destruidor",
          nivel: 1,
          descricao:
            "Ganha +1D em dano com armas de alto calibre. Pode gastar 4 PE para aumentar a margem de ameaça em +1 ao usar essas armas.",
        },
        {
          id: "barragem-de-disparos",
          nome: "Barragem de Disparos",
          nivel: 2,
          descricao:
            "Como ação, pode atacar até 3 alvos em um raio de 6 metros. Cada ataque sofre -2 na rolagem de ataque.",
        },
        {
          id: "fogo-concentrado",
          nome: "Fogo Concentrado",
          nivel: 3,
          descricao:
            "Gasta uma ação bônus para focar em um ponto específico. O próximo ataque causa dano crítico automaticamente. Se errar, ainda causa metade do dano.",
        },
        {
          id: "tiro-devastador",
          nome: "Tiro Devastador",
          nivel: 4,
          descricao:
            "Ao acertar um ataque, pode adicionar dano igual ao modificador de Força. O alvo e inimigos a 3m devem testar Constituição ou serem empurrados e derrubados.",
        },
        {
          id: "chuva-de-destruicao",
          nome: "Chuva de Destruição",
          nivel: 5,
          descricao:
            "Gasta 3 PE para adicionar +2 ao dano em um único alvo, concentrando fogo com precisão letal.",
        },
        {
          id: "municao-de-choque",
          nome: "Munição de Choque",
          nivel: 6,
          descricao:
            "Ao acertar um ataque, o alvo deve fazer um teste de Constituição ou ficar Atordoado até o fim do próximo turno. Inimigos a 3m também devem testar.",
        },
        {
          id: "cascata-de-balas",
          nome: "Cascata de Balas",
          nivel: 7,
          descricao:
            "Gasta 4 PE para realizar 3 ataques rápidos consecutivos, cada um com +1D nas rolagens de ataque.",
        },
        {
          id: "explosao-controlada",
          nome: "Explosão Controlada",
          nivel: 8,
          descricao:
            "Ao causar dano em área, escolhe um número de criaturas igual ao modificador de Destreza para não serem afetadas pela explosão.",
        },
        {
          id: "supressao-total",
          nome: "Supressão Total",
          nivel: 9,
          descricao:
            "Como ação, ataca todos os inimigos em um cone de 9 metros, com -2 no teste de ataque.",
        },
        {
          id: "area-de-impacto",
          nome: "Área de Impacto",
          nivel: 10,
          descricao:
            "Ao acertar um ataque, inimigos em um raio de 3 metros do alvo sofrem dano igual ao seu modificador de Destreza.",
        },
      ],
    },

    {
      id: "infiltrador-silencioso",
      nome: "INFILTRADOR SILENCIOSO",
      descricao:
        "Especialista em furtividade armada, disparos silenciosos, camuflagem e eliminações perfeitas.",

      habilidades: [
        {
          id: "tiro-silenciado",
          nome: "Tiro Silenciado",
          nivel: 1,
          descricao:
            "Suas armas são modificadas para disparos silenciosos. Ataques com armas de fogo não produzem ruído detectável além de 15m. Testes de Percepção DT 15 para ouvir seus tiros têm desvantagem.",
        },
        {
          id: "lente-termica",
          nome: "Lente Térmica",
          nivel: 2,
          descricao:
            "Você possui uma mira com visão térmica. Pode ver seres através de fumaça, névoa e folhagem densa até 30m. Também ignora camuflagem baseada em escuridão ou invisibilidade se o alvo emite calor.",
        },
        {
          id: "sombra-do-vento",
          nome: "Sombra do Vento",
          nivel: 3,
          descricao:
            "Após fazer um ataque à distância, pode usar uma ação bônus para desaparecer. Faça Furtividade com vantagem. Se passar, inimigos devem usar ação completa para procurá-lo antes de atacá-lo.",
        },
        {
          id: "municao-subsonica",
          nome: "Munição Subsônica",
          nivel: 4,
          descricao:
            "Balas especiais reduzem o rastro balístico. Inimigos atingidos têm desvantagem em Percepção para determinar sua localização. Ataques à distância contra você têm desvantagem no primeiro round.",
        },
        {
          id: "executor-noturno",
          nome: "Executor Noturno",
          nivel: 5,
          descricao:
            "Durante a noite ou em escuridão total, seus ataques furtivos com armas de fogo causam +2d6 de dano. Você enxerga em escuridão total até 18m com sua mira especial.",
        },
        {
          id: "tiro-de-distracao",
          nome: "Tiro de Distração",
          nivel: 6,
          descricao:
            "Gaste 2 PE para disparar em um objeto ou superfície distante. Inimigos em 9m do impacto devem testar Vontade ou voltar sua atenção para aquela direção por 1 rodada.",
        },
        {
          id: "mimetismo-urbano",
          nome: "Mimetismo Urbano",
          nivel: 7,
          descricao:
            "Em ambientes urbanos ou industriais, pode se camuflar como ação bônus. Ganha +10 em Furtividade até se mover ou atacar. Pode disparar uma vez sem quebrar a camuflagem.",
        },
        {
          id: "fantasma-completo",
          nome: "Fantasma Completo",
          nivel: 8,
          descricao:
            "Uma vez por missão, escolha um alvo observado por 1 minuto. Seu próximo ataque ignora cobertura e camuflagem, causa dano máximo e não pode ser rastreado até você por meios convencionais ou mágicos por 1 hora.",
        },
      ],
    },
  ],
};
