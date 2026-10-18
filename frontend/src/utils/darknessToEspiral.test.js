import { convertDarknessToEspiral, stageFromDarknessAttribute, gradeFromDarknessSkill } from "./darknessToEspiral";

test("converte a escala antiga e não soma as integridades regionais", () => {
  const sheet = convertDarknessToEspiral({
    nome: "Mara",
    fichaId: "mara-01",
    atributos: { forca: 31, fonitude: 22, inteligencia: 10, reflexos: 20, vontade: 10 },
    membros: { torso: { atual: 500, max: 500, ferido: false } },
    habilidadesPassivas: { lutar: 15, investigacao: 10, disciplina: 5 },
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

test('Sentido usa Reflexos e Voz usa Vontade, sem interferência dos Ativos',()=>{
 const sheet=convertDarknessToEspiral({atributos:{forca:10,fonitude:40,reflexos:9,vontade:20},habilidadesCombate:{percepcao:50,carisma:50}});
 expect(sheet.attributes).toEqual({pulso:5,razao:1,sentido:1,voz:3});
 expect(sheet.integrity).toBe(50);
});

test.each([[0,0],[4,0],[5,1],[10,2],[15,3],[20,4],[50,4]])('recurso antigo %s corresponde ao grau %s',(antigo,grau)=>{
 expect(gradeFromDarknessSkill(antigo)).toBe(grau);
});

test('usa o maior valor de cada grupo de recursos sem somar passivas',()=>{
 const sheet=convertDarknessToEspiral({habilidadesPassivas:{investigacao:5,memoria:15,raciocinioLogico:10,conhecimentoMedico:20,pilotagem:10}});
 expect(sheet.resources['Investigação']).toBe(3);
 expect(sheet.resources.Medicina).toBe(4);
 expect(sheet.resources['Condução']).toBe(2);
});
