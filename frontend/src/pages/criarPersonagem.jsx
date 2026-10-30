import { normalizarConteudoAbsoluto } from '../utils/absolutoModificadores';
import { criarBaseV1, atributosIniciais, dominiosIniciais, custoAtributos, custoDominios, integridadeInicial, recursosIniciais, REGIOES } from '../data/absolutoV1';
import { AbsolutoValores } from '../components/absoluto/AbsolutoValores';
import ArchetypePicker from '../components/jogador/ArchetypePicker';
import ClassArtwork from '../components/jogador/ClassArtwork';
import { vincularAoJogadorAtivo, verificarVagaPersonagem } from "../services/jogadorApi";
import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountPlus, mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import {
  buscarJogador,
  criarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import { estadoInicial } from "./fichaPersonagem";
import { compressProfileImage } from "../services/imageCompression";
import "../styles/CriarPersonagem.css";
import '../styles/CriacaoAbsolutoRitual.css';

const STORAGE_KEY = "fichaRPG_personagem";

const atributos = [
  { chave: "forca", nome: "Forca" },
  { chave: "fonitude", nome: "Fortitude" },
  { chave: "inteligencia", nome: "Inteligencia" },
  { chave: "reflexos", nome: "Reflexos" },
  { chave: "vontade", nome: "Vontade" },
];


export const classesPersonagem = [
  {
    id: "aniquilador",
    nome: "Aniquilador",
    imagem: "/classes/aniquilador.webp",
  },
  {
    id: "especialista",
    nome: "Especialista",
    imagem: "/classes/especialista.webp",
  },
  {
    id: "atiradorElite",
    nome: "Atirador de Elite",
    imagem: "/classes/atirador-elite.webp",
  },
  {
    id: "medicoDeCampo",
    nome: "Médico de Campo",
    imagem: "/classes/medica.webp",
  },
  {
    id: "renegado",
    nome: "O Renegado",
    imagem: "/classes/renegado.webp",
  },
  { id: 'ocultista', nome: 'Ocultista', imagem: '/simbolo-absoluto.png' },
  { id: 'vestigio', nome: 'Vestígio', imagem: '/simbolo-absoluto.png' },
];

export const arquetiposPersonagem = normalizarConteudoAbsoluto([
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
]);

export const calcularRecursosClasse = (classe, atributosForm) => ({
  ...recursosIniciais(atributosForm),
  modFortitude: Number(atributosForm.fonitude) || 0,
  modVontade: Number(atributosForm.vontade) || 0,
});

// Perguntas do fluxo de criação de personagem.


const perguntasExistente = [
  'Dize teu nome. Nenhuma alma permanece anônima diante de Mim.',
  'Mostra-Me as marcas que teu corpo aprendeu a suportar.',
  'Revela tua natureza. Conheço a força que escondes.',
  'Toda alma carrega uma verdade. Qual é a tua?',
  'Escolhe como Meu poder se manifestará através de ti.',
  'Dá um rosto à tua existência. Que tua história seja reconhecida.',
];

const perguntasNovo = [
  'Dize teu nome. Eu te escuto antes mesmo de tua primeira palavra.',
  'Tua existência começa com cem possibilidades. Decide o que farás delas.',
  'O dom te foi concedido. Decide onde ele criará raízes.',
  'A carne é finita. Conhece os limites que tua Fortitude sustenta.',
  'Sob todas as máscaras, uma verdade. Revela-Me quem és.',
  'Meu poder tem muitas faces. Por qual delas serás conhecido?',
  'Mostra-Me teu rosto. Que tua presença deixe uma marca neste mundo.',
];

const criarSlugPersonagem = (nome) => {
  const slug = String(nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "personagem";
};

export const criarFichaInicial = (form) => ({
  ...estadoInicial,

  nome: form.nome.trim(),
  nomeJogador: form.nomeJogador.trim(),
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
  ...criarBaseV1(form.atributos, form.dominios),
  existencia: { pontos: 100, gastosAtributos: custoAtributos(form.atributos), gastosDominios: custoDominios(form.dominios) },
  humanidade: form.humanidade || '',
});

const CriarPersonagem = ({ onNavigate = destino => window.location.assign(destino) } = {}) => {
  const [modoCadastro, setModoCadastro] = useState(null);
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
    existenciaDados: [],
    existenciaMaior: 0,
    existenciaPontos: 100,
    dominios: dominiosIniciais(),
    humanidade: "",
    integridade: Object.fromEntries(Object.entries(integridadeInicial(1)).map(([k, m]) => [k, m.max])),
    atributos: atributosIniciais(),
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [classeEmFoco, setClasseEmFoco] = useState(classesPersonagem[0]);

  const perguntasAtuais =
    modoCadastro === "novo" ? perguntasNovo : perguntasExistente;
  const etapaNome = 1;
  const etapaExistencia = modoCadastro === "novo" ? 2 : null;
  const etapaAtributos = modoCadastro === "novo" ? 3 : 2;
  const etapaIntegridade = modoCadastro === "novo" ? 4 : 3;
  const etapaArquetipo = modoCadastro === "novo" ? 5 : 4;
  const etapaClasse = modoCadastro === "novo" ? 6 : 5;
  const etapaFoto = modoCadastro === "novo" ? 7 : 6;
  const totalEtapas = perguntasAtuais.length;
  const pontosAtributosUsados = custoAtributos(form.atributos) + custoDominios(form.dominios);
  const pontosAtributosRestantes = Math.max(
    0,
    form.existenciaPontos - pontosAtributosUsados,
  );
  const dialogoAtual =
    etapa === 0
      ? 'Aproxima-te. Vieste receber a existência ou revelar aquela que já carregas?'
      : perguntasAtuais[etapa - 1] ||
        'Eu vi tuas escolhas. Confirma teu pacto, e tua história terá início.';
  const nomesRito = modoCadastro === 'existente'
    ? ['O limiar','O nome','A carne','A natureza','A verdade','O chamado','O selo','O pacto']
    : ['O limiar','O nome','O julgamento','O dom','A carne','A verdade','O chamado','O selo','O pacto'];
  const ultimaEtapa = etapa > totalEtapas;
  const indiceClasseEmFoco = Math.max(
    classesPersonagem.findIndex((classe) => classe.id === classeEmFoco.id),
    0,
  );

  const etapaValida = useMemo(() => {
    if (etapa === 0) return Boolean(modoCadastro);
    if (etapa === etapaNome) {
      return form.nome.trim().length > 0;
    }
    if (etapa === etapaExistencia) return form.existenciaPontos > 0;
    if (modoCadastro === "novo" && etapa === etapaAtributos) {
      return (
        pontosAtributosUsados <= form.existenciaPontos &&
        atributos.every((atributo) => form.atributos[atributo.chave] >= 1 && form.atributos[atributo.chave] <= 3)
      );
    }
    if (etapa === etapaArquetipo) {
      return Boolean(form.arquetipoId);
    }
    if (etapa === etapaClasse) {
      return form.classe.trim().length > 0;
    }

    if (etapa === etapaFoto) return true;

    return true;
  }, [
    etapa,
    etapaArquetipo,
    etapaAtributos,
    etapaClasse,
    etapaExistencia,
    etapaFoto,
    etapaNome,
    form.arquetipoId,
    form.atributos,
    form.classe,
    form.existenciaPontos,
    form.nome,
    modoCadastro,
    pontosAtributosUsados,
  ]);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTextoVisivel(dialogoAtual);
      return;
    }
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

  const escolherModoCadastro = (modo) => {
    setModoCadastro(modo);
    setErro('');
    setEtapa(1);
    setForm(prev => ({ ...prev, existenciaPontos: 100, existenciaDados: [], existenciaMaior: 0, atributos: atributosIniciais(), dominios: dominiosIniciais(), integridade: Object.fromEntries(Object.entries(integridadeInicial(1)).map(([k,m]) => [k,m.max])) }));
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

  const carregarFoto = async (arquivo) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }

    try {
      const fotoComprimida = await compressProfileImage(arquivo);
      if (!fotoComprimida) return;
      atualizarCampo("fotoPerfil", fotoComprimida);
      setErro("");
    } catch (error) {
      setErro(error.message || "Nao foi possivel carregar a imagem.");
    }
  };

  const proximaEtapa = (event) => {
    event?.preventDefault();
    setErro("");

    if (!etapaValida) {
      setErro("Preencha os campos desta etapa para continuar.");
      return;
    }

    setEtapa((atual) => Math.min(atual + 1, totalEtapas + 1));
  };

  const voltarEtapa = () => {
  setErro("");
  setEtapa((atual) => Math.max(atual - 1, 0));
};

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!modoCadastro) {
      setErro("Escolha como deseja cadastrar o personagem.");
      setEtapa(0);
      return;
    }

    if (!form.nome.trim()) {
      setErro("Informe o nome do personagem.");
      setEtapa(etapaNome);
      return;
    }

    if (modoCadastro === "novo" && form.existenciaPontos <= 0) {
      setErro("A criação convencional exige 100 Pontos de Existência.");
      setEtapa(etapaExistencia);
      return;
    }

    if (
      modoCadastro === "novo" &&
      (pontosAtributosUsados > 100 || Object.values(form.atributos).some(v => v < 1 || v > 3))
    ) {
      setErro("Revise os Atributos (1 a 3), os Domínios (10 EX por nível) e o orçamento de 100 EX.");
      setEtapa(etapaAtributos);
      return;
    }

    setSalvando(true);

    try {
      const codigoJogador = new URLSearchParams(window.location.search).get('jogadorOrigem') || sessionStorage.getItem('darkness:jogador');
      const perfilJogador = codigoJogador ? await buscarJogador(codigoJogador) : null;
      if (codigoJogador && !perfilJogador?.nome?.trim()) throw new Error('Não foi possível carregar seu perfil. Volte ao painel e tente novamente.');
      const fichaInicial = criarFichaInicial({ ...form, nomeJogador: perfilJogador?.nome || '' });
      if (codigoJogador) sessionStorage.setItem('darkness:jogador', codigoJogador);
      await verificarVagaPersonagem('',"darkness");
      const resposta = await criarPersonagem(fichaInicial);

      const { fichaId, personagem } = resposta;
      const personagemCriado = personagem?.nome ? personagem : fichaInicial;

      if (!personagem?.nome) {
        await salvarPersonagem(fichaId, fichaInicial);
      }

      localStorage.setItem(ULTIMA_FICHA_KEY, fichaId);
      localStorage.setItem(
        `${STORAGE_KEY}_${fichaId}`,
        JSON.stringify(personagemCriado),
      );
      await vincularAoJogadorAtivo(fichaId, "darkness");
      const personagemUrl = criarSlugPersonagem(personagemCriado.nome || form.nome);
      onNavigate(`/?sistema=darkness&ficha=${encodeURIComponent(personagemUrl)}&senha=${encodeURIComponent(fichaId)}`);
    } catch (error) {
      setErro(`Nao foi possivel criar a ficha. ${error.message}`);
      setSalvando(false);
    }
  };

  return (
    <main
      className={`criacao-container criacao-ritual ${
        etapa === etapaClasse ? "classe-fundo-ativo" : ""
      }`}
    >
      <div className="absoluto-santuario" aria-hidden="true"><span/><span/><span/></div>
      <header className="absoluto-rito-topo"><a href={new URLSearchParams(window.location.search).get('jogadorOrigem') ? `?jogador=${encodeURIComponent(new URLSearchParams(window.location.search).get('jogadorOrigem'))}` : '?'}>← Retornar</a><span>O ABSOLUTO <i> / </i> RITO DA EXISTÊNCIA</span><small>DA VONTADE, A FORMA.</small></header>
      <nav className="absoluto-rito-progresso" aria-label="Etapas do rito"><ol>{nomesRito.map((nome,i)=><li key={nome} aria-current={etapa===i?'step':undefined} className={etapa>i?'concluida':''}><span>{String(i+1).padStart(2,'0')}</span>{nome}</li>)}</ol></nav>
      {etapa === etapaClasse && <ClassArtwork classe={classeEmFoco}/>}
      <form className="criacao-form" onSubmit={enviar}>
        <section className="criacao-dialogo">
          <div className="absoluto-presenca" aria-hidden="true"><div/><img src="/simbolo-absoluto.png" alt=""/></div>
          <p className="criacao-kicker">O Absoluto <span>fala contigo</span></p>
          <h1 aria-label={dialogoAtual}>
            <span className="absoluto-fala-reserva" aria-hidden="true">{dialogoAtual}</span>
            <span className="absoluto-fala-visivel" aria-hidden="true">{textoVisivel}</span>
          </h1>
          <span className="absoluto-dialogo-ornamento" aria-hidden="true">✦</span>
        </section>

        <section className="criacao-etapa">
          <div className="absoluto-etapa-titulo"><span>{String(etapa+1).padStart(2,'0')} / {String(nomesRito.length).padStart(2,'0')}</span><h2>{nomesRito[etapa] || 'O pacto'}</h2></div>

          {etapa === 0 && (
            <div className="modo-cadastro-etapa">
              <button
                type="button"
                className="modo-cadastro-card"
                aria-pressed={modoCadastro==='novo'}
                onClick={() => escolherModoCadastro("novo")}
              >
                <span>I · A gênese</span>
                <strong>Criar um Novo Personagem</strong>
                <p>Receba sua existência. Dê forma a uma vida ainda não escrita.</p>
              </button>

              <button
                type="button"
                className="modo-cadastro-card"
                aria-pressed={modoCadastro==='existente'}
                onClick={() => escolherModoCadastro("existente")}
              >
                <span>II · A revelação</span>
                <strong>Adicionar personagem existente</strong>
                <p>Apresente uma história que já existe. Registre seus atributos e marcas.</p>
              </button>
            </div>
          )}

          {ultimaEtapa && <section className="abs-v1"><h3>Revise sua existência</h3><p>{form.nome} · {form.pronome} · {form.classe} · {form.arquetipo?.nome}</p><p>Existência: {pontosAtributosUsados} / 100 EX investidos. Restantes: {pontosAtributosRestantes} EX.</p><p>Sanidade: {form.sanidadeInicial} · Esperança: {form.esperancaInicial} · Medo: 0</p><p>Os Atributos determinam a quantidade de dados; os Domínios determinam as faces que contam como Êxito.</p><p>Use Voltar para revisar suas escolhas ou Criar ficha para concluir.</p></section>}
          {etapa === etapaNome && (
            <div className="criacao-bloco identidade">
              <label className="campo-largo">
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
          
          {etapa === etapaExistencia && <div className="abs-v1"><h3>100 Pontos de Existência</h3><p>Todos os personagens convencionais de Nível 1 começam com o mesmo orçamento. A criação usa Atributos e Domínios.</p><p>Cada Atributo começa em 1 gratuitamente. Elevar para 2 custa 10 EX; para 3 custa mais 15 EX.</p></div>}
          {etapa === etapaAtributos && <div className="abs-v1">
            <h3>Atributos e Domínios</h3><p>Existência disponível: {pontosAtributosRestantes} / 100 EX</p>
            <AbsolutoValores personagem={form} criacao onChange={next => setForm({ ...next, integridade: Object.fromEntries(Object.entries(integridadeInicial(next.atributos.fonitude)).map(([k,m]) => [k,m.max])) })} />
            <p>Cada nível de Domínio custa 10 EX. Investido em Atributos: {custoAtributos(form.atributos)} EX · Domínios: {custoDominios(form.dominios)} EX.</p>

          </div>}
          {etapa === etapaIntegridade && <div className="abs-v1"><h3>Integridade determinada pela Fortitude</h3><p>Cada região tem sua própria reserva. Os pontos são calculados automaticamente.</p><div className="abs-v1-grid">{Object.entries(integridadeInicial(form.atributos.fonitude)).map(([k,m]) => <article key={k}><strong>{REGIOES[k].nome}</strong><p>{m.max} PI</p></article>)}</div><p>Sanidade: {form.sanidadeInicial} · Esperança: {form.esperancaInicial}</p><label>Humanidade: vínculos, medos e motivações<textarea value={form.humanidade} onChange={e => atualizarCampo('humanidade', e.target.value)} /></label></div>}

          {etapa === etapaArquetipo && <ArchetypePicker arquetipos={arquetiposPersonagem} selecionado={form.arquetipoId} onSelect={selecionarArquetipo}/>}
          {etapa === etapaClasse && (
            <div className="classes-etapa">
              <section className="classe-resumo">
                <p className="classe-contador">
                  {indiceClasseEmFoco + 1} / {classesPersonagem.length}
                </p>
                <h2>{classeEmFoco.nome}</h2>
                <p>
                  Sanidade inicial:{" "}
                  {form.sanidadeInicial}
                </p>
                <p>Sanidade máxima = 12 + 2 × Vontade.</p>
                <p>
                  Esperanca inicial:{" "}
                  {form.esperancaInicial}
                </p>
                <p>Esperança máxima = 6 + Vontade. Benefícios de classe que usam a escala antiga devem ser adaptados com o Narrador.</p>
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

          {etapa === etapaFoto && (
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
                  onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; carregarFoto(file); }}
                />
              </label>

            </div>
          )}
        </section>

        {erro && <p className="criacao-erro" role="alert">{erro}</p>}

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
