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
      descricao: "Ao gastar um Turno de Preparo, voce concentra poder destrutivo em seus membros. Ate o fim do turno, seus ataques desarmados causam dano maximo em um dos dados. No nivel 8, pode ser usado como acao livre 1 vez por cena.",
    },
    {
      id: "impacto-aterrorizante",
      nome: "Impacto Aterrorizante",
      descricao: "Quando acerta um ataque desarmado, pode gastar uma reacao para tentar amedrontar o alvo. Se falhar, o alvo fica abalado por 1d6 rodadas. No nivel 6, vira panico contra inimigos de NV menor.",
    },
    {
      id: "furia-exterminador",
      nome: "Furia do Exterminador",
      descricao: "Ao reduzir um inimigo a 0 PV, recebe +2 em acerto e dano corpo a corpo ate o fim do combate, acumulando ate +6. No nivel 10, cada pilha reduz a resistencia a dano do alvo em 5.",
    },
    {
      id: "aniquilacao-total",
      nome: "Aniquilacao Total",
      descricao: "Uma vez por dia, ao acertar um ataque desarmado, role o dano e multiplique o resultado por 10. Se reduzir o alvo a 0 PV, pode fazer um novo ataque normal. A partir do nivel 10, pode usar 2 vezes por dia.",
    },
  ],
  bases: [
    {
      id: "sentenca-executada",
      nome: "Sentenca Executada",
      descricao: "Ao atacar um alvo culpado de crime violento ou fugitivo da justica, ignora 5 pontos de Defesa e resistencia fisica. Pode usar Forca para interrogatorios intimidatorios.",
    },
    {
      id: "predador-alfa",
      nome: "Predador Alfa",
      descricao: "Ao cacar uma criatura ou ameaca humana em territorio natural ou estudado, recebe +3D em Sobrevivencia para rastrear e em Violencia no primeiro ataque surpresa. Identifica instintivamente o membro mais perigoso de um grupo.",
    },
    {
      id: "impenetravel",
      nome: "Impenetravel",
      descricao: "Ao defender um ponto especifico e nao se mover no turno, sua Defesa aumenta em +2 contra corpo a corpo. Recebe vantagem em Fortitude para resistir a efeitos que tentem move-lo ou derruba-lo.",
    },
  ],
  aptidoes: [
    { id: "golpe-sem-misericordia", nome: "Golpe Sem Misericordia", custo: "10 PE", descricao: "Uma vez por cena, caso o alvo esteja na metade de PI de membro critico, transforme um ataque em execucao, podendo desmembrar um membro de inimigos comuns." },
    { id: "corpo-como-arma", nome: "Corpo como Arma", custo: "5 PE", descricao: "Uma vez por combate, cause dano massivo ignorando armadura ao alvo agarrado." },
    { id: "tanque-apocalipse", nome: "Tanque do Apocalipse", custo: "Passiva", descricao: "Pontos de Integridade do corpo contem 20 PIs negativos. Caso zere PIs positivos, tera +20 pontos antes de morrer." },
    { id: "encarar-morte", nome: "Encarar a Morte", custo: "10 PE", descricao: "Uma vez por sessao, ignora completamente um efeito ou dano que o mataria." },
    { id: "indomavel", nome: "Indomavel", custo: "Passiva", descricao: "Ganha resistencia a um tipo de dano a sua escolha. Em interludio, pode treinar para trocar esse tipo de resistencia." },
    { id: "investida-esmagadora", nome: "Investida Esmagadora", custo: "2 PE", descricao: "Como acao de movimento aprimorada, avanca em linha reta, ignora obstaculos menores e faz ataque corpo a corpo. Se acertar, empurra o alvo e pode derruba-lo." },
    { id: "ponto-pressao", nome: "Ponto de Pressao", custo: "4 PE", descricao: "Ao acertar ataque corpo a corpo, ignora temporariamente resistencia a dano do alvo. Se nao houver resistencia, causa +1d6 contundente." },
    { id: "postura-inquebravel", nome: "Postura Inquebravel", custo: "3 PE - Reacao", descricao: "Ao ser atingido corpo a corpo, reduz dano em 1d6 + mod Fortitude. Se zerar o dano, faz ataque de oportunidade imediato." },
    { id: "aura-dano", nome: "Aura de Dano", custo: "1 PE/rodada", descricao: "Emana aura de dor em 3m. Inimigos que comecarem o turno na aura testam Fortitude; se falharem, sofrem 1d4 e -2 em concentracao ou precisao fina." },
    { id: "rompe-defesas", nome: "Rompe Defesas", custo: "2 PE", descricao: "Ao acertar ataque corpo a corpo, reduz Defesa do alvo em -2 contra o proximo ataque ate o final do proximo turno." },
    { id: "recuperacao-rapida", nome: "Recuperacao Rapida", custo: "Passiva", descricao: "Uma vez por cena, quando sua Sanidade cair abaixo de 50%, recupera Integridade igual ao nivel + mod Fortitude como acao livre." },
    { id: "agarrao-esmagador", nome: "Agarrao Esmagador", custo: "4 PE", descricao: "Ao agarrar com sucesso, o alvo sofre 1d6 contundente no inicio de seus turnos enquanto voce mantiver o agarramento, e voce ganha +2 para mante-lo." },
    { id: "foco-dor", nome: "Foco na Dor", custo: "1 PE - Reacao", descricao: "Quando um inimigo ao alcance de movimento sofre dano, move-se ate metade do deslocamento em direcao a ele e ganha +2 no proximo ataque contra esse alvo." },
    { id: "passo-inabalavel", nome: "Passo Inabalavel", custo: "Passiva", descricao: "Imune a empurrar, derrubar, agarrar e puxar forcados. Terreno dificil nao reduz seu deslocamento." },
    { id: "contra-ataque-devastador", nome: "Contra-Ataque Devastador", custo: "3 PE - Reacao", descricao: "Quando um ataque corpo a corpo erra voce, pode contra-atacar. Se acertar, causa +1d8 de dano adicional." },
    { id: "quebra-ritmo", nome: "Quebra de Ritmo", custo: "2 PE", descricao: "Ao acertar ataque, forca teste de Vontade contra Forca. Se falhar, o alvo nao pode usar habilidades ativas ou poderes de acao padrao no proximo turno." },
    { id: "vigor-batalha", nome: "Vigor da Batalha", custo: "Passiva", descricao: "No terceiro turno consecutivo de combate, ganha +1 em ataques e dano corpo a corpo. Aumenta para +2 a partir do sexto turno." },
    { id: "investida-poderosa", nome: "Investida Poderosa", custo: "4 PE", descricao: "Como acao completa, move-se em linha reta e faz ataque unico com +2. Se acertar, causa dano normal +2d6." },
    { id: "pele-aco", nome: "Pele de Aco", custo: "3 PE - Reacao", descricao: "Ao ser atingido, ganha resistencia igual ao mod Forca contra um tipo de dano daquele ataque ate o inicio de seu proximo turno." },
    { id: "sinal-aniquilacao", nome: "Sinal de Aniquilacao", custo: "5 PE", descricao: "Marca um inimigo por 1 rodada. Ataques corpo a corpo contra ele causam +1d12. Se o alvo morrer, pode marcar outro como acao livre." },
    { id: "golpe-desestabilizador", nome: "Golpe Desestabilizador", custo: "1 PE", descricao: "Ao acertar ataque corpo a corpo, reduz o deslocamento do alvo pela metade por 1d4 rodadas." },
    { id: "furia-contida", nome: "Furia Contida", custo: "Passiva", descricao: "Quando ataca corpo a corpo sem usar aptidao de PE, ganha 1 Furia, maximo 3. Gaste 2 para +1d6 ou 3 para transformar acerto normal em critico." },
    { id: "olho-furacao", nome: "Olho do Furacao", custo: "2 PE - Movimento", descricao: "Ate o inicio do proximo turno, nao sofre flanqueamento e pode usar Reacao para aplicar -2 no ataque de um inimigo." },
  ],
  especialidades: [
    {
      id: "pugilista",
      nome: "O Pugilista",
      passiva: "Dano desarmado padrao: 3d6.",
      habilidades: [
        { id: "ataque-preciso", nivel: "I", nome: "Ataque Preciso", descricao: "Faca ataque corpo a corpo com +2. Se acertar, adiciona metade do mod Violencia ao dano e ignora metade da Reducao de Dano." },
        { id: "esquivo-ataco", nivel: "II", nome: "Esquivo e Ataco", descricao: "Use Preparo para +2 Defesa contra ataque visivel. Se o inimigo errar, pode gastar Turno de Acao para atacar com +2." },
        { id: "mestre-artes-marciais", nivel: "III", nome: "Mestre das Artes Marciais", descricao: "Ganha +2D em dano desarmado e, gastando 5 PE, aumenta a margem de ameaca em +1." },
        { id: "meditacao-combate", nivel: "IV", nome: "Meditacao de Combate", descricao: "Ganha 1 ficha por critico. Uma vez por cena, concentra-se: perde Defesa por ficha e ganha +5 dano desarmado por ficha, limite 5." },
        { id: "mestre-marcial", nivel: "V", nome: "Mestre Marcial", descricao: "Pode sacrificar uma aptidao para aumentar margem de ameaca em +3 e receber +2d dano em golpe corpo a corpo." },
      ],
    },
    {
      id: "muralha-indomavel",
      nome: "Muralha Indomavel",
      passiva: "Especialidade defensiva voltada a reacoes, defesa e permanencia em pe.",
      habilidades: [
        { id: "esquiva-tatica", nivel: "I", nome: "Esquiva Tatica", descricao: "1x por rodada, ao sofrer ataque corpo a corpo, rola Reflexos. Se superar o adversario, evita totalmente o ataque como reacao." },
        { id: "parada-resposta", nivel: "II", nome: "Parada e Resposta", descricao: "Quando atacado, gasta reacao e rola Ataque. Se vencer, reduz dano pela metade e pode contra-atacar em situacoes favoraveis." },
        { id: "fortaleza-total", nivel: "III", nome: "Fortaleza Total", descricao: "+2 em testes contra dano mental e fisico, imunidade a medo e teste de resistencia contra outros efeitos negativos." },
        { id: "postura-baluarte", nivel: "IV", nome: "Postura de Baluarte", descricao: "Ao usar Esquiva, rola Reflexos e recebe +3 Defesa ate o proximo turno. Apos parry bem-sucedido, pode tentar desarmar." },
        { id: "defesa-absoluta", nivel: "V", nome: "Defesa Absoluta", descricao: "1x por combate, declara que um ataque erra automaticamente. Uma vez por cena, ao entrar Morrendo, teste DT15 para ficar com 1 PV." },
      ],
    },
    {
      id: "guerreiro-armas-duplas",
      nome: "Guerreiro de Armas Duplas",
      passiva: "Especialidade agressiva para duas armas e contra-ataques.",
      habilidades: [
        { id: "armas-especificas", nivel: "I", nome: "Armas Especificas", descricao: "Escolha uma arma especifica. Ganha +2 em ataque e dano com ela. Com uma arma em cada mao, nao sofre penalidades nos ataques secundarios." },
        { id: "armas-improvisadas", nivel: "II", nome: "Armas Improvisadas", descricao: "Pode usar objetos como armas improvisadas: -2 no ataque, dano 1d6 + Forca. Acao bonus para encontrar uma arma improvisada." },
        { id: "especialista-dual", nivel: "III", nome: "Especialista em Dual", descricao: "Nao sofre penalidades e pode fazer um ataque adicional com a arma secundaria como parte da acao de ataque." },
        { id: "acougueiro-machado", nivel: "IV", nome: "Acougueiro de Machado de Batalha", descricao: "Criticos forcao resistencia; se falhar, o inimigo fica atordoado e sangrando." },
        { id: "extrema-agressividade", nivel: "V", nome: "Extrema Agressividade", descricao: "+5 em ataque e dano corpo a corpo. Se inimigo errar corpo a corpo, pode reagir atacando. Ao critar, faz dois ataques extras." },
      ],
    },
    {
      id: "rompe-muralhas",
      nome: "Rompe-Muralhas",
      passiva: "Especialidade para romper objetos, armaduras, barreiras e formacoes.",
      habilidades: [
        { id: "golpe-demolidor", nivel: "I", nome: "Golpe Demolidor", descricao: "Rola Forca e ignora resistencia de objetos e armaduras. Contra armadura, reduz Defesa em -2 ate ser reparada." },
        { id: "investida-imparavel", nivel: "II", nome: "Investida Imparavel", descricao: "Acao completa em linha reta. Rola Forca contra inimigos no caminho; quem falhar cai e sofre dano. Nao provoca ataques de oportunidade." },
        { id: "ondas-choque", nivel: "III", nome: "Ondas de Choque", descricao: "Golpeia chao ou ar com arma. Inimigos em alcance curto sofrem dano, metade se passarem em Fortitude. Objetos frageis proximos sao destruidos." },
        { id: "romper-formacoes", nivel: "IV", nome: "Romper Formacoes", descricao: "Para cada inimigo adjacente, ganha +1 dano, max +5. Se intimidacao resultar 12+, inimigos em area media ficam abalados por 1 rodada." },
        { id: "colosso-incontrolavel", nivel: "V", nome: "Colosso Incontrolavel", descricao: "Ignora terreno dificil e efeitos que reduzem deslocamento. 1x por cena, atravessa barreira fisica como movimento; inimigos do outro lado sofrem dano igual a Forca base." },
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
  const arvore = obterArvoreClasse(personagem);
  const escolhas = personagem.habilidadesClasse || {};
  const selecionadas = [];

  const absoluta = arvore.absolutas.find(
    (habilidade) => habilidade.id === escolhas.habilidadeAbsoluta,
  );

  if (absoluta) {
    selecionadas.push({ ...absoluta, grupo: "Habilidade Absoluta" });
  }

  arvore.bases.forEach((habilidade) => {
    selecionadas.push({ ...habilidade, grupo: "Classe" });
  });

  arvore.aptidoes
    .filter((aptidao) => escolhas.aptidoes?.[aptidao.id])
    .forEach((aptidao) => {
      selecionadas.push({ ...aptidao, grupo: aptidao.custo || "Aptidao" });
    });

  const especialidade = arvore.especialidades.find(
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

  especialidade?.habilidades
    .filter((habilidade) => escolhas.habilidadesEspecialidade?.[habilidade.id])
    .forEach((habilidade) => {
      selecionadas.push({
        ...habilidade,
        grupo: `Nivel ${habilidade.nivel}`,
      });
    });

  return selecionadas;
};
