export const normalizarVisibilidadeCena = (cena = {}) => ({
  visualizarTodos: cena.visualizar_todos ?? cena.visualizarTodos ?? true,
  jogadoresVisiveis: Array.isArray(cena.jogadores_visiveis)
    ? cena.jogadores_visiveis.map(String)
    : Array.isArray(cena.jogadoresVisiveis)
      ? cena.jogadoresVisiveis.map(String)
      : [],
});

export const cenaVisivelParaJogador = (cena, fichaId) => {
  if (!cena) return false;
  const visibilidade = normalizarVisibilidadeCena(cena);
  if (visibilidade.visualizarTodos) return true;
  if (!fichaId) return false;
  return visibilidade.jogadoresVisiveis.includes(String(fichaId));
};
