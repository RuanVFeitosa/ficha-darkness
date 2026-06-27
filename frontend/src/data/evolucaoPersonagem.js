export const TABELA_EVOLUCAO = [
  { nivel: 1, passivos: 4, atributos: 6, habilidades: 8, acumulado: 10 },
  { nivel: 2, passivos: 6, atributos: 9, habilidades: 12, acumulado: 15 },
  { nivel: 3, passivos: 8, atributos: 12, habilidades: 16, acumulado: 20 },
  { nivel: 4, passivos: 10, atributos: 15, habilidades: 20, acumulado: 25 },
  { nivel: 5, passivos: 12, atributos: 18, habilidades: 24, acumulado: 30 },
  { nivel: 6, passivos: 14, atributos: 21, habilidades: 28, acumulado: 35 },
  { nivel: 7, passivos: 16, atributos: 24, habilidades: 32, acumulado: 40 },
  { nivel: 8, passivos: 18, atributos: 27, habilidades: 36, acumulado: 45 },
  { nivel: 9, passivos: 20, atributos: 30, habilidades: 40, acumulado: 50 },
  { nivel: 10, passivos: 22, atributos: 33, habilidades: 44, acumulado: 55 },
];

export const RECURSOS_NIVEL_CLASSE = {
  aniquilador: { sanidade: 5, esperanca: 2 },
  especialista: { sanidade: 2, esperanca: 7 },
  atiradorElite: { sanidade: 3, esperanca: 3 },
  medicoDeCampo: { sanidade: 5, esperanca: 5 },
  renegado: { sanidade: 3, esperanca: 3 },
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const CLASSE_ID_POR_NOME = {
  aniquilador: "aniquilador",
  aniquilidador: "aniquilador",
  especialista: "especialista",
  atiradorelite: "atiradorElite",
  medicodecampo: "medicoDeCampo",
  orenegado: "renegado",
  renegado: "renegado",
};

export const obterClasseIdRecursos = (personagem = {}) => {
  const classeId = personagem.classeId || personagem.classeDetalhes?.id;

  if (classeId && RECURSOS_NIVEL_CLASSE[classeId]) {
    return classeId;
  }

  const nomeNormalizado = normalizarTexto(
    personagem.classe || personagem.classeDetalhes?.nome,
  );

  return CLASSE_ID_POR_NOME[nomeNormalizado] || "";
};

export const calcularModificador = (valor) => {
  const numero = parseInt(valor, 10) || 0;

  if (numero >= 50) return 5;
  if (numero >= 40) return 4;
  if (numero >= 30) return 3;
  if (numero >= 20) return 2;
  if (numero >= 10) return 1;

  return 0;
};

export const calcularGanhoRecursosNivel = (personagem = {}) => {
  const classeId = obterClasseIdRecursos(personagem);
  const recursosClasse = RECURSOS_NIVEL_CLASSE[classeId];

  if (!recursosClasse) {
    return { sanidade: 0, esperanca: 0, classeId: "" };
  }

  const modFortitude = calcularModificador(personagem.atributos?.fonitude);
  const modVontade = calcularModificador(personagem.atributos?.vontade);

  return {
    classeId,
    sanidade: recursosClasse.sanidade + modFortitude,
    esperanca: recursosClasse.esperanca + modVontade,
    modFortitude,
    modVontade,
  };
};

export const obterCustosNivel = (nivel) => {
  const numero = Math.max(1, Math.min(10, parseInt(nivel, 10) || 1));
  return TABELA_EVOLUCAO[numero - 1];
};

export const ATRIBUTOS_UPGRADE = [
  { chave: "forca", nome: "Força" },
  { chave: "fonitude", nome: "Fortitude" },
  { chave: "inteligencia", nome: "Inteligência" },
  { chave: "reflexos", nome: "Reflexos" },
  { chave: "vontade", nome: "Vontade" },
];
