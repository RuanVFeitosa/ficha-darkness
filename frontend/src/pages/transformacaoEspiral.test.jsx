import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransformacaoEspiral from './transformacaoEspiral';
import { freshSheet } from '../data/espiral';
import { buscarFichaEspiral, salvarFichaEspiral } from '../services/espiralApi';
jest.mock('../services/espiralApi',()=>({buscarFichaEspiral:jest.fn(),salvarFichaEspiral:jest.fn()}));

const key='espiral:sheet:v1:1234';
beforeEach(()=>{
 localStorage.clear();jest.clearAllMocks();
 window.history.replaceState({},'','/?sistema=espiral&transformacao=1&ficha=1234');
});
async function purchase() {
 fireEvent.click(screen.getByRole('button',{name:'03 Habilidades'}));
 fireEvent.click(screen.getByRole('button',{name:/Golpe Calculado/}));
 const button=screen.getByRole('button',{name:/Adquirir · 3 pontos/});
 await waitFor(()=>expect(button).toBeEnabled());
 fireEvent.click(button);
}
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
