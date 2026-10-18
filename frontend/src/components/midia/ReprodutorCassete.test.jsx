import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ReprodutorCassete from "./ReprodutorCassete";

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function () { fireEvent.play(this); return Promise.resolve(); });
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function () { fireEvent.pause(this); });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test("reproduz, rebobina progressivamente e interrompe o motor ao pausar", async () => {
  const close = jest.fn().mockResolvedValue();
  window.AudioContext = jest.fn(() => ({
    resume: () => Promise.resolve(), close, sampleRate: 20, destination: {},
    createGain: () => ({ gain: {}, connect() {} }),
    createOscillator: () => ({ frequency: {}, connect() {}, start() {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(20) }),
    createBufferSource: () => ({ connect() {}, start() {} }),
    createBiquadFilter: () => ({ frequency: {}, connect() {} }),
  }));
  const { container, unmount } = render(<ReprodutorCassete documento={{ nome: "Depoimento", url: "/voz.mp3" }} />);
  const audio = container.querySelector("audio");
  Object.defineProperty(audio, "duration", { value: 60 });
  fireEvent.loadedMetadata(audio);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /Play/ })));
  expect(screen.getByRole("status").textContent).toContain("REPRODUZINDO");
  audio.currentTime = 10;
  fireEvent.timeUpdate(audio);
  fireEvent.click(screen.getByRole("button", { name: /Rebobinar/ }));
  act(() => jest.advanceTimersByTime(160));
  expect(audio.currentTime).toBeCloseTo(6.8);
  fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
  expect(close).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(160));
  expect(audio.currentTime).toBeCloseTo(6.8);
  fireEvent.click(screen.getByRole("button", { name: /Rebobinar/ }));
  act(() => jest.advanceTimersByTime(1000));
  expect(audio.currentTime).toBe(0);
  expect(close).toHaveBeenCalledTimes(2);
  audio.currentTime = 10;
  fireEvent.timeUpdate(audio);
  fireEvent.click(screen.getByRole("button", { name: /Rebobinar/ }));
  unmount();
  expect(close).toHaveBeenCalledTimes(3);
  expect(jest.getTimerCount()).toBe(0);
  delete window.AudioContext;
});
