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
        "Você treinou suas habilidades para ser o mais destrutivo possível com armas de fogo.",

      habilidades: [
        {
          id: "revidar-fogo",
          nome: "Revidar Fogo",
          descricao:
            "Quando um inimigo atacar um aliado, pode gastar reação e 2 PE para atacar esse inimigo com arma de fogo.",
        },
        {
          id: "franco-atirador",
          nome: "Franco-Atirador",
          descricao:
            "Recebe +2 na margem de ameaça com armas de fogo e ignora cobertura parcial.",
        },
        {
          id: "tiro-rapido",
          nome: "Tiro Rápido",
          descricao:
            "Como ação bônus, realiza um ataque adicional com arma de fogo contra o mesmo alvo.",
        },
        {
          id: "mestre-da-chuva-de-balas",
          nome: "Mestre da Chuva de Balas",
          descricao:
            "Uma vez por descanso longo, dispara contra até 3 alvos diferentes sem penalidade.",
        },
      ],
    },

    {
      id: "fuzileiro",
      nome: "FUZILEIRO",
      descricao:
        "Militar acostumado com armas de fogo, combate urbano e agressão contínua.",

      habilidades: [
        {
          id: "punho-firme",
          nome: "Punho Firme",
          descricao:
            "Pode usar Força como atributo base para disparos. Disparos corpo a corpo não sofrem desvantagem.",
        },
        {
          id: "dominio-armas-cano-curto",
          nome: "Domínio de Armas de Cano Curto",
          descricao:
            "Recebe +1 em ataque e dano com pistolas e submetralhadoras.",
        },
        {
          id: "mestre-tatico-urbano",
          nome: "Mestre Tático Urbano",
          descricao:
            "Recebe bônus em combates urbanos e pode ganhar +2 na Defesa uma vez por encontro.",
        },
      ],
    },

    {
      id: "as-da-mira-afiada",
      nome: "ÁS DA MIRA AFIADA",
      descricao:
        "Mestre em disparos de precisão e eliminações a longa distância.",

      habilidades: [
        {
          id: "olho-de-aguia-especialidade",
          nome: "Olho de Águia",
          descricao:
            "Ganha bônus em Percepção para identificar alvos distantes e ocultos.",
        },
        {
          id: "tiro-preciso",
          nome: "Tiro Preciso",
          descricao:
            "Recebe +2 em ataques com armas de fogo acima de 30 metros.",
        },
        {
          id: "atirador-implacavel",
          nome: "Atirador Implacável",
          descricao:
            "Após abater um inimigo, pode gastar 4 PE para atacar outro alvo próximo.",
        },
      ],
    },

    {
      id: "executor-inflexivel",
      nome: "EXECUTOR INFLEXÍVEL",
      descricao:
        "Atirador frio, disciplinado e letal mesmo em meio ao caos.",

      habilidades: [
        {
          id: "foco-imperturbavel",
          nome: "Foco Imperturbável",
          descricao:
            "Recebe +2 contra distrações e desorientações.",
        },
        {
          id: "mira-imovel",
          nome: "Mira Imóvel",
          descricao:
            "Se não se mover no turno, recebe +2 no ataque com armas de fogo.",
        },
        {
          id: "dominio-absoluto",
          nome: "Domínio Absoluto",
          descricao:
            "Combina Mira Imóvel e Cálculos Mortais uma vez por encontro.",
        },
      ],
    },

    {
      id: "sentinela",
      nome: "SENTINELA",
      descricao:
        "Especialista em destruição em massa, supressão pesada e armas de alto calibre.",

      habilidades: [
        {
          id: "arsenal-destruidor",
          nome: "Arsenal Destruidor",
          descricao:
            "Ganha +1D em dano com armas de alto calibre.",
        },
        {
          id: "barragem-de-disparos",
          nome: "Barragem de Disparos",
          descricao:
            "Pode atacar até 3 alvos em um raio de 6 metros.",
        },
        {
          id: "supressao-total",
          nome: "Supressão Total",
          descricao:
            "Ataca todos os inimigos em um cone de 9 metros com -2 no teste.",
        },
      ],
    },
  ],
};