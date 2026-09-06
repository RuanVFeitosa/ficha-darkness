import {
  cenaVisivelParaJogador,
  normalizarVisibilidadeCena,
} from "./sceneVisibility";

test("cenas antigas continuam visiveis para todos", () => {
  expect(cenaVisivelParaJogador({ id: "antiga" }, "ficha-1")).toBe(true);
});

test("cena restrita aparece apenas para as fichas selecionadas", () => {
  const cena = { visualizarTodos: false, jogadoresVisiveis: ["ficha-1"] };
  expect(cenaVisivelParaJogador(cena, "ficha-1")).toBe(true);
  expect(cenaVisivelParaJogador(cena, "ficha-2")).toBe(false);
  expect(cenaVisivelParaJogador(cena, "")).toBe(false);
});

test("normaliza os campos recebidos do Supabase", () => {
  expect(normalizarVisibilidadeCena({
    visualizar_todos: false,
    jogadores_visiveis: [123, "ficha-2"],
  })).toEqual({ visualizarTodos: false, jogadoresVisiveis: ["123", "ficha-2"] });
});
