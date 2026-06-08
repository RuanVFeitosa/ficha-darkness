export const CATEGORIAS_LOJA = [
  { id: "armas-fogo", nome: "Armas de Fogo" },
  { id: "armas-corpo", nome: "Armas Corpo a Corpo" },
  { id: "defesas", nome: "Defesas" },
  { id: "itens", nome: "Itens" },
  { id: "ritos", nome: "Ritos Absolutos" },
  { id: "poderes", nome: "Poderes Absolutos" },
];

const criarRito = (id, nome, nivelRito, preco, entrega, detalhe) => ({
  id,
  nome,
  categoria: "ritos",
  nivelRito,
  preco,
  detalhe,
  entrega,
});

const criarPoderAbsoluto = (id, nome, preco, detalhe, absolutismo) => ({
  id,
  nome,
  categoria: "poderes",
  preco,
  detalhe,
  entrega: absolutismo,
});

export const DEFAULT_CATALOGO_LOJA = [
  {
    id: "pistola-sable",
    nome: "Pistola Sable 9mm",
    categoria: "armas-fogo",
    preco: 180,
    detalhe: "Leve, discreta e confiavel em corredores apertados.",
    entrega: "1 pente extra",
    armaStatus: {
      tipo: "Pistola",
      dmg: "2d6",
      rof: 20,
      mag: 7,
      disparosSemDesvantagem: 3,
      recarga: "Livre",
      critico: "2x6",
      danoCabeca: 30,
      hipfire: "Violência + 1d6",
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
      dmg: "2d12",
      rof: 20,
      mag: 30,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "3x12",
      danoCabeca: 50,
      hipfire: "Violência + 1d12",
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
      dmg: "4d8",
      rof: 20,
      mag: 6,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "4x8",
      danoCabeca: 100,
      hipfire: "Violência + 2d8",
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
      dmg: "3d12",
      rof: 20,
      mag: 30,
      disparosSemDesvantagem: 2,
      recarga: "Preparo",
      critico: "3x12",
      danoCabeca: 50,
      hipfire: "Violência + 1d12",
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
      dmg: "1d10",
      rof: 20,
      mag: 1,
      disparosSemDesvantagem: 2,
      recarga: "Livre",
      critico: "2x10",
      danoCabeca: 100,
      hipfire: "Violência + 1d10",
      precision: "Percepção | + distância distante",
      control: "Persistência | sem penalidades",
      mobility: "Firmeza | 2 alvos",
    },
  },
  {
    id: "martelo-combate",
    nome: "Martelo",
    categoria: "armas-corpo",
    preco: 120,
    detalhe: "Ferramenta pesada adaptada para combate brutal.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
  },
  {
    id: "punhal",
    nome: "Punhal",
    categoria: "armas-corpo",
    preco: 90,
    detalhe: "Lâmina curta, discreta e fácil de ocultar.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
  },
  {
    id: "soqueira",
    nome: "Soqueira",
    categoria: "armas-corpo",
    preco: 75,
    detalhe: "Arma simples para ampliar o impacto dos golpes.",
    entrega: "Dano: 2x FOR ou DES | Alcance: Toque",
  },
  {
    id: "cassetete",
    nome: "Cassetete",
    categoria: "armas-corpo",
    preco: 85,
    detalhe: "Bastão curto usado para contenção e pancadas rápidas.",
    entrega: "Dano: FOR + 1 | Alcance: Toque",
  },
  {
    id: "chicote",
    nome: "Chicote",
    categoria: "armas-corpo",
    preco: 110,
    detalhe: "Arma flexível para golpes rápidos e intimidação.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
  },
  {
    id: "espada-leve",
    nome: "Espada Leve",
    categoria: "armas-corpo",
    preco: 190,
    detalhe: "Florete afiado, veloz e preciso.",
    entrega: "Dano: FOR ou DES + 2 | Alcance: Toque",
  },
  {
    id: "espada-media",
    nome: "Espada Média",
    categoria: "armas-corpo",
    preco: 260,
    detalhe: "Rapieira ou florete pesado, equilibrada entre alcance e dano.",
    entrega: "Dano: FOR ou DES + 3 | Alcance: Toque",
  },
  {
    id: "espada-pesada",
    nome: "Espada Pesada",
    categoria: "armas-corpo",
    preco: 340,
    detalhe: "Sabre de cavalaria pesado, feito para cortes devastadores.",
    entrega: "Dano: FOR + 5 | Alcance: Toque",
  },
  {
    id: "faca-pequena",
    nome: "Faca Pequena",
    categoria: "armas-corpo",
    preco: 60,
    detalhe: "Canivete ou lâmina pequena de uso rápido.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
  },
  {
    id: "faca-media",
    nome: "Faca Média",
    categoria: "armas-corpo",
    preco: 80,
    detalhe: "Faca de cozinha ou lâmina média improvisada.",
    entrega: "Dano: FOR + 3 | Alcance: Toque",
  },
  {
    id: "faca-grande",
    nome: "Faca Grande",
    categoria: "armas-corpo",
    preco: 130,
    detalhe: "Facão ou lâmina grande de corte pesado.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
  },
  {
    id: "lanca-cavalaria",
    nome: "Lança",
    categoria: "armas-corpo",
    preco: 210,
    detalhe: "Lança de cavalaria adaptada para investidas e perfuração.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
  },
  {
    id: "machado-lenhador",
    nome: "Machado de Lenhador",
    categoria: "armas-corpo",
    preco: 230,
    detalhe: "Machado pesado, lento e destrutivo.",
    entrega: "Dano: FOR + 4 | Alcance: Toque",
  },
  {
    id: "nunchaku",
    nome: "Nunchaku",
    categoria: "armas-corpo",
    preco: 150,
    detalhe: "Arma flexível para golpes rápidos e sequenciais.",
    entrega: "Dano: FOR + 1 | Alcance: Toque",
  },
  {
    id: "taser-3-cargas",
    nome: "Taser",
    categoria: "armas-corpo",
    preco: 180,
    detalhe: "Dispositivo elétrico de curta distância com 3 cargas.",
    entrega: "Dano: 1d6 + 4 | Alcance: Curto | 3 cargas",
  },
  {
    id: "katana-militar",
    nome: "Katana Militar",
    categoria: "armas-corpo",
    preco: 420,
    detalhe: "Lâmina longa extremamente afiada para cortes precisos.",
    entrega: "Dano: FOR ou DES + 5 | Alcance: Toque",
  },
  {
    id: "corrente-metalica",
    nome: "Corrente Metálica",
    categoria: "armas-corpo",
    preco: 160,
    detalhe: "Corrente pesada usada para prender e esmagar.",
    entrega: "Dano: FOR + 2 | Alcance: Curto",
  },
  {
    id: "bastao-tatico",
    nome: "Bastão Tático",
    categoria: "armas-corpo",
    preco: 145,
    detalhe: "Bastão reforçado para defesa e combate urbano.",
    entrega: "Dano: FOR + 2 | Alcance: Toque",
  },
  {
    id: "machadinha-tatica",
    nome: "Machadinha Tática",
    categoria: "armas-corpo",
    preco: 210,
    detalhe: "Machado compacto utilizado para cortes rápidos.",
    entrega: "Dano: FOR + 3 | Alcance: Toque",
  },
  {
    id: "serra-industrial",
    nome: "Serra Industrial",
    categoria: "armas-corpo",
    preco: 510,
    detalhe: "Ferramenta adaptada para destruição brutal em curta distância.",
    entrega: "Dano: FOR + 6 | Alcance: Toque",
  },
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
  {
    id: "bracadeira-ferro-d",
    nome: "Braçadeira de Ferro D",
    categoria: "defesas",
    preco: 140,
    detalhe: "Proteção rígida para braço dominante.",
    entrega: "Braço Direito | Defesa +3",
  },
  {
    id: "manga-tatica-d",
    nome: "Manga Tática D",
    categoria: "defesas",
    preco: 120,
    detalhe: "Tecido reforçado contra cortes.",
    entrega: "Braço Direito | Defesa +2",
  },
  {
    id: "escudo-braco-d",
    nome: "Escudo de Braço D",
    categoria: "defesas",
    preco: 240,
    detalhe: "Placa lateral para absorção de impacto.",
    entrega: "Braço Direito | Defesa +5",
  },
  {
    id: "blindagem-braco-d",
    nome: "Blindagem de Braço D",
    categoria: "defesas",
    preco: 320,
    detalhe: "Proteção militar reforçada.",
    entrega: "Braço Direito | Defesa +6",
  },
  {
    id: "protecao-articulada-d",
    nome: "Proteção Articulada D",
    categoria: "defesas",
    preco: 180,
    detalhe: "Peças móveis resistentes.",
    entrega: "Braço Direito | Defesa +4",
  },
  {
    id: "bracadeira-ferro-e",
    nome: "Braçadeira de Ferro E",
    categoria: "defesas",
    preco: 140,
    detalhe: "Proteção rígida para braço secundário.",
    entrega: "Braço Esquerdo | Defesa +3",
  },
  {
    id: "manga-tatica-e",
    nome: "Manga Tática E",
    categoria: "defesas",
    preco: 120,
    detalhe: "Tecido reforçado contra cortes.",
    entrega: "Braço Esquerdo | Defesa +2",
  },
  {
    id: "escudo-braco-e",
    nome: "Escudo de Braço E",
    categoria: "defesas",
    preco: 240,
    detalhe: "Placa lateral para absorção de impacto.",
    entrega: "Braço Esquerdo | Defesa +5",
  },
  {
    id: "blindagem-braco-e",
    nome: "Blindagem de Braço E",
    categoria: "defesas",
    preco: 320,
    detalhe: "Proteção militar reforçada.",
    entrega: "Braço Esquerdo | Defesa +6",
  },
  {
    id: "protecao-articulada-e",
    nome: "Proteção Articulada E",
    categoria: "defesas",
    preco: 180,
    detalhe: "Peças móveis resistentes.",
    entrega: "Braço Esquerdo | Defesa +4",
  },
  {
    id: "joelheira-pesada-d",
    nome: "Joelheira Pesada D",
    categoria: "defesas",
    preco: 150,
    detalhe: "Proteção reforçada para impacto.",
    entrega: "Perna Direita | Defesa +3",
  },
  {
    id: "blindagem-perna-d",
    nome: "Blindagem de Perna D",
    categoria: "defesas",
    preco: 280,
    detalhe: "Placas resistentes para combate.",
    entrega: "Perna Direita | Defesa +5",
  },
  {
    id: "greva-metalica-d",
    nome: "Greva Metálica D",
    categoria: "defesas",
    preco: 240,
    detalhe: "Proteção frontal da perna.",
    entrega: "Perna Direita | Defesa +4",
  },
  {
    id: "protetor-mobilidade-d",
    nome: "Protetor de Mobilidade D",
    categoria: "defesas",
    preco: 180,
    detalhe: "Blindagem leve para corrida.",
    entrega: "Perna Direita | Defesa +2",
  },
  {
    id: "armadura-perna-d",
    nome: "Armadura de Perna D",
    categoria: "defesas",
    preco: 360,
    detalhe: "Blindagem militar completa.",
    entrega: "Perna Direita | Defesa +6",
  },
  {
    id: "joelheira-pesada-e",
    nome: "Joelheira Pesada E",
    categoria: "defesas",
    preco: 150,
    detalhe: "Proteção reforçada para impacto.",
    entrega: "Perna Esquerda | Defesa +3",
  },
  {
    id: "blindagem-perna-e",
    nome: "Blindagem de Perna E",
    categoria: "defesas",
    preco: 280,
    detalhe: "Placas resistentes para combate.",
    entrega: "Perna Esquerda | Defesa +5",
  },
  {
    id: "greva-metalica-e",
    nome: "Greva Metálica E",
    categoria: "defesas",
    preco: 240,
    detalhe: "Proteção frontal da perna.",
    entrega: "Perna Esquerda | Defesa +4",
  },
  {
    id: "protetor-mobilidade-e",
    nome: "Protetor de Mobilidade E",
    categoria: "defesas",
    preco: 180,
    detalhe: "Blindagem leve para corrida.",
    entrega: "Perna Esquerda | Defesa +2",
  },
  {
    id: "armadura-perna-e",
    nome: "Armadura de Perna E",
    categoria: "defesas",
    preco: 360,
    detalhe: "Blindagem militar completa.",
    entrega: "Perna Esquerda | Defesa +6",
  },
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

  /* =========================================================
   I — RITOS INICIANTES
   ========================================================= */

  criarRito(
    "rito-sussurro-cinza",
    "Rito Obscuro I: Sussurro da Cinza",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Curto | DURAÇÃO: 1",
    "Abafa a voz do alvo, fazendo-o falar apenas em sussurros.",
  ),

  criarRito(
    "rito-maos-mortas",
    "Rito Obscuro I: Mãos Mortas",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Toque | DURAÇÃO: 1",
    "Torna um objeto frio e quebradiço como cadáver.",
  ),

  criarRito(
    "rito-veu-nevoa",
    "Rito Obscuro I: Véu da Névoa",
    "iniciante",
    1,
    "AÇÃO: Completa | DISTÂNCIA: Curto | DURAÇÃO: 1",
    "Cria uma névoa baixa que reduz a visão na área.",
  ),

  criarRito(
    "rito-olhos-orvalho",
    "Rito Obscuro I: Olhos do Orvalho",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Toque | DURAÇÃO: 1",
    "Concede +3 em testes visuais.",
  ),

  criarRito(
    "rito-pulso-profano",
    "Rito Obscuro I: Pulso Profano",
    "iniciante",
    1,
    "AÇÃO: Livre | DISTÂNCIA: Médio | DURAÇÃO: 1",
    "Causa +2d de dano adicional em alvo ferido.",
  ),

  criarRito(
    "rito-contar-sussurros",
    "Rito Obscuro I: Contar os Sussurros",
    "iniciante",
    1,
    "AÇÃO: Completa | DISTÂNCIA: Médio | DURAÇÃO: 1",
    "Detecta criaturas escondidas na área.",
  ),

  criarRito(
    "rito-tinta-oculta",
    "Rito Obscuro I: Tinta Oculta",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Toque | DURAÇÃO: 1",
    "Revela símbolos e mensagens ocultas.",
  ),

  criarRito(
    "rito-pesar-areal",
    "Rito Obscuro I: Pesar do Areal",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Curto | DURAÇÃO: 1",
    "Reduz a movimentação do alvo.",
  ),

  criarRito(
    "rito-voz-defunto",
    "Rito Obscuro I: Voz do Defunto",
    "iniciante",
    1,
    "AÇÃO: Completa | DISTÂNCIA: Curto | DURAÇÃO: 1",
    "Causa temor e 3d6 de dano mental.",
  ),

  criarRito(
    "rito-trinca-espiritual",
    "Rito Obscuro I: Trinca Espiritual",
    "iniciante",
    1,
    "AÇÃO: Padrão | DISTÂNCIA: Médio | DURAÇÃO: 1",
    "Enfraquece espiritualmente um objeto.",
  ),

  /* =========================================================
   II — RITOS INTERMEDIÁRIOS
   ========================================================= */

  criarRito(
    "rito-marca-ossos",
    "Rito Obscuro II: Marca dos Ossos",
    "intermediario",
    3,
    "AÇÃO: Padrão | DISTÂNCIA: Médio | DURAÇÃO: Cena",
    "Marca o alvo espiritualmente, reduzindo resistência.",
  ),

  criarRito(
    "rito-eco-profundo",
    "Rito Obscuro II: Eco Profundo",
    "intermediario",
    3,
    "AÇÃO: Completa | DISTÂNCIA: Área",
    "Amplifica vozes e ruídos, causando paranoia.",
  ),

  criarRito(
    "rito-lagrima-vigia",
    "Rito Obscuro II: Lágrima da Vigília",
    "intermediario",
    3,
    "AÇÃO: Livre | DISTÂNCIA: Pessoal",
    "Permite perceber presença sobrenatural próxima.",
  ),

  criarRito(
    "rito-passo-vazio",
    "Rito Obscuro II: Passo do Vazio",
    "intermediario",
    3,
    "AÇÃO: Movimento | DISTÂNCIA: Pessoal",
    "Silencia completamente seus passos.",
  ),

  criarRito(
    "rito-pele-luto",
    "Rito Obscuro II: Pele do Luto",
    "intermediario",
    4,
    "AÇÃO: Padrão | DISTÂNCIA: Pessoal",
    "Recebe resistência temporária a dano.",
  ),

  criarRito(
    "rito-fome-sombra",
    "Rito Obscuro II: Fome da Sombra",
    "intermediario",
    4,
    "AÇÃO: Padrão | DISTÂNCIA: Médio",
    "Sombras drenam vitalidade do alvo.",
  ),

  criarRito(
    "rito-sino-vazio",
    "Rito Obscuro II: Sino do Vazio",
    "intermediario",
    4,
    "AÇÃO: Completa | DISTÂNCIA: Área",
    "Um toque espiritual desorienta criaturas.",
  ),

  criarRito(
    "rito-nevoa-putrefata",
    "Rito Obscuro II: Névoa Putrefata",
    "intermediario",
    4,
    "AÇÃO: Completa | DISTÂNCIA: Área",
    "Cria névoa tóxica e nauseante.",
  ),

  /* =========================================================
   III — RITOS AVANÇADOS
   ========================================================= */

  criarRito(
    "rito-abismo-olhar",
    "Rito Obscuro III: Olhar do Abismo",
    "avancado",
    6,
    "AÇÃO: Completa | DISTÂNCIA: Médio",
    "O alvo encara horrores invisíveis e sofre dano mental severo.",
  ),

  criarRito(
    "rito-maos-lamentos",
    "Rito Obscuro III: Mãos dos Lamentos",
    "avancado",
    6,
    "AÇÃO: Padrão | DISTÂNCIA: Área",
    "Mãos espectrais agarram inimigos.",
  ),

  criarRito(
    "rito-ceu-cinzento",
    "Rito Obscuro III: Céu Cinzento",
    "avancado",
    7,
    "AÇÃO: Completa | DISTÂNCIA: Área grande",
    "Escurece a área e reduz drasticamente visão.",
  ),

  criarRito(
    "rito-selo-agonia",
    "Rito Obscuro III: Selo da Agonia",
    "avancado",
    7,
    "AÇÃO: Padrão | DISTÂNCIA: Toque",
    "Amplifica dor física e mental.",
  ),

  criarRito(
    "rito-sombra-profeta",
    "Rito Obscuro III: Sombra do Profeta",
    "avancado",
    8,
    "AÇÃO: Livre | DISTÂNCIA: Pessoal",
    "Permite prever movimentos imediatos.",
  ),

  criarRito(
    "rito-rasgo-realidade",
    "Rito Obscuro III: Rasgo da Realidade",
    "avancado",
    8,
    "AÇÃO: Completa | DISTÂNCIA: Médio",
    "Abre pequena ruptura espiritual instável.",
  ),

  /* =========================================================
   IV — RITOS EXPERIENTES
   ========================================================= */

  criarRito(
    "rito-trono-cinzas",
    "Rito Obscuro IV: Trono das Cinzas",
    "experiente",
    10,
    "AÇÃO: Completa | DISTÂNCIA: Área enorme",
    "Conjura domínio ritualístico repleto de cinzas.",
  ),

  criarRito(
    "rito-coracao-vazio",
    "Rito Obscuro IV: Coração do Vazio",
    "experiente",
    10,
    "AÇÃO: Padrão | DISTÂNCIA: Médio",
    "Remove emoções do alvo temporariamente.",
  ),

  criarRito(
    "rito-devorar-luz",
    "Rito Obscuro IV: Devorar a Luz",
    "experiente",
    12,
    "AÇÃO: Completa | DISTÂNCIA: Área",
    "Apaga todas as fontes de luz da área.",
  ),

  criarRito(
    "rito-funeral-eterno",
    "Rito Obscuro IV: Funeral Eterno",
    "experiente",
    12,
    "AÇÃO: Completa | DISTÂNCIA: Área",
    "Impõe silêncio absoluto e temor esmagador.",
  ),

  criarRito(
    "rito-olhos-absoluto",
    "Rito Obscuro IV: Olhos do Absoluto",
    "experiente",
    15,
    "AÇÃO: Livre | DISTÂNCIA: Pessoal",
    "Permite enxergar manifestações espirituais e mentais.",
  ),

  criarRito(
    "rito-fim-peregrino",
    "Rito Obscuro IV: Fim do Peregrino",
    "experiente",
    15,
    "AÇÃO: Completa | DISTÂNCIA: Médio",
    "Uma sentença espiritual destrutiva contra um alvo.",
  ),

  criarPoderAbsoluto(
    "poder-passos-cacador-noturno",
    "Passos do Caçador Noturno",
    5,
    "Recebe +2 em Furtividade e pode usar Furtividade no lugar de Velocidade para escalar superfícies lentamente.",
    "Absolutismo: bônus aumenta para +4. Pode passar por espaços ocupados por criaturas menores ou iguais sem provocar ataques de oportunidade com teste de Furtividade CD 15.",
  ),

  criarPoderAbsoluto(
    "poder-reflexos-presa-consciente",
    "Reflexos da Presa Consciente",
    5,
    "Contra ataques surpresa ou armadilhas que permitam teste de Velocidade para reduzir dano, rola com vantagem.",
    "Absolutismo: se passar no teste original, não sofre dano. Nunca fica Desprevenido contra ataques à distância.",
  ),

  criarPoderAbsoluto(
    "poder-ritmo-martelo-bigorna",
    "Ritmo do Martelo e da Bigorna",
    5,
    "Ao usar Ataque Total, não sofre -5 na Defesa. Ao usar Bloquear, pode fazer um ataque como ação livre.",
    "Absolutismo: ao Bloquear, concede cobertura +2 Defesa a um aliado adjacente.",
  ),

  criarPoderAbsoluto(
    "poder-empuxo-telecinetico",
    "Empuxo Telecinético Latente",
    5,
    "Como ação de movimento, empurra objeto ou criatura de até 50kg em alcance curto por 1,5m. Teste de Força CD 12 resiste.",
    "Absolutismo: peso 100kg, distância 3m, CD 15. Também pode puxar objetos leves para sua mão.",
  ),

  criarPoderAbsoluto(
    "poder-absolutismo-substancia",
    "Absolutismo com a Substância",
    5,
    "Rola com vantagem para perceber fraquezas de objetos ou identificar composição básica de substâncias.",
    "Absolutismo: armas corpo a corpo causam +1 contra objetos e construções. Sabe a CD exata para arrombar ou quebrar objetos.",
  ),

  criarPoderAbsoluto(
    "poder-sutura-vontade",
    "Sutura da Vontade",
    5,
    "1x por cena, ao cair a 0 PV ou menos, pode gastar 2 PE para ficar com 1 PV.",
    "Absolutismo: também ganha Resistência 5 a dano Cortante, Perfurante ou Impactante até o fim da cena.",
  ),

  criarPoderAbsoluto(
    "poder-mente-analitica",
    "Mente Analítica",
    5,
    "Em investigação, pode fazer uma pergunta extra ao Mestre por sucesso em Investigação ou Percepção.",
    "Absolutismo: não sofre penalidade por distração ou pressão de tempo em testes de Inteligência fora de combate. Tem vantagem para notar detalhes escondidos ou falsificações.",
  ),

  criarPoderAbsoluto(
    "poder-eco-ameaca",
    "Eco de Ameaça",
    5,
    "Hostis em alcance curto com menos PV máximos que você sofrem -1 em ataques contra você.",
    "Absolutismo: penalidade vira -2 e alcance médio. Aliados em alcance curto ganham +1 contra medo.",
  ),

  criarPoderAbsoluto(
    "poder-troca-sorte",
    "Troca de Sorte",
    5,
    "Quando aliado em alcance médio obtém crítico, você pode armazenar essa sorte e usar um dado igual em seu próximo teste.",
    "Absolutismo: pode armazenar até duas cargas de sorte.",
  ),

  criarPoderAbsoluto(
    "poder-calculo-trajetoria",
    "Cálculo da Trajetória",
    5,
    "Recebe +2 em ataques à distância contra alvos elevados ou em movimento complexo.",
    "Absolutismo: bônus vira +4 e ignora cobertura parcial.",
  ),
  criarPoderAbsoluto(
    "poder-silencio-sentidos",
    "Silêncio dos Sentidos",
    5,
    "Ao se esconder, testes de Percepção para encontrá-lo por audição ou olfato sofrem desvantagem.",
    "Absolutismo: sentidos especiais, como visão no escuro ou ecolocalização, também sofrem desvantagem para encontrá-lo.",
  ),

  criarPoderAbsoluto(
    "poder-alquimia-corporal-basica",
    "Alquimia Corporal Básica",
    5,
    "Como ação completa, concede a si mesmo por 1 minuto: vantagem em Força, vantagem em Fortitude ou resistência a Fogo, Frio, Elétrico ou Ácido. Sofre 1d8 de dano de Sanidade.",
    "Absolutismo: escolhe duas condições em vez de uma. O dano de Sanidade reduz para 1d4.",
  ),

  criarPoderAbsoluto(
    "poder-marca-fraqueza",
    "Marca da Fraqueza",
    5,
    "Como ação de movimento, marca uma criatura em alcance curto. O próximo ataque contra ela causa +1d4 de dano.",
    "Absolutismo: dano aumenta para +1d6 e a marca dura até ser consumida.",
  ),

  criarPoderAbsoluto(
    "poder-economia-movimento",
    "Economia de Movimento",
    5,
    "Se mover pelo menos metade do deslocamento no turno, ganha +1 na Defesa até o início do próximo turno.",
    "Absolutismo: se usar toda ação de movimento para se deslocar, ganha +2 em Velocidade até o início do próximo turno.",
  ),

  criarPoderAbsoluto(
    "poder-pulsar-energetico",
    "Pulsar Energético",
    5,
    "Como ação padrão, criaturas em alcance curto fazem Fortitude CD 12. Em falha, são empurradas 1,5m e ficam Abaladas por uma rodada.",
    "Absolutismo: CD 15, empurrão 3m e você pode escolher até três criaturas para não serem afetadas.",
  ),

  criarPoderAbsoluto(
    "poder-foco-adrenalina",
    "Foco de Adrenalina",
    5,
    "Quando sofre dano, recebe +1 em ataques e testes de Força, Reflexos ou Fortitude até o fim do próximo turno, acumulando até +3.",
    "Absolutismo: bônus máximo +5. Enquanto ativo, ignora os efeitos de Incapacitado.",
  ),

  criarPoderAbsoluto(
    "poder-ancoragem-temporal",
    "Ancoragem Temporal",
    5,
    "Tem vantagem contra efeitos de lentidão, paralisia temporal ou envelhecimento acelerado.",
    "Absolutismo: 1x por dia, pode estender essa resistência a um aliado adjacente.",
  ),

  criarPoderAbsoluto(
    "poder-transfusao-esforco",
    "Transfusão de Esforço",
    5,
    "Como ação padrão, tocando um aliado, transfere até metade dos seus PI atuais para ele. Você sofre esse dano e o aliado cura igual.",
    "Absolutismo: dano sofrido é reduzido pela metade. Pode fazer como ação de movimento, mas o custo em PI dobra.",
  ),

  criarPoderAbsoluto(
    "poder-sussurro-dispersao",
    "Sussurro da Dispersão",
    5,
    "Ao sofrer dano corpo a corpo, pode usar reação para reduzir o dano em 1d6 + modificador de Reflexos.",
    "Absolutismo: redução aumenta para 1d8 + Reflexos e também funciona contra projéteis físicos.",
  ),

  criarPoderAbsoluto(
    "poder-intuicao-campo-batalha",
    "Intuição do Campo de Batalha",
    5,
    "Você não pode ser flanqueado. 1x por rodada, quando um inimigo sair de um espaço adjacente, pode fazer ataque de oportunidade mesmo se já usou reação.",
    "Absolutismo: ataque de oportunidade causa +1d6 de dano extra.",
  ),

  criarPoderAbsoluto(
    "poder-reflexo-escudo",
    "Reflexo de Escudo",
    5,
    "Com escudo ou arma Defensiva, pode usar reação para impor desvantagem em um ataque contra aliado adjacente.",
    "Absolutismo: se o ataque errar por essa desvantagem, você pode fazer ataque de oportunidade contra o agressor.",
  ),

  criarPoderAbsoluto(
    "poder-alquimia-mental",
    "Alquimia Mental",
    5,
    "Quando fica Abalado, Amedrontado ou Enfraquecido, pode remover a condição como ação livre no início do turno e ganhar 2 PE temporários até o fim da cena.",
    "Absolutismo: também pode remover essas condições de aliado adjacente e ganhar os PE temporários.",
  ),
];

export const normalizarItemLoja = (item, index = 0) => {
  const nome = String(item?.nome || "").trim();

  const categoriaValida = CATEGORIAS_LOJA.some(
    (categoria) => categoria.id === item?.categoria,
  );

  return {
    id:
      String(item?.id || nome || `item-${Date.now()}-${index}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `item-${index}`,

    nome: nome || "Item sem nome",

    categoria: categoriaValida ? item.categoria : "itens",

    preco: Math.max(0, parseInt(item?.preco, 10) || 0),

    detalhe: String(item?.detalhe || "").trim(),

    entrega: String(item?.entrega || "").trim(),

    armaStatus: item?.armaStatus || null,

    // ADICIONE ISSO:
    nivelRito: String(item?.nivelRito || "").trim(),
  };
};
