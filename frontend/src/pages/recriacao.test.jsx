import React from 'react';
import {render,renderHook,act,screen,fireEvent,waitFor} from '@testing-library/react';
import {CriacaoEspiral} from './cadastroPersonagem';
import CriarPersonagem from './criarPersonagem';
import {buscarPersonagem,solicitarRecriacao} from '../services/personagemApi';
import useRecriacao from '../utils/useRecriacao';
import {freshSheet} from '../data/espiral';
import {criarBaseV1} from '../data/absolutoV1';
jest.mock('../services/personagemApi',()=>({buscarPersonagem:jest.fn(),solicitarRecriacao:jest.fn()}));
jest.mock('./fichaPersonagem',()=>({estadoInicial:{atributos:{},inventario:[]}}));

beforeEach(()=>{jest.clearAllMocks();localStorage.clear();window.matchMedia=jest.fn(()=>({matches:true}));});
afterEach(()=>delete window.matchMedia);

test.each(['espiral','darkness'])('envia proposta de %s sem gravar as alterações na ficha ativa',async sistema=>{
 const original=sistema==='espiral'?{...freshSheet(),name:'Maya'}:{...criarBaseV1(),nome:'Lia'};
 buscarPersonagem.mockResolvedValue(original);
 solicitarRecriacao.mockResolvedValue({...original,recriacaoPendente:{id:'request'}});
 window.history.replaceState({},'',`/?criar=1&sistema=${sistema}&refazer=1234`);
 const {result}=renderHook(()=>useRecriacao(sistema));
 await waitFor(()=>expect(result.current.original).toEqual(original));
 const proposed={...original,[sistema==='espiral'?'name':'nome']:'Novo nome'};
 await act(async()=>{await result.current.enviar(proposed);});
 expect(solicitarRecriacao).toHaveBeenCalledWith(sistema==='espiral'?'espiral_1234':'1234',original,proposed);
 const cached=JSON.parse(localStorage.getItem(sistema==='espiral'?'espiral:sheet:v1:1234':'fichaRPG_personagem_1234'));
 expect(cached[sistema==='espiral'?'name':'nome']).toBe(sistema==='espiral'?'Maya':'Lia');
 expect(cached.recriacaoPendente.id).toBe('request');
});

test('reabre criação ESPIRAL preenchida e mantém o código da ficha',async()=>{
 const sheet={...freshSheet(),name:'Maya',player:'Ana',occupation:'Médica',evolution:{points:10}};
 buscarPersonagem.mockResolvedValue(sheet);
 window.history.replaceState({},'','/?criar=1&sistema=espiral&refazer=1234');
 render(<CriacaoEspiral/>);
 await waitFor(()=>expect(screen.getByLabelText('Nome do personagem')).toHaveValue('Maya'));
 expect(screen.getByLabelText('Nome do jogador')).toHaveValue('Ana');
 for(let index=0;index<4;index++)fireEvent.click(screen.getByRole('button',{name:'Continuar →'}));
 expect(screen.getByLabelText(/Código da ficha/)).toHaveValue('1234');
 expect(screen.getByLabelText(/Código da ficha/)).toHaveAttribute('readonly');
 fireEvent.click(screen.getByRole('button',{name:'Continuar →'}));
 expect(screen.getByRole('button',{name:'Enviar ao mestre ↗'})).toBeInTheDocument();
 expect(sheet.evolution.points).toBe(10);
});

test('reabre criação do Absoluto com a identidade existente sem iniciar outra ficha',async()=>{
 buscarPersonagem.mockResolvedValue({...criarBaseV1(),nome:'Lia',pronome:'Ela',classe:'A Renegada',classeId:'renegado',arquetipo:'Humana',arquetipoId:'humano'});
 window.history.replaceState({},'','/?criar=1&sistema=darkness&refazer=4321');
 render(<CriarPersonagem/>);
 expect(await screen.findByLabelText('Nome')).toHaveValue('Lia');
 expect(buscarPersonagem).toHaveBeenCalledWith('4321');
 expect(screen.getByText(/sua proposta será enviada ao mestre/)).toBeInTheDocument();
});
