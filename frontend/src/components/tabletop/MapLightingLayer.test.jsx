import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MapLightingLayer, { pontoVisivelPorLuz, pontoVisivelPorObservadores, poligonoVisibilidade } from "./MapLightingLayer";

test("ativar Noite em um mapa novo escurece e permanece ao fechar o editor", () => {
  function Mapa() {
    const [configuracao, alterar] = useState({ periodo: "dia", escuridao: 0 });
    const [editando, editar] = useState(true);
    return <><button onClick={() => editar(false)}>Fechar</button><MapLightingLayer configuracao={configuracao} aoAlterar={alterar} editando={editando} /></>;
  }
  const { container } = render(<Mapa />);
  fireEvent.click(screen.getByRole("button", { name: "Noite" }));
  expect(Number(container.querySelector(".mapa-escuridao").getAttribute("opacity"))).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(container.querySelector(".mapa-escuridao")).not.toBeNull();
});

test("visao do jogador bloqueia areas iluminadas por outros tokens atras da parede", () => {
  const jogador = [{ x: 10, y: 50 }];
  const parede = [{ x1: 50, y1: 0, x2: 50, y2: 100 }];
  const alvo = { x: 70, y: 50 };
  expect(pontoVisivelPorLuz({ x: 65, y: 50, alcance: 20 }, alvo, parede)).toBe(true);
  expect(pontoVisivelPorObservadores(jogador, alvo, parede)).toBe(false);
  expect(pontoVisivelPorObservadores(jogador, alvo, [])).toBe(true);
  expect(pontoVisivelPorObservadores([], alvo)).toBe(false);
});

test("mascara pessoal funciona de dia e noite e atualiza ao abrir a porta", () => {
  const porta = { x1: 50, y1: 0, x2: 50, y2: 100, aberta: false };
  const props = { observadores: [{ x: 10, y: 50 }], luzesTokens: [{ id: "npc", x: 75, y: 50, alcance: 20 }] };
  const { container, rerender } = render(<MapLightingLayer {...props} configuracao={{ periodo: "dia", portas: [porta] }} />);
  const pontos = () => container.querySelector("#mascara-visao-jogador polygon").getAttribute("points").split(" ").map((ponto) => Number(ponto.split(",")[0]));
  expect(container.querySelector(".mapa-fora-de-visao")).not.toBeNull();
  expect(Math.max(...pontos())).toBeLessThanOrEqual(50.00001);
  rerender(<MapLightingLayer {...props} configuracao={{ periodo: "noite", portas: [{ ...porta, aberta: true }] }} />);
  expect(Math.max(...pontos())).toBe(100);
  expect(container.querySelector(".mapa-escuridao")).not.toBeNull();
  rerender(<MapLightingLayer configuracao={{ periodo: "dia" }} />);
  expect(container.querySelector(".mapa-fora-de-visao")).toBeNull();
});

test("poligono circular percorre os angulos em ordem sem cruzar o campo de visao", () => {
  const pontos = poligonoVisibilidade({ x: 50, y: 50, alcance: 20 }, [])
    .split(" ").map((ponto) => ponto.split(",").map(Number));
  const angulos = pontos.map(([x, y]) => Math.atan2(y - 50, x - 50));
  for (let i = 1; i < angulos.length; i += 1) expect(angulos[i]).toBeGreaterThanOrEqual(angulos[i - 1] - 1e-10);
});

test("cones respeitam angulo, alcance, paredes e portas fechadas", () => {
  const luz = { x: 10, y: 10, tipo: "cone", direcao: 0, abertura: 70, alcance: 18 };
  const alvo = { x: 20, y: 10 };
  expect(pontoVisivelPorLuz(luz, alvo)).toBe(true);
  expect(pontoVisivelPorLuz(luz, { x: 5, y: 10 })).toBe(false);
  expect(pontoVisivelPorLuz(luz, { x: 40, y: 10 })).toBe(false);
  expect(pontoVisivelPorLuz(luz, alvo, [{ x1: 15, y1: 0, x2: 15, y2: 20 }])).toBe(false);
});
