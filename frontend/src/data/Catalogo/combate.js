export const CATALOGO_COMBATE = [
  /* =========================================================
   ARMAS DE FOGO
   ========================================================= */

  {
    id: "pistola-sable",
    nome: "Pistola Sable 9mm",
    categoria: "armas-fogo",
    preco: 180,
    detalhe: "Leve, discreta e confiavel em corredores apertados.",
    entrega: "1 pente extra",

    armaStatus: {
      tipo: "Pistola",
      dmg: "3d8",
      rof: 20,
      mag: 7,
      disparosSemDesvantagem: 3,
      recarga: "Livre",
      critico: "3x8",
      danoCabeca: 45,

      hipfire: "Violência + 1d8",
      precision: "Percepção | + distância longa",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },

  {
    id: "fuzil-assalto-helena",
    nome: "Fuzil de Assalto Helena-7",
    categoria: "armas-fogo",
    preco: 460,
    detalhe: "Arma versátil para combates de média e longa distância.",
    entrega: "2 carregadores",

    armaStatus: {
      tipo: "Fuzil de Assalto",
      dmg: "3d12+3",
      rof: 20,
      mag: 30,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "3x12",
      danoCabeca: 70,

      hipfire: "Violência + 2d12",
      precision: "Percepção | + distância distante",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },

  {
    id: "escopeta-ruptura",
    nome: "Escopeta Ruptura",
    categoria: "armas-fogo",
    preco: 520,
    detalhe: "Devastadora em curta e média distância.",
    entrega: "Cartuchos reforçados",

    armaStatus: {
      tipo: "Escopeta",
      dmg: "5d10+4",
      rof: 20,
      mag: 6,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "5x10",
      danoCabeca: 120,

      hipfire: "Violência + 3d10",
      precision: "Percepção | + distância média",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },

  {
    id: "rifle-precisao-mk12",
    nome: "Rifle de Precisão MK12",
    categoria: "armas-fogo",
    preco: 690,
    detalhe: "Projetado para eliminar alvos antes que percebam o disparo.",
    entrega: "Mira de longo alcance",

    armaStatus: {
      tipo: "Rifle de Precisão",
      dmg: "4d12+4",
      rof: 20,
      mag: 30,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "3x12",
      danoCabeca: 100,

      hipfire: "Violência + 2d12",
      precision: "Percepção | + distância distante",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },

  {
    id: "arco-silencioso",
    nome: "Arco Silencioso",
    categoria: "armas-fogo",
    preco: 240,
    detalhe: "Silencioso, preciso e mortal nas mãos certas.",
    entrega: "Aljava com flechas reforçadas",

    armaStatus: {
      tipo: "Arco",
      dmg: "2d10+3",
      rof: 20,
      mag: 1,
      disparosSemDesvantagem: 2,
      recarga: "Livre",
      critico: "2x10",
      danoCabeca: 90,

      hipfire: "Violência + 1d10",
      precision: "Percepção | + distância distante",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },

   /* =========================================================
   ARMAS CORPO A CORPO
   ========================================================= */

  {
    id: "martelo-combate",
    nome: "Martelo",
    categoria: "armas-corpo",
    preco: 120,
    detalhe: "Ferramenta pesada adaptada para combate brutal.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d10+6",
      critico: "2x10",
      danoCabeca: 50,
    },
  },

  {
    id: "punhal",
    nome: "Punhal",
    categoria: "armas-corpo",
    preco: 90,
    detalhe: "Lâmina curta, discreta e fácil de ocultar.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "1d8+4",
      critico: "1x8",
      danoCabeca: 30,
    },
  },

  {
    id: "soqueira",
    nome: "Soqueira",
    categoria: "armas-corpo",
    preco: 75,
    detalhe: "Arma simples para ampliar o impacto dos golpes.",
    entrega: "Dano: 2x FOR ou DES | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d6+3",
      critico: "2x6",
      danoCabeca: 35,
    },
  },

  {
    id: "cassetete",
    nome: "Cassetete",
    categoria: "armas-corpo",
    preco: 85,
    detalhe: "Bastão curto usado para contenção e pancadas rápidas.",
    entrega: "Dano: FOR + 1 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d6+3",
      critico: "2x6",
      danoCabeca: 35,
    },
  },

  {
    id: "chicote",
    nome: "Chicote",
    categoria: "armas-corpo",
    preco: 110,
    detalhe: "Arma flexível para golpes rápidos e intimidação.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "1d8+4",
      critico: "1x8",
      danoCabeca: 30,
    },
  },

  {
    id: "espada-leve",
    nome: "Espada Leve",
    categoria: "armas-corpo",
    preco: 190,
    detalhe: "Florete afiado, veloz e preciso.",
    entrega: "Dano: FOR ou DES + 2 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d8+4",
      critico: "2x8",
      danoCabeca: 45,
    },
  },

  {
    id: "espada-media",
    nome: "Espada Média",
    categoria: "armas-corpo",
    preco: 260,
    detalhe: "Rapieira ou florete pesado, equilibrada entre alcance e dano.",
    entrega: "Dano: FOR ou DES + 3 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d10+5",
      critico: "2x10",
      danoCabeca: 55,
    },
  },

  {
    id: "espada-pesada",
    nome: "Espada Pesada",
    categoria: "armas-corpo",
    preco: 340,
    detalhe: "Sabre de cavalaria pesado, feito para cortes devastadores.",
    entrega: "Dano: FOR + 5 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d12+7",
      critico: "2x12",
      danoCabeca: 70,
    },
  },

  {
    id: "faca-pequena",
    nome: "Faca Pequena",
    categoria: "armas-corpo",
    preco: 60,
    detalhe: "Canivete ou lâmina pequena de uso rápido.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "1d6+4",
      critico: "1x6",
      danoCabeca: 30,
    },
  },

  {
    id: "faca-media",
    nome: "Faca Média",
    categoria: "armas-corpo",
    preco: 80,
    detalhe: "Faca de cozinha ou lâmina média improvisada.",
    entrega: "Dano: FOR + 3 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "1d8+5",
      critico: "1x8",
      danoCabeca: 38,
    },
  },

  {
    id: "faca-grande",
    nome: "Faca Grande",
    categoria: "armas-corpo",
    preco: 130,
    detalhe: "Facão ou lâmina grande de corte pesado.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d8+6",
      critico: "2x8",
      danoCabeca: 50,
    },
  },

  {
    id: "lanca-cavalaria",
    nome: "Lança",
    categoria: "armas-corpo",
    preco: 210,
    detalhe: "Lança de cavalaria adaptada para investidas e perfuração.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d10+6",
      critico: "2x10",
      danoCabeca: 55,
    },
  },

  {
    id: "machado-lenhador",
    nome: "Machado de Lenhador",
    categoria: "armas-corpo",
    preco: 230,
    detalhe: "Machado pesado, lento e destrutivo.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d12+6",
      critico: "2x12",
      danoCabeca: 70,
    },
  },

  {
    id: "nunchaku",
    nome: "Nunchaku",
    categoria: "armas-corpo",
    preco: 150,
    detalhe: "Arma flexível para golpes rápidos e sequenciais.",
    entrega: "Dano: FOR + 1 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d6+3",
      critico: "2x6",
      danoCabeca: 35,
    },
  },

  {
    id: "taser-3-cargas",
    nome: "Taser",
    categoria: "armas-corpo",
    preco: 180,
    detalhe: "Dispositivo elétrico de curta distância com 3 cargas.",
    entrega: "Dano: 1d6 + 4 | Alcance: Curto | 3 cargas",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d6+5",
      critico: "2x6",
      danoCabeca: 35,
    },
  },

  {
    id: "katana-militar",
    nome: "Katana Militar",
    categoria: "armas-corpo",
    preco: 420,
    detalhe: "Lâmina longa extremamente afiada para cortes precisos.",
    entrega: "Dano: FOR ou DES + 5 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "3d8+7",
      critico: "3x8",
      danoCabeca: 80,
    },
  },

  {
    id: "corrente-metalica",
    nome: "Corrente Metálica",
    categoria: "armas-corpo",
    preco: 160,
    detalhe: "Corrente pesada usada para prender e esmagar.",
    entrega: "Dano: FOR + 2 | Alcance: Curto",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d8+4",
      critico: "2x8",
      danoCabeca: 50,
    },
  },

  {
    id: "bastao-tatico",
    nome: "Bastão Tático",
    categoria: "armas-corpo",
    preco: 145,
    detalhe: "Bastão reforçado para defesa e combate urbano.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d6+4",
      critico: "2x6",
      danoCabeca: 38,
    },
  },

  {
    id: "machadinha-tatica",
    nome: "Machadinha Tática",
    categoria: "armas-corpo",
    preco: 210,
    detalhe: "Machado compacto utilizado para cortes rápidos.",
    entrega: "Dano: FOR + 3 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "2d8+5",
      critico: "2x8",
      danoCabeca: 50,
    },
  },

  {
    id: "serra-industrial",
    nome: "Serra Industrial",
    categoria: "armas-corpo",
    preco: 510,
    detalhe: "Ferramenta adaptada para destruição brutal em curta distância.",
    entrega: "Dano: FOR + 6 | Alcance: Toque",
    armaStatus: {
      tipo: "Corpo a Corpo",
      dmg: "3d10+8",
      critico: "3x10",
      danoCabeca: 90,
    },
  },

  /* =========================================================
   DEFESAS
   ========================================================= */

  {
    id: "capacete-kevlar",
    nome: "Capacete Kevlar",
    categoria: "defesas",
    preco: 320,
    detalhe: "Proteção balística leve para a cabeça.",
    entrega: "Cabeça | Defesa +5",
  },

  {
    id: "mascara-metalica",
    nome: "Máscara Metálica",
    categoria: "defesas",
    preco: 260,
    detalhe: "Máscara reforçada para impacto frontal.",
    entrega: "Cabeça | Defesa +4",
  },

  {
    id: "visor-tatico",
    nome: "Visor Tático",
    categoria: "defesas",
    preco: 210,
    detalhe: "Visor reforçado contra estilhaços.",
    entrega: "Cabeça | Defesa +3",
  },

  {
    id: "elmo-pesado",
    nome: "Elmo Pesado",
    categoria: "defesas",
    preco: 420,
    detalhe: "Elmo militar de proteção máxima.",
    entrega: "Cabeça | Defesa +7",
  },

  {
    id: "protetor-craniano",
    nome: "Protetor Craniano",
    categoria: "defesas",
    preco: 180,
    detalhe: "Blindagem improvisada para combate urbano.",
    entrega: "Cabeça | Defesa +2",
  },

  {
    id: "colete-kevlar-3",
    nome: "Colete Kevlar III",
    categoria: "defesas",
    preco: 540,
    detalhe: "Colete militar resistente contra perfuração.",
    entrega: "Torso | Defesa +8",
  },

  {
    id: "placa-ceramica-reforcada",
    nome: "Placa Cerâmica Reforçada",
    categoria: "defesas",
    preco: 460,
    detalhe: "Placas resistentes para proteção concentrada.",
    entrega: "Torso | Defesa +6",
  },

  {
    id: "blindagem-peitoral",
    nome: "Blindagem Peitoral",
    categoria: "defesas",
    preco: 610,
    detalhe: "Proteção frontal pesada.",
    entrega: "Torso | Defesa +10",
  },

  {
    id: "jaqueta-tatica",
    nome: "Jaqueta Tática",
    categoria: "defesas",
    preco: 290,
    detalhe: "Proteção leve para mobilidade.",
    entrega: "Torso | Defesa +4",
  },

  {
    id: "manto-balístico",
    nome: "Manto Balístico",
    categoria: "defesas",
    preco: 700,
    detalhe: "Blindagem experimental multicamadas.",
    entrega: "Torso | Defesa +12",
  },

  /* =========================================================
   ITENS
   ========================================================= */

  {
    id: "kit-trauma",
    nome: "Kit de Trauma",
    categoria: "itens",
    preco: 95,
    detalhe: "Curativos, torniquete, analgesicos e selante.",
    entrega: "3 usos",
  },

  {
    id: "municao-prata",
    nome: "Municao de Prata",
    categoria: "itens",
    preco: 120,
    detalhe: "Cartuchos preparados para alvos anormais.",
    entrega: "Caixa com 12",
  },

  {
    id: "rastreador-sinal",
    nome: "Rastreador de Sinal",
    categoria: "itens",
    preco: 210,
    detalhe: "Pulso curto para localizar aparelhos ativos.",
    entrega: "Bateria 6h",
  },
];
