import { atualizarDestinoNaFicha } from "./destinos";

const anterior = { id: "destino", nome: "Antigo", habilidades: [{ nome: "A" }, { nome: "B" }] };
const atualizada = { ...anterior, nome: "Novo", beneficios: "Novo benefício", habilidades: [{ nome: "A nova" }, { nome: "B nova", descricao: "Corrigida" }] };

test("atualiza todos os dados de um Destino pendente sem alterar outras marcas", () => {
  const outra = { id: "outro" };
  const resultado = atualizarDestinoNaFicha([{ ...anterior, aceita: false }, outra], anterior, atualizada);
  expect(resultado[0]).toEqual({ ...atualizada, aceita: false });
  expect(resultado[1]).toBe(outra);
});

test("preserva o aceite e atualiza somente a habilidade escolhida", () => {
  const resultado = atualizarDestinoNaFicha([{ ...anterior, aceita: true, habilidades: [anterior.habilidades[1]] }], anterior, atualizada);
  expect(resultado[0]).toEqual({ ...atualizada, aceita: true, habilidades: [atualizada.habilidades[1]] });
});
