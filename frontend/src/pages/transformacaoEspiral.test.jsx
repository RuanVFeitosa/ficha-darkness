import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import TransformacaoEspiral from './transformacaoEspiral';
import { freshSheet } from '../data/espiral';
import { buscarFichaEspiral, salvarFichaEspiral } from '../services/espiralApi';
jest.mock('../services/espiralApi',()=>({buscarFichaEspiral:jest.fn(),salvarFichaEspiral:jest.fn()}));

const key='espiral:sheet:v1:1234';
beforeEach(()=>{
 localStorage.clear();jest.clearAllMocks();
 window.history.replaceState({},'','/?sistema=espiral&transformacao=1&ficha=1234');
});

test('atributos mostram estágio, próximo dado e custo; avançar desconta somente o valor indicado', async () => {
 const sheet={...freshSheet(),attributes:{pulso:4,razao:3,sentido:3,voz:3},evolution:{points:6,abilities:[]}};
 buscarFichaEspiral.mockResolvedValue(sheet);
 salvarFichaEspiral.mockImplementation(async(id,next)=>next);
 render(<TransformacaoEspiral/>);
 await waitFor(()=>expect(buscarFichaEspiral).toHaveBeenCalled());
 fireEvent.click(screen.getByRole('button',{name:'02 Atributos'}));
 const card=screen.getByRole('article',{name:'Pulso'});
 expect(within(card).getByText('Vigoroso')).toBeInTheDocument();
 expect(within(card).getByText('Imponente')).toBeInTheDocument();
 expect(within(card).getByText('d10 → d12')).toBeInTheDocument();
 const advance=within(card).getByRole('button',{name:'Evoluir Pulso para o estágio 5'});
 await waitFor(()=>expect(advance).toBeEnabled());
 fireEvent.click(advance);
 await waitFor(()=>expect(salvarFichaEspiral).toHaveBeenCalledWith('1234',expect.objectContaining({attributes:expect.objectContaining({pulso:5}),evolution:expect.objectContaining({points:0})})));
 expect(within(card).getByRole('button',{name:'Pulso: estágio máximo'})).toBeDisabled();
 expect(screen.getAllByText('Faltam 5 pontos de evolução.')).toHaveLength(3);
});
async function purchase() {
 fireEvent.click(screen.getByRole('button',{name:'03 Habilidades'}));
 fireEvent.click(screen.getByRole('button',{name:/Golpe Calculado/}));
 const button=screen.getByRole('button',{name:/Adquirir · 3 pontos/});
 await waitFor(()=>expect(button).toBeEnabled());
 fireEvent.click(button);
}

test('reduzir devolve o custo do estágio e recomprar não gera pontos adicionais', async () => {
 const sheet={...freshSheet(),attributes:{pulso:4,razao:1,sentido:1,voz:1},evolution:{points:0,abilities:[]}};
 buscarFichaEspiral.mockResolvedValue(sheet);
 salvarFichaEspiral.mockImplementation(async(id,next)=>next);
 render(<TransformacaoEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'02 Atributos'}));
 const reduce=screen.getByRole('button',{name:'Diminuir Pulso'});
 await waitFor(()=>expect(reduce).toBeEnabled());
 expect(reduce).toHaveTextContent('+5 pontos');
 expect(screen.getByRole('button',{name:'Diminuir Razão'})).toBeDisabled();
 fireEvent.click(reduce);
 await screen.findByText('Pulso reduzido para o Estágio 3. Você recebeu 5 pontos de evolução.');
 expect(JSON.parse(localStorage.getItem(key))).toMatchObject({attributes:{pulso:3},evolution:{points:5}});
 fireEvent.click(screen.getByRole('button',{name:'Evoluir Pulso para o estágio 4'}));
 await screen.findByText('Pulso avançou para o Estágio 4.');
 expect(JSON.parse(localStorage.getItem(key))).toMatchObject({attributes:{pulso:4},evolution:{points:0}});
});

test('redução sem rede mantém os pontos e o atributo salvos localmente', async () => {
 buscarFichaEspiral.mockResolvedValue({...freshSheet(),attributes:{pulso:2,razao:1,sentido:1,voz:1},evolution:{points:1,abilities:[]}});
 salvarFichaEspiral.mockRejectedValue(new Error('Sem rede'));
 render(<TransformacaoEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'02 Atributos'}));
 const reduce=screen.getByRole('button',{name:'Diminuir Pulso'});
 await waitFor(()=>expect(reduce).toBeEnabled());
 fireEvent.click(reduce);
 await screen.findByText(/A sincronização está pendente/);
 expect(JSON.parse(localStorage.getItem(key))).toMatchObject({attributes:{pulso:1},evolution:{points:4}});
 expect(screen.getByRole('button',{name:'Diminuir Pulso'})).toBeDisabled();
 expect(localStorage.getItem('espiral:pending:1234')).toBe('1');
});
test('compra usa saldo atual do servidor, desconta pontos e persiste habilidade ao reabrir',async()=>{
 let remote={...freshSheet(),name:'Maya',evolution:{points:6,abilities:[]}};
 localStorage.setItem(key,JSON.stringify({...remote,evolution:{points:12,abilities:[]}}));
 buscarFichaEspiral.mockImplementation(async()=>remote);
 salvarFichaEspiral.mockImplementation(async(id,sheet)=>{remote=sheet;return sheet;});
 const view=render(<TransformacaoEspiral/>);
 await purchase();
 await screen.findByText('Golpe Calculado foi incorporada ao arquivo.');
 expect(salvarFichaEspiral).toHaveBeenCalledWith('1234',expect.objectContaining({evolution:{points:3,abilities:[{id:'Ofensiva:Golpe Calculado',name:'Golpe Calculado',category:'Ofensiva',level:1}]}}));
 expect(JSON.parse(localStorage.getItem(key)).evolution).toEqual(remote.evolution);
 expect(localStorage.getItem('espiral:pending:1234')).toBeNull();
 view.unmount();render(<TransformacaoEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'03 Habilidades'}));
 fireEvent.click(screen.getByRole('button',{name:/01 Golpe Calculado/}));
 expect(screen.queryByRole('button',{name:/Adquirir · 3 pontos/})).not.toBeInTheDocument();
 expect(remote.evolution.points).toBe(3);
});
test('falha na rede preserva compra e saldo local e marca sincronização pendente',async()=>{
 const sheet={...freshSheet(),name:'Maya',evolution:{points:3,abilities:[]}};
 localStorage.setItem(key,JSON.stringify(sheet));
 buscarFichaEspiral.mockResolvedValue(sheet);
 salvarFichaEspiral.mockRejectedValue(new Error('Sem rede'));
 render(<TransformacaoEspiral/>);
 await purchase();
 await screen.findByText(/A sincronização está pendente/);
 const saved=JSON.parse(localStorage.getItem(key));
 expect(saved.evolution.points).toBe(0);
 expect(saved.evolution.abilities[0].name).toBe('Golpe Calculado');
 expect(localStorage.getItem('espiral:pending:1234')).toBe('1');
});
