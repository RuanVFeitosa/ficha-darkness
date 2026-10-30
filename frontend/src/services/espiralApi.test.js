import { buscarPersonagem, salvarPersonagem } from './personagemApi';
import { freshSheet } from '../data/espiral';
import { buscarFichaEspiral, salvarFichaEspiral, unirFichasEspiral } from './espiralApi';
jest.mock('./personagemApi', () => ({buscarPersonagem:jest.fn(),salvarPersonagem:jest.fn()}));
beforeEach(() => jest.clearAllMocks());

test('salva ESPIRAL no servidor sem colidir com uma ficha Darkness de mesmo código', async () => {
  const sheet = {...freshSheet(),name:'Maya'};
  salvarPersonagem.mockImplementation(async (id,data) => data);
  await salvarFichaEspiral('5258881',sheet);
  expect(salvarPersonagem).toHaveBeenCalledWith('espiral_5258881',expect.objectContaining({name:'Maya',nome:'Maya',sistema:'espiral',espiralId:'5258881'}));
  await salvarFichaEspiral('principal',freshSheet());
  expect(salvarPersonagem).toHaveBeenCalledTimes(1);
});

test('recupera uma ficha compartilhada sem depender de armazenamento local', async () => {
  buscarPersonagem.mockResolvedValue({...freshSheet(),name:'Maya',resources:{'Controle Mental':0}});
  expect(await buscarFichaEspiral('5258881')).toMatchObject({name:'Maya',resources:{'Controle Mental':1,'Propósito':1}});
  expect(buscarPersonagem).toHaveBeenCalledWith('espiral_5258881');
  buscarPersonagem.mockResolvedValue({nome:'Ficha Darkness',atributos:{}});
  expect(await buscarFichaEspiral('5258881')).toBeNull();
});

test('o painel combina sistemas sem duplicar a cópia local da ficha compartilhada', () => {
  const local = {fichaId:'espiral:1234',espiralId:'1234',personagem:{...freshSheet(),name:'Antigo'}};
  const remote = {fichaId:'espiral_1234',personagem:{...freshSheet(),name:'Maya',espiralId:'1234'}};
  const darkness = {fichaId:'1234',personagem:{nome:'Jorge',atributos:{}}};
  const result = unirFichasEspiral([local],[remote,darkness]);
  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({fichaId:'espiral:1234',espiralId:'1234',sistema:'espiral',personagem:{name:'Maya'}});
  expect(result[1]).toBe(darkness);
});
