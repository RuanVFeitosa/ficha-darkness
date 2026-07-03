export const MODIFICACOES = [
  // ===== MIRAS (Armas de Fogo) =====
  {
    id: "mira-telescopica-2x",
    nome: "Mira Telescópica 2x",
    categoria: "modificacoes",
    subcategoria: "miras",
    preco: 120,
    detalhe: "+2 em Testes a longa distância, -3 em curta distância.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "mira",
      efeitos: {
        bonusLongo: 2,
        penalidadeCurto: -3,
      },
      slots: 1,
    },
  },
  {
    id: "mira-telescopica-4x",
    nome: "Mira Telescópica 4x",
    categoria: "modificacoes",
    subcategoria: "miras",
    preco: 200,
    detalhe: "+3 em Testes a longa distância, -4 em curta distância.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "mira",
      efeitos: {
        bonusLongo: 3,
        penalidadeCurto: -4,
      },
      slots: 1,
    },
  },
  {
    id: "mira-telescopica-8x",
    nome: "Mira Telescópica 8x",
    categoria: "modificacoes",
    subcategoria: "miras",
    preco: 350,
    detalhe: "+4 em Testes a longa distância, -5 em curta distância.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "mira",
      efeitos: {
        bonusLongo: 4,
        penalidadeCurto: -5,
      },
      slots: 1,
    },
  },
  {
    id: "visao-calor",
    nome: "Visão de Calor",
    categoria: "modificacoes",
    subcategoria: "miras",
    preco: 450,
    detalhe: "Ignora camuflagem.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "mira",
      efeitos: {
        ignoraCamuflagem: true,
      },
      slots: 1,
    },
  },

  // ===== CANOS (Armas de Fogo) =====
  {
    id: "cano-cerrado",
    nome: "Cano Cerrado",
    categoria: "modificacoes",
    subcategoria: "canos",
    preco: 140,
    detalhe: "+2 dados de dano em Curta Distância, -2 dados de dano em Longa Distância.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "cano",
      efeitos: {
        bonusCurtoDano: "2d",
        penalidadeLongoDano: "2d",
        penalidadeLongoTeste: 1,
      },
      slots: 1,
    },
  },
  {
    id: "silenciador",
    nome: "Silenciador",
    categoria: "modificacoes",
    subcategoria: "canos",
    preco: 300,
    detalhe: "Reduz em –20 a penalidade em Furtividade para se esconder após atacar.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "cano",
      efeitos: {
        bonusFurtividade: 20,
      },
      slots: 1,
    },
  },
  {
    id: "ferrolho-automatico",
    nome: "Ferrolho Automático",
    categoria: "modificacoes",
    subcategoria: "canos",
    preco: 400,
    detalhe: "A arma se torna automática. Pode atacar +1 alvo por rodada.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "cano",
      efeitos: {
        automatica: true,
        tirosAdicionais: 1,
      },
      slots: 1,
    },
  },
  {
    id: "cano-alongado",
    nome: "Cano Alongado",
    categoria: "modificacoes",
    subcategoria: "canos",
    preco: 250,
    detalhe: "+2 em Testes de Ataque.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "cano",
      efeitos: {
        bonusTesteAtaque: 2,
      },
      slots: 1,
    },
  },

  // ===== GATILHOS (Armas de Fogo) =====
  {
    id: "gatilho-leve",
    nome: "Gatilho Leve",
    categoria: "modificacoes",
    subcategoria: "gatilhos",
    preco: 180,
    detalhe: "Dispara +1 Tiro sem desvantagem.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "gatilho",
      efeitos: {
        tirosAdicionais: 1,
      },
      slots: 1,
    },
  },
  {
    id: "gatilho-pesado",
    nome: "Gatilho Pesado",
    categoria: "modificacoes",
    subcategoria: "gatilhos",
    preco: 160,
    detalhe: "Pode segurar o tiro para a próxima rodada e ter +1 dado no Teste.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "gatilho",
      efeitos: {
        segurarTiro: true,
        bonusTeste: 1,
      },
      slots: 1,
    },
  },

  // ===== ACOPLAMENTOS =====
  {
    id: "faca-tatica",
    nome: "Faca Tática",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 120,
    detalhe: "1d6 Perfurante em corpo a corpo.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        danoAdicional: "1d6",
        tipoDano: "perfurante",
      },
      slots: 1,
    },
  },
  {
    id: "lanca-granada",
    nome: "Lança-Granada",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 500,
    detalhe: "3d20+10 Impacto/Granada de Fragmentação.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        danoAdicional: "3d20+10",
        tipoDano: "impacto",
      },
      slots: 1,
    },
  },
  {
    id: "granada-fumaca",
    nome: "Granada de Fumaça",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 200,
    detalhe: "-1 dado em Testes que envolvem visão/Área.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        penalidadeVisao: 1,
      },
      slots: 1,
    },
  },
  {
    id: "granada-luz",
    nome: "Granada de Luz",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 220,
    detalhe: "Deixa em Condição Cego/Área por 1d6 rodadas.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        condicao: "cego",
      },
      slots: 1,
    },
  },
  {
    id: "lanterna",
    nome: "Lanterna",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 80,
    detalhe: "Ignora desvantagens no escuro.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        ignoraEscuro: true,
      },
      slots: 1,
    },
  },
  {
    id: "mira-laser",
    nome: "Mira Laser",
    categoria: "modificacoes",
    subcategoria: "acoplamentos",
    preco: 280,
    detalhe: "+2 em margem de ameaça.",
    aplicavel: "arma-fogo",
    modificacao: {
      tipo: "acoplamento",
      efeitos: {
        bonusMargemAmeaca: 2,
      },
      slots: 1,
    },
  },

  // ===== LÂMINAS (Corpo a Corpo) =====
  {
    id: "afiamento-superior",
    nome: "Afiamento Superior",
    categoria: "modificacoes",
    subcategoria: "laminas",
    preco: 250,
    detalhe: "+2 em Lutar.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "lamina",
      efeitos: {
        bonusTesteAtaque: 2,
        durabilidade: 3,
      },
      slots: 1,
    },
  },
  {
    id: "lamina-serrilhada",
    nome: "Lâmina Serrilhada",
    categoria: "modificacoes",
    subcategoria: "laminas",
    preco: 300,
    detalhe: "Ignora 1 ponto de Armadura leve | –1 em cortes contra superfícies rígidas.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "lamina",
      efeitos: {
        ignorarArmadura: 1,
        penalidadeCorteRigido: 1,
      },
      slots: 1,
    },
  },
  {
    id: "reforco-acao-carbono",
    nome: "Reforço de Aço Carbono",
    categoria: "modificacoes",
    subcategoria: "laminas",
    preco: 350,
    detalhe: "+1 dado no dano.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "lamina",
      efeitos: {
        bonusDano: "1d",
        penalidadeOcultar: 1,
      },
      slots: 1,
    },
  },

  // ===== CABOS E EMPUNHADURA (Corpo a Corpo) =====
  {
    id: "empunhadura-couro",
    nome: "Empunhadura em Couro Rugoso",
    categoria: "modificacoes",
    subcategoria: "cabos",
    preco: 150,
    detalhe: "+2 em Testes contra desarme.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "cabo",
      efeitos: {
        bonusDesarme: 2,
      },
      slots: 1,
    },
  },
  {
    id: "punho-aco",
    nome: "Punho de Aço",
    categoria: "modificacoes",
    subcategoria: "cabos",
    preco: 200,
    detalhe: "Pode usar o cabo como arma improvisada (4d4 contundente).",
    aplicavel: "ambos",
    modificacao: {
      tipo: "cabo",
      efeitos: {
        armaImprovisada: "4d4",
      },
      slots: 1,
    },
  },
  {
    id: "contrapeso-punho",
    nome: "Contrapeso de Punho",
    categoria: "modificacoes",
    subcategoria: "cabos",
    preco: 180,
    detalhe: "+1 em Testes de Ataque | –1 em Testes de Furtividade (barulho ao manusear).",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "cabo",
      efeitos: {
        bonusTesteAtaque: 1,
        penalidadeFurtividade: 1,
      },
      slots: 1,
    },
  },

  // ===== PESO E BALANÇO (Corpo a Corpo) =====
  {
    id: "lamina-leve",
    nome: "Lâmina Leve",
    categoria: "modificacoes",
    subcategoria: "peso",
    preco: 220,
    detalhe: "+2 em Velocidade | –1 dado no dano.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "peso",
      efeitos: {
        bonusIniciativa: 2,
        penalidadeDano: "1d",
      },
      slots: 1,
    },
  },
  {
    id: "lamina-pesada",
    nome: "Lâmina Pesada",
    categoria: "modificacoes",
    subcategoria: "peso",
    preco: 260,
    detalhe: "+1 dado no dano | –1 em Defesa.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "peso",
      efeitos: {
        bonusDano: "1d",
        penalidadeDefesa: 1,
      },
      slots: 1,
    },
  },

  // ===== PROTEÇÕES (Corpo a Corpo) =====
  {
    id: "guarda-mao-alongada",
    nome: "Guarda-Mão Alongada",
    categoria: "modificacoes",
    subcategoria: "protecoes",
    preco: 180,
    detalhe: "+1 em Defesa contra lâminas.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "protecao",
      efeitos: {
        bonusDefesaLaminas: 1,
      },
      slots: 1,
    },
  },
  {
    id: "parachoque-punho",
    nome: "Parachoque de Punho",
    categoria: "modificacoes",
    subcategoria: "protecoes",
    preco: 140,
    detalhe: "+1d4 de dano em ataques de soco.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "protecao",
      efeitos: {
        danoSoco: "1d4",
      },
      slots: 1,
    },
  },
  {
    id: "revestimento-borracha",
    nome: "Revestimento de Borracha",
    categoria: "modificacoes",
    subcategoria: "protecoes",
    preco: 100,
    detalhe: "Reduz ruído em ataques furtivos de impacto.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "protecao",
      efeitos: {
        reduzRuido: true,
      },
      slots: 1,
    },
  },

  // ===== OCULTAÇÃO E TRANSPORTE (Corpo a Corpo) =====
  {
    id: "lamina-retratil",
    nome: "Lâmina Retrátil",
    categoria: "modificacoes",
    subcategoria: "ocultacao",
    preco: 400,
    detalhe: "+2 em Furtividade ao portar | –1 no primeiro ataque (desdobramento).",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ocultacao",
      efeitos: {
        bonusFurtividade: 2,
        penalidadePrimeiroAtaque: 1,
      },
      slots: 1,
    },
  },
  {
    id: "bainha-saque-rapido",
    nome: "Bainha de Saque Rápido",
    categoria: "modificacoes",
    subcategoria: "ocultacao",
    preco: 200,
    detalhe: "+2 em Velocidade, saca com ação livre.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ocultacao",
      efeitos: {
        bonusIniciativaSacar: 2,
      },
      slots: 1,
    },
  },
  {
    id: "arma-compacta",
    nome: "Arma Compacta",
    categoria: "modificacoes",
    subcategoria: "ocultacao",
    preco: 180,
    detalhe: "+2 em Furtividade | –1 dado no dano.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ocultacao",
      efeitos: {
        bonusFurtividade: 2,
        penalidadeDano: "1d",
      },
      slots: 1,
    },
  },

  // ===== ESPECIAIS (Corpo a Corpo) =====
  {
    id: "revestimento-antirreflexo",
    nome: "Revestimento Antirreflexo",
    categoria: "modificacoes",
    subcategoria: "especiais",
    preco: 150,
    detalhe: "+2 em Furtividade (sem brilhos da lâmina).",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "especial",
      efeitos: {
        bonusFurtividade: 2,
      },
      slots: 1,
    },
  },
  {
    id: "tratamento-anticorrosao",
    nome: "Tratamento Anticorrosão",
    categoria: "modificacoes",
    subcategoria: "especiais",
    preco: 120,
    detalhe: "Ignora falhas por falta de manutenção.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "especial",
      efeitos: {
        ignoraManutencao: true,
      },
      slots: 1,
    },
  },

  // ===== FIOS E PONTAS (Corpo a Corpo) =====
  {
    id: "dupla-afiagem",
    nome: "Dupla Afiagem",
    categoria: "modificacoes",
    subcategoria: "pontas",
    preco: 300,
    detalhe: "+1 em Lutar | manutenção mais difícil (custa o dobro).",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ponta",
      efeitos: {
        bonusTesteAtaque: 1,
        custoManutencao: 2,
      },
      slots: 1,
    },
  },
  {
    id: "gume-curvo",
    nome: "Gume Curvo",
    categoria: "modificacoes",
    subcategoria: "pontas",
    preco: 280,
    detalhe: "+2 em testes de corte | –2 em testes de perfuração.",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ponta",
      efeitos: {
        bonusCorte: 2,
        penalidadePerfuracao: 2,
      },
      slots: 1,
    },
  },
  {
    id: "espigao-secundario",
    nome: "Espigão Secundário",
    categoria: "modificacoes",
    subcategoria: "pontas",
    preco: 320,
    detalhe: "Permite prender/segurar arma ou membro do inimigo (teste oposto de Força).",
    aplicavel: "arma-corpo",
    modificacao: {
      tipo: "ponta",
      efeitos: {
        prender: true,
      },
      slots: 1,
    },
  },
];