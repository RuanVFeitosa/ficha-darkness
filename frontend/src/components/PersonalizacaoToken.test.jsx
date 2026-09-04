import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PersonalizacaoToken from "./PersonalizacaoToken";
import { coresBordaToken, estiloBordaToken } from "../utils/tokenAppearance";

test("permite editar até quatro cores, remover e restaurar o padrão", () => {
  function Ficha() {
    const [coresToken, alterar] = useState([]);
    return <PersonalizacaoToken personagem={{ nome: "Agente", coresToken }} aoAlterar={alterar} />;
  }
  render(<Ficha />);
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole("button", { name: /Adicionar cor/ }));
  expect(screen.getByRole("button", { name: /Adicionar cor/ }).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Cor 2"), { target: { value: "#123456" } });
  expect(screen.getByLabelText("Cor 2").value).toBe("#123456");
  fireEvent.click(screen.getByRole("button", { name: "Remover cor 2" }));
  expect(screen.queryByLabelText("Cor 4")).toBeNull();
  expect(screen.getByRole("button", { name: /Adicionar cor/ }).disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Usar borda padrão da mesa" }));
  expect(screen.queryByLabelText("Cor 1")).toBeNull();
});

test("fichas antigas mantêm o padrão e cores inválidas não chegam ao CSS", () => {
  expect(estiloBordaToken(undefined)).toEqual({});
  expect(coresBordaToken(["red", null, "#112233", "#445566", "#778899", "#aabbcc", "#ddeeff"])).toHaveLength(4);
  expect(estiloBordaToken(["#112233"]).background).toBe("#112233");
  expect(estiloBordaToken(["#112233", "#445566"]).background).toBe("conic-gradient(#112233, #445566, #112233)");
});
