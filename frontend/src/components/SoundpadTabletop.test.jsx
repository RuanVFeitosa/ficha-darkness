import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import SoundpadTabletop from "./SoundpadTabletop";

let audios;
beforeEach(() => {
  audios = [];
  jest.spyOn(window, "Audio").mockImplementation(() => {
    const audio = document.createElement("audio");
    audios.push(audio);
    return audio;
  });
  jest.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const som = { id: "aplauso", nome: "Aplauso", url: "/som.mp3", loop: false, fadeIn: 0, fadeOut: 0 };
const estado = { ativos: { aplauso: { iniciadoEm: "primeiro" } } };

test("termina sem loop, remove o estado ativo e permite novo disparo", async () => {
  const publicar = jest.fn();
  const { container, rerender } = render(<SoundpadTabletop sons={[som]} estadoRemoto={estado} aoAlterarEstado={publicar} />);
  await act(async () => {});
  fireEvent.canPlay(audios[0]);
  fireEvent.ended(audios[0]);
  expect(container.querySelector("article.ativo")).toBeNull();
  expect(publicar).toHaveBeenCalledWith(expect.objectContaining({ ativos: {} }));
  const chamadas = HTMLMediaElement.prototype.play.mock.calls.length;
  rerender(<SoundpadTabletop sons={[som]} estadoRemoto={{ ...estado, volumeGeral: 50 }} aoAlterarEstado={publicar} />);
  await act(async () => {});
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(chamadas);
  rerender(<SoundpadTabletop sons={[som]} estadoRemoto={{ ativos: { aplauso: { iniciadoEm: "segundo" } } }} aoAlterarEstado={publicar} />);
  await act(async () => {});
  expect(HTMLMediaElement.prototype.play.mock.calls.length).toBeGreaterThan(chamadas);
});

test("loop permanece ativo e pode ser desligado durante a reproducao", async () => {
  const publicar = jest.fn();
  const { container, rerender } = render(<SoundpadTabletop sons={[{ ...som, loop: true }]} estadoRemoto={estado} aoAlterarEstado={publicar} />);
  await act(async () => {});
  expect(audios[0].loop).toBe(true);
  fireEvent.ended(audios[0]);
  expect(container.querySelector("article.ativo")).not.toBeNull();
  expect(publicar).not.toHaveBeenCalled();
  rerender(<SoundpadTabletop sons={[{ ...som, loop: true }]} estadoRemoto={{ ...estado, ajustes: { aplauso: { loop: false } } }} aoAlterarEstado={publicar} />);
  await act(async () => {});
  expect(audios[0].loop).toBe(false);
  fireEvent.ended(audios[0]);
  expect(container.querySelector("article.ativo")).toBeNull();
});

test("ouvinte encerra localmente sem publicar estado da campanha", async () => {
  const publicar = jest.fn();
  const { container } = render(<SoundpadTabletop sons={[som]} estadoRemoto={estado} controlavel={false} aoAlterarEstado={publicar} />);
  await act(async () => {});
  fireEvent.ended(audios[0]);
  expect(container.querySelector("article.ativo")).toBeNull();
  expect(publicar).not.toHaveBeenCalled();
});
