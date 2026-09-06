export const ehHabilidadeProgressaoAvancada = (habilidade = {}) =>
  habilidade.origem === "progressao-avancada" ||
  habilidade.origemNivelAvancado != null ||
  (habilidade.recurso === "marco" &&
    String(habilidade.id || "").startsWith("marco-"));

export const listarHabilidadesCriadasJogador = (personagem = {}) =>
  (personagem.habilidadesCriadas || []).filter(
    (habilidade) => !ehHabilidadeProgressaoAvancada(habilidade),
  );

export const listarHabilidadesProgressaoAvancada = (personagem = {}) => {
  const escolhas = Object.entries(personagem.progressaoAvancada || {}).map(
    ([nivel, habilidade]) => ({
      ...habilidade,
      id: habilidade.id
        ? `marco-${nivel}-${habilidade.id}`
        : `marco-${nivel}`,
      nivel: Number(nivel),
      grupo: "Especialismo",
      origem: "progressao-avancada",
      origemNivelAvancado: Number(nivel),
    }),
  );

  const niveisComEscolha = new Set(
    escolhas.map((habilidade) => String(habilidade.origemNivelAvancado)),
  );
  const legadas = (personagem.habilidadesCriadas || [])
    .filter(ehHabilidadeProgressaoAvancada)
    .filter(
      (habilidade) =>
        !niveisComEscolha.has(String(habilidade.origemNivelAvancado)),
    )
    .map((habilidade) => ({
      ...habilidade,
      grupo: "Especialismo",
      nivel: Number(habilidade.origemNivelAvancado) || undefined,
    }));

  return [...escolhas, ...legadas].sort(
    (a, b) => (Number(a.nivel) || 0) - (Number(b.nivel) || 0),
  );
};
