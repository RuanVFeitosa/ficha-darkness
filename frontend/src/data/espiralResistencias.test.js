import { freshSheet, creationWarnings, normalizarResistenciasEspiral, normalizarFichaEspiral, atualizarResistenciasEspiralSalvas } from './espiral';

beforeEach(() => localStorage.clear());

test('novas fichas recebem as duas resistências sem gastar pontos convencionais', () => {
  const sheet = freshSheet();
  expect(sheet.resources).toMatchObject({'Controle Mental':1,'Propósito':1,Armas:0});
  expect(creationWarnings(sheet).resourceSpent).toBe(0);
});

test('corrige zeros e campos ausentes, preservando progressão e demais dados', () => {
  const old = {...freshSheet(), name:'Maya', resources:{Armas:2,'Controle Mental':0,'Propósito':3}};
  const updated = normalizarResistenciasEspiral(old);
  expect(updated.resources).toEqual({Armas:2,'Controle Mental':1,'Propósito':3});
  expect(updated.name).toBe('Maya');
  expect(old.resources['Controle Mental']).toBe(0);
  expect(normalizarResistenciasEspiral(updated)).toBe(updated);
  expect(normalizarResistenciasEspiral({resources:{}}).resources).toEqual({'Controle Mental':1,'Propósito':1});
});

test('atualiza todas as fichas locais e tolera um registro inválido', () => {
  localStorage.setItem('espiral:sheet:v1:invalida','{');
  for (const id of ['maya','outro']) localStorage.setItem(`espiral:sheet:v1:${id}`, JSON.stringify({...freshSheet(), resources:{'Controle Mental':0,'Propósito':0}}));
  localStorage.setItem('fichaRPG_personagem_darkness',JSON.stringify({resources:{}}));
  atualizarResistenciasEspiralSalvas(localStorage);
  for (const id of ['maya','outro']) expect(JSON.parse(localStorage.getItem(`espiral:sheet:v1:${id}`)).resources).toMatchObject({'Controle Mental':1,'Propósito':1,'Investigação':0});
  expect(localStorage.getItem('fichaRPG_personagem_darkness')).toBe('{"resources":{}}');
});

test('ficha incompleta recebe recursos e atributos válidos sem apagar progressão', () => {
 const original={name:'Maya',resources:{Armas:'3',Medicina:'inválido'},attributes:{pulso:4},evolution:{points:7}};
 const sheet=normalizarFichaEspiral(original);
 expect(sheet.resources).toMatchObject({Armas:3,Medicina:0,'Investigação':0,'Controle Mental':1});
 expect(sheet.attributes).toEqual({pulso:4,razao:2,sentido:2,voz:2});
 expect(sheet.evolution.points).toBe(7);
 expect(normalizarFichaEspiral(sheet)).toEqual(sheet);
 expect(original.resources['Investigação']).toBeUndefined();
});
