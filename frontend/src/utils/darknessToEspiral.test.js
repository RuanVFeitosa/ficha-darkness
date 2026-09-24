import { convertDarknessToEspiral, stageFromDarknessAttribute } from "./darknessToEspiral";

test("converte a escala antiga e não soma as integridades regionais", () => {
  const sheet = convertDarknessToEspiral({
    nome: "Mara",
    fichaId: "mara-01",
    atributos: { forca: 31, fonitude: 22, inteligencia: 10, reflexos: 20, vontade: 10 },
    membros: { torso: { atual: 500, max: 500, ferido: false } },
    habilidadesPassivas: { lutar: 3, investigacao: 2, disciplina: 1 },
    habilidadesCombate: { percepcao: 0, carisma: 0 },
    sanidade: { atual: 50 }, esperanca: { atual: 30 },
  });
  expect(stageFromDarknessAttribute(40)).toBe(5);
  expect(sheet.attributes.pulso).toBe(4);
  expect(sheet.integrity).toBe(45);
  expect(sheet.resources.Armas).toBe(3);
  expect(sheet.resources["Investigação"]).toBe(2);
  expect(sheet.sanity).toBe(5);
  expect(sheet.migratedFromId).toBe("mara-01");
});

test("permite escolher Fortitude como fonte de Pulso", () => {
  const sheet = convertDarknessToEspiral({ atributos: { forca: 10, fonitude: 40 } }, { pulseSource: "fonitude" });
  expect(sheet.attributes.pulso).toBe(5);
  expect(sheet.integrity).toBe(50);
});
