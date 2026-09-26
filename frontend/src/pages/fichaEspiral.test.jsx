import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import FichaEspiral from './fichaEspiral';
import { buscarPersonagem } from '../services/personagemApi';
import DialogoGlobal from '../components/DialogoGlobal';

jest.mock('../services/personagemApi', () => ({ buscarPersonagem: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  jest.clearAllMocks();
});

test('preserva dano ao aumentar Pulso e persiste a ficha', () => {
  const view = render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Integridade' }));
  fireEvent.change(screen.getByLabelText('Estágio de Pulso'), { target: { value: '3' } });
  expect(screen.getByRole('spinbutton', { name: 'Integridade' })).toHaveValue(39);
  view.unmount();
  render(<FichaEspiral />);
  expect(screen.getByRole('spinbutton', { name: 'Integridade' })).toHaveValue(39);
});

test('rolagem consome pressão e exibe o resultado', () => {
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => { array[0] = 0; return array; } } });
  render(<FichaEspiral />);
  fireEvent.change(screen.getByLabelText('Dados de Pressão', { exact: true }), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /Rolar os dados/ }));
  expect(screen.getByRole('spinbutton', { name: 'Dados de Pressão' })).toHaveValue(0);
  expect(screen.getByRole('heading', { name: 'Falha grave' })).toBeInTheDocument();
  expect(screen.getByText('Crise')).toBeInTheDocument();
  jest.restoreAllMocks();
});

test('identidade e anotações podem ser editadas', () => {
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: /Editar identidade/ }));
  fireEvent.change(screen.getByLabelText('Nome do personagem'), { target: { value: 'Helena' } });
  expect(screen.getByRole('link', { name: /ESPIRAL Helena/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Anotações/ }));
  fireEvent.change(screen.getByLabelText('Seu motivo para continuar'), { target: { value: 'Encontrar respostas.' } });
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).purpose).toBe('Encontrar respostas.');
});

test('oferece tela inicial quando a ficha não veio do Darkness', () => {
  render(<FichaEspiral />);
  expect(screen.getByRole('button', { name: /Ir para tela inicial/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Trocar foto')).toHaveAttribute('type', 'file');
});

test('identifica a ficha Darkness vinculada', () => {
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify({
    version: 1,
    migratedFrom: 'darkness',
    migratedFromId: 'mara-01',
  }));
  render(<FichaEspiral />);
  expect(screen.getByRole('button', { name: /Abrir ficha Darkness/ })).toBeInTheDocument();
});

test('carrega a adaptação criada com o identificador anterior', () => {
  window.history.replaceState({}, '', '/?ficha=121212');
  localStorage.setItem('espiral:sheet:v1:darkness-121212', JSON.stringify({
    version: 1,
    name: 'L',
    migratedFrom: 'darkness',
    migratedFromId: '121212',
  }));
  render(<FichaEspiral />);
  expect(screen.getByRole('link', { name: /ESPIRAL L/ })).toBeInTheDocument();
});

test('vincula automaticamente uma ficha Darkness ao abrir pelo código', async () => {
  window.history.replaceState({}, '', '/?ficha=121212');
  buscarPersonagem.mockResolvedValue({
    nome: 'L', fichaId: '121212',
    atributos: { forca: 30, fonitude: 20, inteligencia: 10, reflexos: 10, vontade: 10 },
    inventario: [],
  });
  render(<React.StrictMode><DialogoGlobal /><FichaEspiral /></React.StrictMode>);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  fireEvent.change(screen.getByRole('dialog').querySelector('select'), { target: { value: 'forca' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'L' })).toBeInTheDocument());
  expect(screen.getByRole('button', { name: /Abrir ficha Darkness/ })).toBeInTheDocument();
});

test('graus temporários acumulam no recurso e expiram após as rolagens', async () => {
  render(<><DialogoGlobal /><FichaEspiral /></>);

  fireEvent.click(screen.getByRole('button', { name: 'Adicionar grau temporário a Armas' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  fireEvent.change(within(screen.getByRole('dialog')).getByRole('textbox'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar grau' }));

  await waitFor(() => expect(screen.getByText(/\+1 TEMP\. · 1 teste/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Rolar Armas' }));
  fireEvent.click(screen.getByRole('button', { name: /Rolar Sentido \+ Armas/ }));

  await waitFor(() => expect(screen.queryByText(/\+1 TEMP\./)).not.toBeInTheDocument());
});

test('personaliza e preserva as cores da ficha', () => {
  const view = render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: '06 Personalização' }));
  fireEvent.change(screen.getByLabelText('Cor primária'), { target: { value: '#ff0000' } });

  expect(view.container.querySelector('.espiral-app')).toHaveStyle({ '--es-accent': '#ff0000' });
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).temaFicha.primaria).toBe('#ff0000');
});