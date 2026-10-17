jest.mock("@react-three/fiber", () => ({useFrame:jest.fn()}));
jest.mock("three", () => ({}));
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashlightControls, normalizarLanterna, direcaoDaCamera } from "./TokenFlashlight";
test("liga a lanterna preservando os ajustes", () => {
  const onChange = jest.fn();
  render(<FlashlightControls value={{ ativa: false, alcance: 25, direcao: 45, abertura: 60, cor: "#abcdef" }} onChange={onChange}/>);
  fireEvent.click(screen.getByRole("checkbox", { name: "Lanterna ligada" }));
  expect(onChange).toHaveBeenCalledWith({ ativa: true, alcance: 25, direcao: 45, abertura: 60, cor: "#abcdef" });
});
test("permite ajustar o alcance mantendo a lanterna ligada", () => {
  const onChange = jest.fn();
  render(<FlashlightControls value={{ ativa: true, alcance: 18 }} onChange={onChange}/>);
  fireEvent.change(screen.getByLabelText("Alcance da lanterna"), { target: { value: "25" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ativa: true, alcance: 25, direcao: 0 }));
});
test("limita valores inválidos antes de criar a luz", () => {
  expect(normalizarLanterna({ alcance: 999, abertura: -10, direcao: 999, cor: "invalid" })).toEqual({ ativa: false, alcance: 60, abertura: 20, direcao: 180, cor: "#fff1cd" });
});

test("a direção da câmera preserva a inclinação vertical e o rumo", () => {const aim=direcaoDaCamera([1,1,0]);expect(aim.direcao).toBeCloseTo(90);expect(aim.vetor[1]).toBeCloseTo(Math.SQRT1_2);expect(direcaoDaCamera([0,0,-1]).direcao).toBe(0);});
