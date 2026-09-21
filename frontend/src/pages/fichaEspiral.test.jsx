import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FichaEspiral from './fichaEspiral';

beforeEach(() => localStorage.clear());

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
  expect(screen.getByRole('heading', { name: 'Helena' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Anotações/ }));
  fireEvent.change(screen.getByLabelText('Seu motivo para continuar'), { target: { value: 'Encontrar respostas.' } });
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).purpose).toBe('Encontrar respostas.');
});
