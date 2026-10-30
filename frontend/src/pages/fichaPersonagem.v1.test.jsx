jest.mock('react-markdown', () => ({ __esModule:true, default:({children}) => <div>{children}</div> }));
jest.mock('remark-gfm', () => ({ __esModule:true, default:() => {} }));
jest.mock('../services/personagemApi', () => ({ buscarPersonagem:jest.fn(), buscarArvoresHabilidades:jest.fn(), salvarPersonagem:jest.fn() }));
jest.mock('../services/mesaApi', () => ({ listarCampanhasDaFicha:jest.fn().mockResolvedValue([]), registrarRolagem:jest.fn() }));
jest.mock('../components/jogador/PlayerPageLink', () => ({ __esModule:true, default:({children}) => <a href="?jogador=teste">{children}</a> }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Ficha, { estadoInicial } from './fichaPersonagem';
import { buscarPersonagem, buscarArvoresHabilidades, salvarPersonagem } from '../services/personagemApi';
import { criarBaseV1 } from '../data/absolutoV1';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({},'', '/?sistema=darkness&ficha=teste-original');
  window.matchMedia=jest.fn(() => ({matches:false}));
  jest.spyOn(console,'log').mockImplementation(() => {});
  buscarArvoresHabilidades.mockResolvedValue(null);
  buscarPersonagem.mockResolvedValue({ ...estadoInicial, ...criarBaseV1({forca:1,fonitude:1,inteligencia:3,vontade:1,reflexos:1},{razao:2}), nome:'Lia', inventario:[], rituais:[] });
  salvarPersonagem.mockImplementation(async (id,p) => p);
});
afterEach(() => { jest.restoreAllMocks(); delete window.matchMedia; });

test('ficha antiga abre em 1.0 sem botão e salva automaticamente com o original preservado', async () => {
  const antiga = {...estadoInicial, nome:'Lia antiga', atributos:{forca:30,fonitude:20,inteligencia:40,vontade:20,reflexos:10}, habilidadesCombate:{firmeza:3}, inventario:[], rituais:[]};
  buscarPersonagem.mockResolvedValue(antiga);
  render(<Ficha/>);
  await screen.findByRole('button',{name:'Rolar Razão'});
  expect(screen.queryByRole('button',{name:/adapta.*1\.0/i})).not.toBeInTheDocument();
  await waitFor(() => expect(salvarPersonagem).toHaveBeenCalledWith('teste-original', expect.objectContaining({versaoRegras:'1.0', legadoAbsoluto:antiga})), {timeout:3000});
});

test('a ficha 1.0 mantém colunas, linhas e modal originais e incorpora Medo e os nove Domínios', async () => {
  jest.spyOn(Math,'random').mockReturnValue(.5);
  const {container}=render(<Ficha/>);
  await screen.findByRole('button',{name:'Rolar Razão'});
  expect(container.querySelector('.main-content > .profile-section')).toBeInTheDocument();
  expect(container.querySelector('.main-content > .sidebar-container')).toBeInTheDocument();
  expect(container.querySelectorAll('.lista-ativos .ativo-item')).toHaveLength(9);
  expect(container.querySelector('.abs-v1-heading')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Medo atual')).toHaveValue(0);
  fireEvent.click(screen.getByRole('button',{name:'Rolar Razão'}));
  await waitFor(() => expect(container.querySelector('.modal-rolagem')).toBeInTheDocument());
  expect(container.querySelectorAll('.modal-rolagem .dado-rolagem')).toHaveLength(3);
  expect(container.querySelectorAll('.modal-rolagem .dado-rolagem.rolando')).toHaveLength(3);
  expect(screen.queryByText('Êxitos / DT 1')).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Êxitos / DT 1')).toBeInTheDocument(), {timeout:2500});
  expect(container.querySelectorAll('.modal-rolagem .dado-rolagem.rolando')).toHaveLength(0);
  expect(screen.queryByText(/Passiva: \+/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Fechar',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'CORPO',exact:true}));
  expect(container.querySelectorAll('.controles-membros-sidebar .membro-controle')).toHaveLength(8);
  expect(screen.getByText('PESCOÇO')).toBeInTheDocument();
  expect(screen.getByText('ABDÔMEN')).toBeInTheDocument();
});
