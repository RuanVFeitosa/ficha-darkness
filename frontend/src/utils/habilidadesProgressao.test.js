import {
  listarHabilidadesCriadasJogador,
  listarHabilidadesProgressaoAvancada,
} from "./habilidadesProgressao";

describe("habilidades da progressao avancada", () => {
  it("separa os marcos das habilidades criadas pelo jogador", () => {
    const personagem = {
      habilidadesCriadas: [
        { id: "manual", nome: "Improviso", origem: "jogador" },
        {
          id: "marco-6-antiga",
          nome: "Registro antigo",
          recurso: "marco",
          origem: "progressao-avancada",
          origemNivelAvancado: 6,
        },
      ],
      progressaoAvancada: {
        6: { id: "nova", nome: "Escolha atual", descricao: "Efeito" },
        7: { id: "outra", nome: "Outra escolha", descricao: "Efeito 2" },
      },
    };

    expect(listarHabilidadesCriadasJogador(personagem)).toEqual([
      expect.objectContaining({ id: "manual" }),
    ]);
    expect(listarHabilidadesProgressaoAvancada(personagem)).toEqual([
      expect.objectContaining({ nome: "Escolha atual", grupo: "Especialismo", nivel: 6 }),
      expect.objectContaining({ nome: "Outra escolha", grupo: "Especialismo", nivel: 7 }),
    ]);
  });

  it("mantem um marco legado quando nao ha escolha estruturada", () => {
    const personagem = {
      habilidadesCriadas: [
        {
          id: "marco-8-legado",
          nome: "Legado",
          recurso: "marco",
          origemNivelAvancado: 8,
        },
      ],
    };

    expect(listarHabilidadesProgressaoAvancada(personagem)).toEqual([
      expect.objectContaining({ nome: "Legado", grupo: "Especialismo", nivel: 8 }),
    ]);
  });
});
