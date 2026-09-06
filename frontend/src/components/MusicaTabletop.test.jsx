import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MusicaTabletop from "./MusicaTabletop";

let player;
let events;
const musicas = [{ id: "1", nome: "Trilha", url: "https://youtu.be/abcdefghijk" }];

beforeEach(() => {
  localStorage.clear();
  player = {
    cuePlaylist: jest.fn(),
    setVolume: jest.fn(),
    getPlaylistIndex: jest.fn(() => 0),
    getCurrentTime: jest.fn(() => 120),
    seekTo: jest.fn(),
    playVideo: jest.fn(),
    playVideoAt: jest.fn(),
    pauseVideo: jest.fn(),
    destroy: jest.fn(),
  };
  window.YT = {
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    Player: jest.fn((elemento, config) => {
      events = config.events;
      return player;
    }),
  };
});

afterEach(() => { delete window.YT; });

async function montar(props = {}) {
  render(<MusicaTabletop campanhaId="teste" musicasCampanha={musicas} {...props} />);
  await act(async () => {});
  act(() => events.onReady({ target: player }));
}

function terminar() {
  act(() => events.onStateChange({ target: player, data: 0 }));
}

test("repetir reinicia a faixa e mantém os ouvintes tocando em cada ciclo", async () => {
  const publicar = jest.fn();
  await montar({ aoAlterarEstado: publicar });
  fireEvent.click(screen.getByTitle("Repetir musica"));
  publicar.mockClear();
  terminar();
  terminar();
  expect(player.seekTo).toHaveBeenNthCalledWith(1, 0, true);
  expect(player.seekTo).toHaveBeenNthCalledWith(2, 0, true);
  expect(player.playVideo).toHaveBeenCalledTimes(2);
  expect(publicar).toHaveBeenLastCalledWith(expect.objectContaining({
    indice: 0, tempo: 0, tocando: true, repetindo: true,
  }));
  expect(publicar.mock.calls.every(([estado]) => estado.tocando)).toBe(true);
  fireEvent.click(screen.getByTitle("Desativar repeticao"));
  terminar();
  expect(player.playVideo).toHaveBeenCalledTimes(2);
  expect(publicar).toHaveBeenLastCalledWith(expect.objectContaining({ tocando: false, repetindo: false }));
});

test("a repetição continua desligada por padrão", async () => {
  await montar();
  terminar();
  expect(player.seekTo).not.toHaveBeenCalled();
  expect(player.playVideo).not.toHaveBeenCalled();
});

test("ouvinte reinicia a faixa quando a repetição remota está ativa", async () => {
  const publicar = jest.fn();
  await montar({ controlavel: false, aoAlterarEstado: publicar,
    estadoRemoto: { indice: 0, tempo: 0, tocando: true, repetindo: true } });
  player.seekTo.mockClear();
  player.playVideo.mockClear();
  terminar();
  expect(player.seekTo).toHaveBeenCalledWith(0, true);
  expect(player.playVideo).toHaveBeenCalledTimes(1);
  expect(publicar).not.toHaveBeenCalled();
});
