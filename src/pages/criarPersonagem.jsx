import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountPlus, mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import { criarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import { estadoInicial } from "./fichaPersonagem";
import "../CSS/CriarPersonagem.css";

const STORAGE_KEY = "fichaRPG_personagem";

const atributos = [
  { chave: "forca", nome: "Forca" },
  { chave: "fonitude", nome: "Fortitude" },
  { chave: "inteligencia", nome: "Inteligencia" },
  { chave: "reflexos", nome: "Reflexos" },
  { chave: "vontade", nome: "Vontade" },
];

const membrosIntegridade = [
  { chave: "cabeca", nome: "Cabeca" },
  { chave: "torso", nome: "Torso" },
  { chave: "bracoDireito", nome: "Braco direito" },
  { chave: "bracoEsquerdo", nome: "Braco esquerdo" },
  { chave: "pernaDireita", nome: "Perna direita" },
  { chave: "pernaEsquerda", nome: "Perna esquerda" },
];

const classesPersonagem = [
  {
    id: "aniquilador",
    nome: "Aniquilidador",
    imagem: "/classes/aniquilador.png",
    sanidadeBase: 30,
    sanidadeNivel: "7 SAN (+mod Fort)",
    esperancaBase: 10,
    esperancaNivel: "5 PE (+mod VON)",
  },
  {
    id: "especialista",
    nome: "Especialista",
    imagem: "/classes/especialista.png",
    sanidadeBase: 20,
    sanidadeNivel: "3 SAN (+mod Fort)",
    esperancaBase: 25,
    esperancaNivel: "5 PE (+mod VON)",
  },
  {
    id: "atiradorElite",
    nome: "Atirador de Elite",
    imagem: "/classes/atirador-elite.png",
    sanidadeBase: 25,
    sanidadeNivel: "7 SAN (+mod Fort)",
    esperancaBase: 30,
    esperancaNivel: "5 PE (+mod VON)",
  },
  {
    id: "medicoDeCampo",
    nome: "Medico de Campo",
    imagem: "/classes/medica.png",
    sanidadeBase: 20,
    sanidadeNivel: "7 SAN (+mod Fort)",
    esperancaBase: 40,
    esperancaNivel: "5 PE (+mod VON)",
  },
  {
    id: "renegado",
    nome: "O Renegado",
    imagem: "/classes/renegado.png",
    sanidadeBase: 15,
    sanidadeNivel: "7 SAN (+mod Fort)",
    esperancaBase: 5,
    esperancaNivel: "5 PE (+mod VON)",
  },
  {
    id: "ocultista",
    nome: "O Ocultista",
    imagem: "/classes/ocultista.png",
    sanidadeBase: 20,
    sanidadeNivel: "2 SAN (+mod Fort)",
    esperancaBase: 40,
    esperancaNivel: "3 PE (+mod VON)",
  },
];

const arquetiposPersonagem = [
  {
    id: "sobrevivente",
    nome: "O Sobrevivente",
    descricao:
      "Você é um lobo que aprendeu a morder antes de latir. Sobrevive, resiste e se recusa a cair.",
    vantagens: [
      "+2 em testes de resistência física.",
      "Pode improvisar armas com materiais simples.",
    ],
    desvantagem: "Dificuldade em confiar nos outros (-2 em testes sociais).",
    habilidadePrincipal:
      "Instinto Primário: Re-rola uma falha em esquiva ou resistência uma vez por sessão.",
  },
  {
    id: "lutador",
    nome: "O Lutador",
    descricao: "Falar é prata. Derrubar é ouro. Você responde com os punhos.",
    vantagens: [
      "+2 em combate corpo a corpo.",
      "Pode desarmar inimigos com facilidade.",
    ],
    desvantagem: "Pouca paciência para discussões e negociações.",
    habilidadePrincipal:
      "Fúria Interior: Uma vez por combate, dobra o dano do próximo golpe corpo a corpo.",
  },
  {
    id: "soldado",
    nome: "O Soldado",
    descricao: "Disciplina. Foco. Missão cumprida.",
    vantagens: [
      "+2 em táticas militares e armamento pesado.",
      "+2 em resistência balística.",
    ],
    desvantagem: "Hierárquico — sofre penalidades sem liderança clara.",
    habilidadePrincipal:
      "Formação de Ferro: Uma vez por combate, reduz pela metade o dano recebido por dois turnos.",
  },
  {
    id: "estrategista",
    nome: "O Estrategista",
    descricao: "Para você, a vitória é apenas uma equação a ser resolvida.",
    vantagens: [
      "+2 em testes de planejamento.",
      "Pode identificar a fraqueza de inimigos com um teste de Percepção.",
    ],
    desvantagem:
      "Lento para agir em situações improvisadas (-1 em reações rápidas).",
    habilidadePrincipal:
      "Plano Mestre: Uma vez por sessão, antecipa o próximo movimento inimigo, anulando seu ataque.",
  },
  {
    id: "investigador",
    nome: "O Investigador",
    descricao: "Detalhes não mentem. Pessoas, sim.",
    vantagens: ["+2 em testes de dedução.", "+2 ao procurar pistas físicas."],
    desvantagem:
      "A mente cansada: sofre penalidade em testes físicos após longas investigações.",
    habilidadePrincipal:
      "Olhar Clínico: Uma vez por cena, pode revelar uma pista escondida sem teste.",
  },
  {
    id: "hacker",
    nome: "O Hacker",
    descricao: "Se existe um sistema, existe uma falha. E você é a falha.",
    vantagens: [
      "+2 em testes de tecnologia.",
      "Pode invadir sistemas básicos sem testes demorados.",
    ],
    desvantagem: "Vulnerável em combate físico (-2 em resistência).",
    habilidadePrincipal:
      "Mestre da Invasão: Uma vez por missão, invade qualquer sistema fechado sem teste.",
  },
  {
    id: "mercenario",
    nome: "O Mercenário",
    descricao: "Dinheiro é seu Deus. Contratos, seu Evangelho.",
    vantagens: [
      "+2 de dano com armas de fogo.",
      "Pode usar qualquer arma básica sem penalidade.",
    ],
    desvantagem: "Rápido demais para abandonar aliados em desvantagem.",
    habilidadePrincipal:
      "Contrato de Sangue: Uma vez por sessão, recebe +5 em dano contra um alvo escolhido.",
  },
  {
    id: "cacador-urbano",
    nome: "O Caçador Urbano",
    descricao: "Concreto, aço e fumaça. Seu território.",
    vantagens: [
      "+2 em rastreamento em cidades.",
      "Sempre encontra rotas alternativas.",
    ],
    desvantagem:
      "Dificuldade em ambientes naturais (-2 em floresta, mato etc.).",
    habilidadePrincipal:
      "Instinto de Predador: Uma vez por missão, embosca um inimigo, atacando antes dele perceber.",
  },
  {
    id: "medico",
    nome: "O Médico",
    descricao: "Salvar vidas. Esse é o verdadeiro poder.",
    vantagens: [
      "+2 em primeiros socorros.",
      "Cura ferimentos leves sem materiais.",
    ],
    desvantagem: "Prioriza a vida alheia, mesmo em risco próprio.",
    habilidadePrincipal:
      "Toque Vital: Uma vez por combate, pode estabilizar instantaneamente um aliado caído.",
  },
  {
    id: "cientista",
    nome: "O Cientista",
    descricao: "Cada descoberta é mais uma vela acesa contra a escuridão.",
    vantagens: [
      "+2 em testes de análise química, biológica ou física.",
      "Cria equipamentos improvisados com materiais laboratoriais.",
    ],
    desvantagem: "Lento para reagir sob pressão (-1 em iniciativa).",
    habilidadePrincipal:
      "Eureka!: Uma vez por missão, descobre a fraqueza de qualquer fenômeno ou inimigo.",
  },
  {
    id: "fantasma",
    nome: "O Fantasma",
    descricao:
      "Você é a brisa que apaga a vela, o ranger suave que ninguém nota até ser tarde demais.",
    vantagens: [
      "+2 em furtividade.",
      "Movimenta-se sem penalidade em ambientes fechados.",
    ],
    desvantagem: "Dificuldade de se comunicar com grupos (-1 em Sociais).",
    habilidadePrincipal:
      "Sombra Viva: Uma vez por combate, torna-se impossível de detectar por dois turnos.",
  },
  {
    id: "vigarista",
    nome: "O Vigarista",
    descricao:
      "O mundo é um tabuleiro. Você move as peças sem ninguém perceber.",
    vantagens: [
      "+2 em enganação.",
      "Pode criar disfarces simples com facilidade.",
    ],
    desvantagem: "História manchada: antigos contatos podem gerar problemas.",
    habilidadePrincipal:
      "Identidade Flexível: Uma vez por sessão, assume uma nova identidade para enganar qualquer grupo.",
  },
  {
    id: "padre-caido",
    nome: "O Padre Caído",
    descricao: "Uma vez servo da luz. Hoje, servo da própria consciência.",
    vantagens: ["+2 em testes de empatia.", "Pode acalmar multidões."],
    desvantagem:
      "Carrega culpa insuportável — -2 em testes contra manipulação emocional.",
    habilidadePrincipal:
      "Redenção Ardente: Uma vez por combate, concede bônus moral a todos os aliados próximos.",
  },
  {
    id: "visionario",
    nome: "O Visionário",
    descricao: "Onde outros veem limites, você vê possibilidades.",
    vantagens: [
      "+2 em testes de criatividade ou invenção.",
      "Pode improvisar soluções inusitadas rapidamente.",
    ],
    desvantagem:
      "Idealista demais — sofre -2 em resistir a mentiras convincentes.",
    habilidadePrincipal:
      "Ideia Brilhante: Uma vez por missão, cria uma solução que ignora limitações normais da cena.",
  },
  {
    id: "manipulador",
    nome: "O Manipulador",
    descricao: "Se você controla o medo, controla tudo.",
    vantagens: [
      "+2 em testes de manipulação.",
      "Pode implantar dúvidas em um inimigo.",
    ],
    desvantagem: "Tende a subestimar rivais (-1 contra inimigos resilientes).",
    habilidadePrincipal:
      "Mente Envenenada: Uma vez por missão, faz um inimigo hesitar ou trair um aliado.",
  },
  {
    id: "motorista",
    nome: "O Motorista",
    descricao: "Velocidade é liberdade. E você nasceu para correr.",
    vantagens: [
      "+2 em pilotagem de veículos leves.",
      "Fugir de perseguições é mais fácil para você.",
    ],
    desvantagem: "Impulsivo — tende a entrar em brigas sem pensar.",
    habilidadePrincipal:
      "Fuga Audaciosa: Uma vez por sessão, pode escapar de qualquer perseguição sem teste.",
  },
  {
    id: "empresario",
    nome: "O Empresário",
    descricao:
      "O mundo é feito de transações. E você sempre negocia com vantagem.",
    vantagens: [
      "+2 em negociação e barganha.",
      "Recruta aliados temporários com mais facilidade.",
    ],
    desvantagem: "Materialista — difícil para você agir sem ganhos pessoais.",
    habilidadePrincipal:
      "Aquisição Imediata: Uma vez por missão, obtém qualquer recurso não-combatente de forma rápida.",
  },
  {
    id: "detetive-caido",
    nome: "O Detetive Caído",
    descricao: "A verdade te corroeu por dentro... mas ainda te move.",
    vantagens: [
      "+2 em testes de interrogatório.",
      "Sabe onde procurar provas ocultas.",
    ],
    desvantagem:
      "Alcoolismo ou vício latente — testes de força de vontade são mais difíceis.",
    habilidadePrincipal:
      "Instinto de Justiça: Uma vez por missão, encontra a ligação entre pistas aparentemente desconexas.",
  },
  {
    id: "artista",
    nome: "O Artista",
    descricao: "Arte não salva o mundo. Mas pode salvá-lo de si mesmo.",
    vantagens: [
      "+2 em expressão artística.",
      "Cria distrações emocionais profundas.",
    ],
    desvantagem: "Sensível a críticas ou traumas emocionais.",
    habilidadePrincipal:
      "Catarse: Uma vez por missão, pode inspirar aliados ou desmoralizar inimigos através da arte.",
  },
  {
    id: "mercador-de-armas",
    nome: "O Mercador de Armas",
    descricao: "Em guerra ou paz, sempre haverá quem compre o que você vende.",
    vantagens: [
      "+2 em conhecimento de armas e munições.",
      "Acesso facilitado a armamentos ilegais.",
    ],
    desvantagem: "Alvo de grupos que querem eliminar fornecedores.",
    habilidadePrincipal:
      "Arsenal Sob Medida: Uma vez por missão, equipa a equipe com uma arma extra de alto impacto.",
  },
  {
    id: "orador",
    nome: "O Orador",
    descricao: "Sua voz pesa mais que uma arma.",
    vantagens: [
      "+2 em testes de persuasão e discurso público.",
      "Detecta emoções ocultas em uma pessoa uma vez por cena.",
    ],
    desvantagem:
      "Fala compulsiva — sofre -2 em testes que exigem silêncio ou discrição.",
    habilidadePrincipal:
      "Palavra Final: Uma vez por missão, convence uma pessoa hesitante a ajudá-lo, mesmo contra a lógica.",
  },
  {
    id: "charlatao",
    nome: "O Charlatão",
    descricao: "A mentira certa vale mais que uma verdade mal contada.",
    vantagens: [
      "+2 em testes de enganação.",
      "Pode improvisar desculpas críveis rapidamente.",
    ],
    desvantagem:
      "Mentiras frágeis — -2 em testes prolongados de manutenção de falsidades.",
    habilidadePrincipal:
      "Realidade Distorcida: Uma vez por sessão, faz um pequeno grupo acreditar em uma mentira absurda por alguns minutos.",
  },
  {
    id: "fenix",
    nome: "A Fênix",
    descricao: "Você cai, quebra, sangra... e retorna.",
    vantagens: [
      "+2 em testes de resistência física.",
      "Recuperação acelerada: regenera ferimentos leves entre cenas.",
    ],
    desvantagem: "Ilusão de invencibilidade — -2 em testes de prudência.",
    habilidadePrincipal:
      "Renascimento: Uma vez por missão, recupera metade da vida ou energia antes de ser derrubado.",
  },
  {
    id: "confessor",
    nome: "O Confessor",
    descricao: "Toda alma esconde algo. Você sabe como arrancar.",
    vantagens: [
      "+2 em testes de empatia.",
      "Detecta mentiras automaticamente em uma pergunta por cena.",
    ],
    desvantagem: "Peso da culpa — sofre -2 em testes de resistência emocional.",
    habilidadePrincipal:
      "Espelho da Alma: Uma vez por missão, força um personagem a revelar algo que tentava esconder.",
  },
  {
    id: "arquiteto",
    nome: "O Arquiteto",
    descricao:
      "Tudo pode ser montado, desmontado ou transformado em armadilha.",
    vantagens: [
      "+2 em planejamento e criação de armadilhas.",
      "Pode improvisar dispositivos simples com ferramentas mínimas.",
    ],
    desvantagem: "Rigidez mental — -2 em improvisações fora do planejado.",
    habilidadePrincipal:
      "Projeto Perfeito: Uma vez por missão, cria uma solução improvisada que supera qualquer expectativa.",
  },
  {
    id: "paria",
    nome: "O Pária",
    descricao: "Você aprendeu a viver onde ninguém olha.",
    vantagens: [
      "+2 em testes de sobrevivência urbana.",
      "Encontra aliados ou recursos obscuros facilmente.",
    ],
    desvantagem: "Desconfiança crônica — -2 em formação de alianças rápidas.",
    habilidadePrincipal:
      "Caminho das Sombras: Uma vez por sessão, move-se totalmente despercebido em locais caóticos.",
  },
  {
    id: "maquina",
    nome: "A Máquina",
    descricao: "Frio. Preciso. Implacável.",
    vantagens: [
      "+2 em testes de força física.",
      "Resiste a efeitos emocionais automaticamente uma vez por combate.",
    ],
    desvantagem: "Frieza emocional — sofre -2 em empatia e diplomacia.",
    habilidadePrincipal:
      "Resistência Implacável: Uma vez por combate, ignora todos os efeitos negativos por dois turnos.",
  },
  {
    id: "herege",
    nome: "O Herege",
    descricao: "Você nega verdades impostas e sobrevive às consequências.",
    vantagens: [
      "+2 em testes de resistência mental contra manipulação.",
      "Interpreta armadilhas ideológicas rapidamente.",
    ],
    desvantagem:
      "Provocador nato — -2 em interações com grupos religiosos/tradicionais.",
    habilidadePrincipal:
      "Negação do Inevitável: Uma vez por missão, anula um controle mental ou imposição espiritual.",
  },
  {
    id: "cumplice",
    nome: "O Cúmplice",
    descricao: "Você é a força invisível por trás dos outros.",
    vantagens: [
      "+2 ao auxiliar aliados diretamente.",
      "Pode prever a próxima ação de um aliado e agir junto.",
    ],
    desvantagem: "Sombra dos outros — sofre -2 quando atua sozinho.",
    habilidadePrincipal:
      "Força Invisível: Uma vez por combate, concede +4 em uma ação conjunta.",
  },
  {
    id: "flagelado",
    nome: "O Flagelado",
    descricao: "A dor não te quebra. Ela te molda.",
    vantagens: [
      "+2 em testes de resistência à dor.",
      "Quem o vê resistir ganha +1 em sua próxima ação.",
    ],
    desvantagem:
      "Busca inconsciente por sofrimento — maior propensão a situações perigosas.",
    habilidadePrincipal:
      "Sacrifício Sangrento: Uma vez por combate, ferindo-se intencionalmente, ganha +4 em sua próxima ação.",
  },
  {
    id: "assassino",
    nome: "O Assassino",
    descricao: "Você transforma silêncio em sentença.",
    vantagens: [
      "+2 em ataques furtivos.",
      "Age primeiro em combates pequenos.",
    ],
    desvantagem:
      "Perfeccionismo fatal — sofre -2 quando falha em uma ação importante.",
    habilidadePrincipal:
      "Golpe Perfeito: Uma vez por combate, realiza um ataque inevitável.",
  },
  {
    id: "martir",
    nome: "O Mártir",
    descricao: "Você suporta o impossível para que outros continuem de pé.",
    vantagens: [
      "+2 em testes de moral ou resistência a desespero.",
      "Inspira aliados próximos em crises (+1).",
    ],
    desvantagem:
      "Autossacrifício crônico — sofre -2 ao tentar priorizar a si mesmo.",
    habilidadePrincipal:
      "Último Suspiro: Uma vez por missão, realiza uma ação heroica impossível antes de ser derrubado.",
  },
  {
    id: "tempestade",
    nome: "A Tempestade",
    descricao: "Você não avança. Você acontece.",
    vantagens: [
      "+2 em ataques de força bruta.",
      "Ignora penalidades por fadiga uma vez por combate.",
    ],
    desvantagem: "Pouca finesse — sofre -2 em tarefas que exigem precisão.",
    habilidadePrincipal:
      "Impacto Devastador: Uma vez por combate, derruba múltiplos inimigos ou destrói um obstáculo grande.",
  },
  {
    id: "observador",
    nome: "O Observador",
    descricao: "Nada escapa para sempre de quem sabe olhar.",
    vantagens: [
      "+2 em percepção e busca por detalhes ocultos.",
      "Identifica padrões rapidamente.",
    ],
    desvantagem: "Obcecado por detalhes — -2 em testes de ação rápida.",
    habilidadePrincipal:
      "Visão de Águia: Uma vez por missão, revela todos os segredos de uma cena.",
  },
  {
    id: "peregrino",
    nome: "O Peregrino",
    descricao: "Você sempre encontra um caminho.",
    vantagens: [
      "+2 em navegação e sobrevivência em terrenos variados.",
      "Sempre encontra caminhos alternativos.",
    ],
    desvantagem: "Sem raízes — -2 em interações que exigem lealdade.",
    habilidadePrincipal:
      "Trilha Secreta: Uma vez por missão, descobre uma rota segura ou escondida.",
  },
  {
    id: "tatico",
    nome: "O Tático",
    descricao: "Você vence antes do primeiro golpe.",
    vantagens: [
      "+2 em estratégia e previsão de eventos.",
      "Reduz a eficácia de armadilhas uma vez por missão.",
    ],
    desvantagem: "Dificuldade com improviso — -2 em ações espontâneas.",
    habilidadePrincipal:
      "Xeque-Mate: Uma vez por missão, prevê e neutraliza a grande jogada do inimigo.",
  },
  {
    id: "filosofo",
    nome: "O Filósofo",
    descricao: "Toda escolha carrega uma consequência. Você as enxerga antes.",
    vantagens: [
      "+2 em raciocínio lógico e filosófico.",
      "Torna decisões em grupo mais ponderadas.",
    ],
    desvantagem: "Hesitação — -2 em ações de impulso.",
    habilidadePrincipal:
      "Reflexão Causal: Uma vez por missão, prevê consequências futuras de uma escolha feita agora.",
  },
  {
    id: "duelista",
    nome: "O Duelista",
    descricao: "Um contra um, você é sentença.",
    vantagens: [
      "+2 em combate um-contra-um.",
      "Antecipa ataques de um único inimigo.",
    ],
    desvantagem: "Orgulho ferido — -2 em se retirar de um combate.",
    habilidadePrincipal:
      "Desafio Mortal: Uma vez por combate, foca em um oponente e recebe +4 contra ele.",
  },
];

const calcularModificador = (valor) => {
  const numero = parseInt(valor) || 0;

  if (numero >= 50) return 5;
  if (numero >= 40) return 4;
  if (numero >= 30) return 3;
  if (numero >= 20) return 2;
  if (numero >= 10) return 1;

  return 0;
};

const calcularRecursosClasse = (classe, atributosForm) => {
  const modFortitude = calcularModificador(atributosForm.fonitude);
  const modVontade = calcularModificador(atributosForm.vontade);

  return {
    sanidade: classe.sanidadeBase + modFortitude,
    esperanca: classe.esperancaBase + modVontade,
    modFortitude,
    modVontade,
  };
};

// Escreva aqui o dialogo inicial antes das perguntas.
const dialogoInicial =
  "Antes de comecarmos, escute com atencao. Ainda ha espaco para mais palavras aqui.";

const perguntas = [
  "Como posso te chamar?",
  "Mostre-me sua Integridade.",
  "Por favor, insira as suas caracteristicas.",
  "Agora escolha seu arquétipo.",
  "Escolha sua classe.",
  "Deixe-me ver seu rosto.",
];

const criarFichaInicial = (form) => ({
  ...estadoInicial,

  nome: form.nome.trim(),
  pronome: form.pronome,

  classe: form.classe,
  classeId: form.classeId,
  arquetipoId: form.arquetipoId,
  arquetipo: form.arquetipo?.nome || "",

  especialidade: "",
  classeDetalhes: form.classeDetalhes,

  classeEspecialidade: {
    arquetipo: form.arquetipo?.nome || "",
    arquetipoId: form.arquetipoId,
    arquetipoDetalhes: form.arquetipo || null,
    classeEscolhida: form.classe || "",
    especializacao: "",
  },

  habilidadesClasse: {
    habilidadeAbsoluta: "",
    aptidoes: {},
    especialidade: "",
    habilidadesEspecialidade: {},
    especialidadeDefinida: false,
  },

  fotoPerfil: form.fotoPerfil,

  sanidade: {
    atual: form.sanidadeInicial,
    max: form.sanidadeInicial,
  },

  esperanca: {
    atual: form.esperancaInicial,
    max: form.esperancaInicial,
  },

  rituais: [],
  inventario: [],

  membros: Object.fromEntries(
    Object.entries(form.integridade).map(([membro, valor]) => [
      membro,
      {
        atual: valor,
        max: valor,
        defesa: 0,
        ferido: false,
        grave: false,
      },
    ]),
  ),

  atributos: {
    ...estadoInicial.atributos,
    ...form.atributos,
  },
});

const CriarPersonagem = () => {
  const [etapa, setEtapa] = useState(0);
  const [textoVisivel, setTextoVisivel] = useState("");
  const [form, setForm] = useState({
    nome: "",
    pronome: "Ele",
    classeId: classesPersonagem[0].id,
    classe: classesPersonagem[0].nome,
    arquetipoId: "",
    arquetipo: null,
    especialidade: "",
    classeDetalhes: null,
    sanidadeInicial: 0,
    esperancaInicial: 0,
    fotoPerfil: "",
    integridade: {
      cabeca: 100,
      torso: 500,
      bracoDireito: 500,
      bracoEsquerdo: 500,
      pernaDireita: 500,
      pernaEsquerda: 500,
    },
    atributos: {
      forca: 0,
      fonitude: 0,
      inteligencia: 0,
      reflexos: 0,
      vontade: 0,
    },
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [classeEmFoco, setClasseEmFoco] = useState(classesPersonagem[0]);

  const dialogoAtual =
    etapa === 0
      ? dialogoInicial
      : perguntas[etapa - 1] || "Tudo pronto. Agora podemos criar sua ficha.";
  const ultimaEtapa = etapa > perguntas.length;
  const indiceClasseEmFoco = Math.max(
    classesPersonagem.findIndex((classe) => classe.id === classeEmFoco.id),
    0,
  );

  const etapaValida = useMemo(() => {
    if (etapa === 1) return form.nome.trim().length > 0;
    if (etapa === 4) {
      return form.classe.trim().length > 0;
    }

    return true;
  }, [etapa, form.classe, form.nome]);

  useEffect(() => {
    setTextoVisivel("");

    let indice = 0;
    const intervalo = window.setInterval(() => {
      indice += 1;
      setTextoVisivel(dialogoAtual.slice(0, indice));

      if (indice >= dialogoAtual.length) {
        window.clearInterval(intervalo);
      }
    }, 32);

    return () => window.clearInterval(intervalo);
  }, [dialogoAtual]);

  useEffect(() => {
    if (!form.classeId) return;

    const classe = classesPersonagem.find((item) => item.id === form.classeId);
    if (!classe) return;

    const recursos = calcularRecursosClasse(classe, form.atributos);

    setForm((prev) => ({
      ...prev,
      classeDetalhes: {
        nome: classe.nome,
        sanidadeBase: classe.sanidadeBase,
        sanidadeNivel: classe.sanidadeNivel,
        esperancaBase: classe.esperancaBase,
        esperancaNivel: classe.esperancaNivel,
        modFortitude: recursos.modFortitude,
        modVontade: recursos.modVontade,
      },
      sanidadeInicial: recursos.sanidade,
      esperancaInicial: recursos.esperanca,
    }));
  }, [form.atributos, form.classeId]);

  const atualizarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const atualizarAtributo = (atributo, valor) => {
    setForm((prev) => ({
      ...prev,
      atributos: {
        ...prev.atributos,
        [atributo]: Math.max(0, parseInt(valor) || 0),
      },
    }));
  };

  const atualizarIntegridade = (membro, valor) => {
    setForm((prev) => ({
      ...prev,
      integridade: {
        ...prev.integridade,
        [membro]: Math.max(0, parseInt(valor) || 0),
      },
    }));
  };

  const selecionarClasse = (classe) => {
    const recursos = calcularRecursosClasse(classe, form.atributos);

    setClasseEmFoco(classe);

    setForm((prev) => ({
      ...prev,

      classeId: classe.id,
      classe: classe.nome,

      especialidade: "",

      classeDetalhes: {
        nome: classe.nome,
        sanidadeBase: classe.sanidadeBase,
        sanidadeNivel: classe.sanidadeNivel,
        esperancaBase: classe.esperancaBase,
        esperancaNivel: classe.esperancaNivel,
        modFortitude: recursos.modFortitude,
        modVontade: recursos.modVontade,
      },

      sanidadeInicial: recursos.sanidade,
      esperancaInicial: recursos.esperanca,
    }));
  };

  const selecionarArquetipo = (arquetipo) => {
    setForm((prev) => ({
      ...prev,
      arquetipoId: arquetipo.id,
      arquetipo,
    }));
  };

  const trocarClasse = (direcao) => {
    const proximoIndice =
      (indiceClasseEmFoco + direcao + classesPersonagem.length) %
      classesPersonagem.length;

    selecionarClasse(classesPersonagem[proximoIndice]);
    setErro("");
  };

  const carregarFoto = (arquivo) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("Escolha uma imagem de ate 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      atualizarCampo("fotoPerfil", reader.result || "");
      setErro("");
    };
    reader.readAsDataURL(arquivo);
  };

  const proximaEtapa = () => {
    setErro("");

    if (!etapaValida) {
      setErro("Preencha os campos desta etapa para continuar.");
      return;
    }

    setEtapa((atual) => Math.min(atual + 1, perguntas.length + 1));
  };

  const voltarEtapa = () => {
    setErro("");
    setEtapa((atual) => Math.max(atual - 1, 0));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!form.nome.trim()) {
      setErro("Informe o nome do personagem.");
      setEtapa(1);
      return;
    }

    setSalvando(true);

    try {
      const fichaInicial = criarFichaInicial(form);
      const { fichaId, personagem } = await criarPersonagem(fichaInicial);

      localStorage.setItem(ULTIMA_FICHA_KEY, fichaId);
      localStorage.setItem(
        `${STORAGE_KEY}_${fichaId}`,
        JSON.stringify(personagem || fichaInicial),
      );
      window.location.href = `/?ficha=${encodeURIComponent(fichaId)}`;
    } catch (error) {
      setErro(`Nao foi possivel criar a ficha. ${error.message}`);
      setSalvando(false);
    }
  };

  return (
    <main
      className={`criacao-container ${etapa === 5 ? "classe-fundo-ativo" : ""}`}
    >
      {etapa === 5 && (
        <img
          key={classeEmFoco.id}
          src={classeEmFoco.imagem}
          alt=""
          className="classe-bg-img"
          aria-hidden="true"
        />
      )}
      <form className="criacao-form" onSubmit={enviar}>
        <section className="criacao-dialogo">
          <p className="criacao-kicker">Voz desconhecida</p>
          <h1>{textoVisivel}</h1>
        </section>

        <section className="criacao-etapa">
          {etapa === 0 && (
            <div className="intro-etapa">
              <p>
                O dialogo inicial termina aqui. As perguntas comecam quando o
                jogador continuar.
              </p>
            </div>
          )}

          {etapa === 1 && (
            <div className="criacao-bloco identidade">
              <label>
                <span>Nome</span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo("nome", event.target.value)
                  }
                  maxLength={30}
                  autoFocus
                />
              </label>

              <fieldset className="pronome-grupo">
                <legend>Pronome</legend>
                {["Ele", "Ela", "Elu"].map((pronome) => (
                  <label key={pronome}>
                    <input
                      type="radio"
                      name="pronome"
                      value={pronome}
                      checked={form.pronome === pronome}
                      onChange={(event) =>
                        atualizarCampo("pronome", event.target.value)
                      }
                    />
                    <span>{pronome}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {etapa === 2 && (
            <div className="criacao-integridade">
              {membrosIntegridade.map((membro) => (
                <label key={membro.chave}>
                  <span>{membro.nome}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.integridade[membro.chave]}
                    onChange={(event) =>
                      atualizarIntegridade(membro.chave, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {etapa === 3 && (
            <div className="criacao-atributos">
              {atributos.map((atributo) => (
                <label key={atributo.chave}>
                  <span>{atributo.nome}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.atributos[atributo.chave]}
                    onChange={(event) =>
                      atualizarAtributo(atributo.chave, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {etapa === 4 && (
            <div className="arquetipos-etapa">
              {arquetiposPersonagem.map((arquetipo) => (
                <button
                  key={arquetipo.id}
                  type="button"
                  className={`arquetipo-card ${
                    form.arquetipoId === arquetipo.id ? "ativo" : ""
                  }`}
                  onClick={() => selecionarArquetipo(arquetipo)}
                >
                  <span>Arquétipo</span>

                  <h3>{arquetipo.nome}</h3>

                  <p>{arquetipo.descricao}</p>

                  <div className="arquetipo-bloco">
                    <strong>Vantagens</strong>

                    {arquetipo.vantagens.map((vantagem) => (
                      <small key={vantagem}>{vantagem}</small>
                    ))}
                  </div>

                  <div className="arquetipo-bloco">
                    <strong>Desvantagem</strong>
                    <small>{arquetipo.desvantagem}</small>
                  </div>

                  <div className="arquetipo-bloco habilidade">
                    <strong>Habilidade Principal</strong>
                    <small>{arquetipo.habilidadePrincipal}</small>
                  </div>
                </button>
              ))}
            </div>
          )}

          {etapa === 5 && (
            <div className="classes-etapa">
              <section className="classe-resumo">
                <p className="classe-contador">
                  {indiceClasseEmFoco + 1} / {classesPersonagem.length}
                </p>
                <h2>{classeEmFoco.nome}</h2>
                <p>
                  Sanidade inicial:{" "}
                  {classeEmFoco.sanidadeBase +
                    calcularModificador(form.atributos.fonitude)}
                </p>
                <p>A cada novo nivel: {classeEmFoco.sanidadeNivel}</p>
                <p>
                  Esperanca inicial:{" "}
                  {classeEmFoco.esperancaBase +
                    calcularModificador(form.atributos.vontade)}
                </p>
                <p>A cada novo nivel: {classeEmFoco.esperancaNivel}</p>
              </section>

              <div className="classe-navegacao">
                <button
                  type="button"
                  className="classe-nav-btn"
                  onClick={() => trocarClasse(-1)}
                >
                  <Icon path={mdiChevronLeft} size={0.9} />
                  Classe anterior
                </button>

                <button
                  type="button"
                  className="classe-nav-btn"
                  onClick={() => trocarClasse(1)}
                >
                  Proxima classe
                  <Icon path={mdiChevronRight} size={0.9} />
                </button>
              </div>
            </div>
          )}

          {etapa === 6 && (
            <div className="foto-etapa">
              <div className="foto-preview">
                {form.fotoPerfil ? (
                  <img src={form.fotoPerfil} alt="Rosto do personagem" />
                ) : (
                  <span>Sem rosto</span>
                )}
              </div>
              <label className="foto-upload">
                <span>Foto do personagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => carregarFoto(event.target.files?.[0])}
                />
              </label>
            </div>
          )}
        </section>

        {erro && <p className="criacao-erro">{erro}</p>}

        <div className="criacao-acoes">
          <button
            className="criacao-secundario"
            type="button"
            onClick={voltarEtapa}
            disabled={etapa === 0 || salvando}
          >
            Voltar
          </button>

          {ultimaEtapa ? (
            <button
              className="criacao-submit"
              type="submit"
              disabled={salvando}
            >
              <Icon path={mdiAccountPlus} size={0.9} />
              {salvando ? "Criando..." : "Criar ficha"}
            </button>
          ) : (
            <button
              className="criacao-submit"
              type="button"
              onClick={proximaEtapa}
              disabled={salvando}
            >
              <Icon path={mdiChevronRight} size={0.9} />
              Continuar
            </button>
          )}
        </div>
      </form>
    </main>
  );
};

export default CriarPersonagem;
