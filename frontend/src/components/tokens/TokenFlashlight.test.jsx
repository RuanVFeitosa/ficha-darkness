jest.mock("@react-three/fiber", () => ({useFrame:jest.fn()}));
jest.mock("three", () => ({}));
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashlightControls, normalizarLanterna, direcaoDaCamera } from "./TokenFlashlight";
test("liga a lanterna preservando os ajustes", () => {
  const onChange = jest.fn();
  render(<FlashlightControls value={{ ativa: false, alcance: 25, direcao: 45, abertura: 60, cor: "#abcdef" }} onChange={onChange}/>);
  fireEvent.click(screen.getByRole("checkbox", { name: "Lanterna ligada" }));
  expect(onChange).toHaveBeenCalledWith({ ativa: true, modo:"normal", alcance: 25, direcao: 45, abertura: 60, cor: "#abcdef" });
});
test("permite ajustar o alcance mantendo a lanterna ligada", () => {
  const onChange = jest.fn();
  render(<FlashlightControls value={{ ativa: true, alcance: 18 }} onChange={onChange}/>);
  fireEvent.change(screen.getByLabelText("Alcance da lanterna"), { target: { value: "25" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ativa: true, alcance: 25, direcao: 0 }));
});
test("limita valores inválidos antes de criar a luz", () => {
  expect(normalizarLanterna({ alcance: 999, abertura: -10, direcao: 999, cor: "invalid" })).toEqual({ ativa: false, modo:'normal', alcance: 60, abertura: 20, direcao: 180, cor: "#fff1cd" });
});

test('alterna entre UV e luz comum preservando os ajustes',()=>{
 const onChange=jest.fn();render(<FlashlightControls value={{ativa:true,alcance:25,modo:'normal'}} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ultravioleta · UV'}));
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({modo:'uv',ativa:true,alcance:25}));
 expect(normalizarLanterna({modo:'uv'}).modo).toBe('uv');
 expect(normalizarLanterna({modo:'invalid'}).modo).toBe('normal');
});

test('UV bloqueada pelo mestre fica desabilitada para o jogador',()=>{
 const onChange=jest.fn();render(<FlashlightControls value={{ativa:true,modo:'uv'}} uvAllowed={false} onChange={onChange}/>);
 expect(screen.getByRole('button',{name:'Ultravioleta · UV'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Luz comum'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Ultravioleta · UV'}));
 expect(onChange).not.toHaveBeenCalled();
});

test("a direção da câmera preserva a inclinação vertical e o rumo", () => {const aim=direcaoDaCamera([1,1,0]);expect(aim.direcao).toBeCloseTo(90);expect(aim.vetor[1]).toBeCloseTo(Math.SQRT1_2);expect(direcaoDaCamera([0,0,-1]).direcao).toBe(0);});
