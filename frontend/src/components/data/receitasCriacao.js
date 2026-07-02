export const receitasCriacao = [
  {
    categoria: "Armas Aprimoráveis",

    itens: [
      {
        nome: "Pedaço de Madeira",
        icone: "🪵",
        tipo: "Aprimorável",
        durabilidade: "🇴 🇴 🇴",
        dano: "1d6",
        ingredientes: [],
      },

      {
        nome: "Pedaço de Madeira com Pregos",
        icone: "🪵",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 ▭",
        dano: "6d6",
        ingredientes: [
          { nome: "3x Pregos", icone: "📌" },
          { nome: "Fita adesiva", icone: "🩹" },
          { nome: "Pedaço de Madeira", icone: "🪵" },
        ],
      },

      {
        nome: "Pedaço de Madeira Reforçado",
        icone: "🪵",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 ▭ ▭",
        dano: "2d6",
        ingredientes: [
          { nome: "2x Pregos", icone: "📌" },
          { nome: "Pedaço de Madeira", icone: "🪵" },
        ],
      },

      {
        nome: "Pedaço de Madeira Afiado",
        icone: "🪵",
        tipo: "Permanente",
        durabilidade: "🇴 🇴",
        dano: "10d6",
        ingredientes: [
          { nome: "Faca", icone: "🔪" },
          { nome: "Pedaço de Madeira", icone: "🪵" },
        ],
      },

      {
        nome: "Pedaço de Cano",
        icone: "🔩",
        tipo: "Aprimorável",
        durabilidade: "🇴 🇴 🇴 🇴 🇴",
        dano: "3d6",
        ingredientes: [],
      },

      {
        nome: "Pedaço de Cano com Metais Afiados",
        icone: "🔩",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 🇴 🇴 ▭",
        dano: "6d6",
        ingredientes: [
          { nome: "3x Pregos", icone: "📌" },
          { nome: "Fita adesiva", icone: "🩹" },
          { nome: "Pedaço de Cano", icone: "🔩" },
        ],
      },

      {
        nome: "Pedaço de Cano Reforçado",
        icone: "🔩",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 🇴 🇴 ▭ ▭",
        dano: "2d6",
        ingredientes: [
          { nome: "2x Pregos", icone: "📌" },
          { nome: "Pedaço de Cano", icone: "🔩" },
        ],
      },

      {
        nome: "Pedaço de Cano Afiado",
        icone: "🔩",
        tipo: "Permanente",
        durabilidade: "🇴 🇴",
        dano: "3d12",
        ingredientes: [
          { nome: "Cano Quebrado", icone: "🔩" },
          { nome: "Faca", icone: "🔪" },
        ],
      },

      {
        nome: "Pé de Cabra",
        icone: "🛠️",
        tipo: "Aprimorável",
        durabilidade: "🇴 🇴 🇴 🇴 🇴 🇴 🇴 🇴 🇴 🇴",
        dano: "6d6",
        ingredientes: [],
      },

      {
        nome: "Pé de Cabra com Pregos",
        icone: "🛠️",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 🇴 🇴 🇴 🇴 🇴 ▭",
        dano: "10d6",
        ingredientes: [
          { nome: "3x Pregos", icone: "📌" },
          { nome: "Fita adesiva", icone: "🩹" },
          { nome: "Pé de Cabra", icone: "🛠️" },
        ],
      },

      {
        nome: "Pé de Cabra Reforçado",
        icone: "🛠️",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 ▭ ▭",
        dano: "5d6",
        ingredientes: [
          { nome: "2x Pregos", icone: "📌" },
          { nome: "Pé de Cabra", icone: "🛠️" },
        ],
      },

      {
        nome: "Pé de Cabra Afiado",
        icone: "🛠️",
        tipo: "Permanente",
        durabilidade: "🇴 🇴 🇴",
        dano: "5d12",
        ingredientes: [
          { nome: "Faca", icone: "🔪" },
          { nome: "Pé de Cabra", icone: "🛠️" },
        ],
      },

      {
        nome: "Martelo",
        icone: "🔨",
        tipo: "Aprimorável",
        durabilidade: "🇴 🇴 🇴 🇴 🇴",
        dano: "6d6+6",
        ingredientes: [],
      },

      {
        nome: "Martelo com Pregos",
        icone: "🔨",
        tipo: "Temporário",
        durabilidade: "🇴 🇴 🇴 🇴 🇴 🇴 🇴 🇴 ▭",
        dano: "10d6",
        ingredientes: [
          { nome: "3x Pregos", icone: "📌" },
          { nome: "Fita adesiva", icone: "🩹" },
          { nome: "Martelo", icone: "🔨" },
        ],
      },
    ],
  },

  {
    categoria: "Itens Improvisados",

    itens: [
      {
        nome: "Kit Médico",
        icone: "🩺",

        tipo: "Cura/Tratamento",

        usos: "⧬ ⧬ ⧬ ⧬ ⧬ ⧬ ⧬ ⧬",

        durabilidade: "—",

        efeito: "Recupera 1d6 de integridade em um membro.",

        ingredientes: [
          { nome: "3x Álcool", icone: "🧪" },
          { nome: "4x Trapos", icone: "🧻" },
        ],
      },

      {
        nome: "Molotov",
        icone: "🔥",
        tipo: "Usos: ⧬",
        durabilidade: "—",
        dano: "Incendiário",
        ingredientes: [
          { nome: "5x Álcool", icone: "🧪" },
          { nome: "2x Trapos", icone: "🧻" },
        ],
      },

      {
        nome: "Bomba de Fumaça",
        icone: "💨",
        tipo: "Usos: ⧬",
        durabilidade: "—",
        dano: "Controle de Área",
        ingredientes: [
          { nome: "Recipiente", icone: "🫙" },
          { nome: "3x Explosivos", icone: "💣" },
        ],
      },

      {
        nome: "Armadilha de Mina",
        icone: "💣",
        tipo: "Usos: ⧬",
        durabilidade: "—",
        dano: "Explosivo",
        ingredientes: [
          { nome: "Recipiente", icone: "🫙" },
          { nome: "5x Explosivos", icone: "💣" },
        ],
      },

      {
        nome: "Canivete",
        icone: "🔪",
        tipo: "Usos: ⧬ ⧬ ⧬ ⧬",
        durabilidade: "—",
        dano: "Corte leve",
        ingredientes: [
          { nome: "2x Fita", icone: "🩹" },
          { nome: "Lâmina", icone: "🗡️" },
        ],
      },
    ],
  },

  {
    categoria: "Munições Fabricadas",
    itens: [
      {
        nome: "Munição Explosiva",
        icone: "💥",
        tipo: "Quantidade: ⧭ ⧭ ⧭ ⧭",
        durabilidade: "—",
        dano: "2d8", // 🔥 antes era "Explosivo"
        ingredientes: [
          { nome: "2x Álcool", icone: "🧪" },
          { nome: "4x Explosivo", icone: "💣" },
        ],
      },
      {
        nome: "Munição Ácida",
        icone: "☣️",
        tipo: "Quantidade: ⧭ ⧭",
        durabilidade: "—",
        dano: "10d4", // antes "Ácido"
        ingredientes: [
          { nome: "6x Álcool", icone: "🧪" },
          { nome: "2x Explosivo", icone: "💣" },
        ],
      },
      {
        nome: "Munição Incendiária",
        icone: "🔥",
        tipo: "Quantidade: ⧭ ⧭",
        durabilidade: "—",
        dano: "2d8", // antes "Fogo"
        ingredientes: [
          { nome: "4x Álcool", icone: "🧪" },
          { nome: "4x Explosivo", icone: "💣" },
        ],
      },
      {
        nome: "Munição Sonífera",
        icone: "🌙",
        tipo: "Quantidade: ⧭",
        durabilidade: "—",
        dano: "1d4", // antes "Sono"
        ingredientes: [
          { nome: "6x Álcool", icone: "🧪" },
          { nome: "6x Explosivo", icone: "💣" },
        ],
      },
      {
        nome: "Flechas",
        icone: "🏹",
        tipo: "Quantidade: ⧭ ⧭ ⧭ ⧭",
        durabilidade: "—",
        dano: "1d6", // antes "Perfuração"
        ingredientes: [
          { nome: "1x Fita", icone: "🩹" },
          { nome: "1x Lâmina", icone: "🗡️" },
        ],
      },
    ],
  },
];
