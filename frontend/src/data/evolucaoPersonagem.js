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

export const obterCustosNivel = (nivel) => {
  const numero = Math.max(1, Math.min(10, parseInt(nivel, 10) || 1));
  return TABELA_EVOLUCAO[numero - 1];
};

export const ATRIBUTOS_UPGRADE = [
  { chave: "forca", nome: "Forca" },
  { chave: "fonitude", nome: "Fortitude" },
  { chave: "inteligencia", nome: "Inteligencia" },
  { chave: "reflexos", nome: "Reflexos" },
  { chave: "vontade", nome: "Vontade" },
];
