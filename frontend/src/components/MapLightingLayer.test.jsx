import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MapLightingLayer, { pontoVisivelPorLuz } from "./MapLightingLayer";

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

test("cones respeitam angulo, alcance, paredes e portas fechadas", () => {
  const luz = { x: 10, y: 10, tipo: "cone", direcao: 0, abertura: 70, alcance: 18 };
  const alvo = { x: 20, y: 10 };
  expect(pontoVisivelPorLuz(luz, alvo)).toBe(true);
  expect(pontoVisivelPorLuz(luz, { x: 5, y: 10 })).toBe(false);
  expect(pontoVisivelPorLuz(luz, { x: 40, y: 10 })).toBe(false);
  expect(pontoVisivelPorLuz(luz, alvo, [{ x1: 15, y1: 0, x2: 15, y2: 20 }])).toBe(false);
});
