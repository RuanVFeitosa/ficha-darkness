import { tipoAudioUpload } from "./audioUpload";
import { validarArquivoImagem } from "../services/mesaApi";

test.each([
  ["som.mp3", "audio/mpeg", "audio/mpeg"],
  ["som.wav", "audio/x-wav", "audio/wav"],
  ["som.m4a", "audio/x-m4a", "audio/mp4"],
  ["som.ogg", "application/ogg", "audio/ogg"],
  ["som.opus", "audio/opus", "audio/ogg"],
  ["som.flac", "audio/x-flac", "audio/flac"],
  ["som.aac", "audio/aac", "audio/aac"],
  ["som.webm", "audio/webm", "audio/webm"],
  ["SOM.MP3", "", "audio/mpeg"],
  ["som.wav", "application/octet-stream", "audio/wav"],
])("aceita %s com MIME %s", (name, type, esperado) => {
  const arquivo = new File(["audio"], name, { type });
  expect(tipoAudioUpload(arquivo)).toBe(esperado);
  expect(validarArquivoImagem(arquivo, "audio")).toBe(arquivo);
});

test("rejeita outros arquivos e mantem o limite de 20 MB", () => {
  expect(() => validarArquivoImagem(new File(["html"], "som.mp3", { type: "text/html" }), "audio")).toThrow("Formato de audio");
  expect(() => validarArquivoImagem(new File(["x"], "som.exe"), "audio")).toThrow("Formato de audio");
  expect(() => validarArquivoImagem({ name: "som.mp3", type: "audio/mpeg", size: 20 * 1024 * 1024 + 1 }, "audio")).toThrow("20 MB");
});
