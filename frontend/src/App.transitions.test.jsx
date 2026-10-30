import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/lojaEspiral', () => () => null);
jest.mock('./pages/transformacaoEspiral', () => () => null);
jest.mock('./components/ui/DialogoGlobal', () => () => null);
jest.mock('./pages/telaInicial', () => ({ onNavigate }) => <button onClick={() => onNavigate('/?jogador=1234')}>Login teste</button>);
jest.mock('./pages/PaginaJogador', () => () => <div>Dashboard teste<a href="/?">Sair teste</a></div>);
jest.mock('./utils/useLoginAmbient', () => ({ __esModule: true, useAmbientPlayback: jest.fn(), default: () => ({ ativo: true, trilha: { id: 'veu' }, volume: 35 }), TRILHAS_AMBIENTE: [] }));

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});
afterEach(() => jest.useRealTimers());

test('login e links internos acionam a transição antes de trocar a página', async () => {
  const view = render(<App />);
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1000));
  fireEvent.click(screen.getByText('Login teste'));
  expect(view.container.querySelector('.page-transition')).toHaveClass('active');
  expect(window.location.search).toBe('');
  await act(async () => jest.advanceTimersByTime(700));
  expect(await screen.findByText('Dashboard teste')).toBeInTheDocument();
  expect(window.location.search).toBe('?jogador=1234');
  act(() => jest.advanceTimersByTime(300));
  expect(view.container.querySelector('.page-transition')).not.toHaveClass('active');
  fireEvent.click(screen.getByText('Sair teste'));
  expect(view.container.querySelector('.page-transition')).toHaveClass('active');
  await act(async () => jest.advanceTimersByTime(1000));
  expect(screen.getByText('Login teste')).toBeInTheDocument();
});

test('voltar pelo histórico também mostra a transição', async () => {
  const view = render(<App />);
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1000));
  act(() => {
    window.history.replaceState({}, '', '/?jogador=1234');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(view.container.querySelector('.page-transition')).toHaveClass('active');
  await act(async () => jest.advanceTimersByTime(1000));
  expect(await screen.findByText('Dashboard teste')).toBeInTheDocument();
  expect(view.container.querySelector('.page-transition')).not.toHaveClass('active');
});

test.each([
  ['/?jogador=1234&sistema=darkness&ficha=teste', 'absoluto'],
  ['/?jogador=1234&sistema=espiral&ficha=teste', 'espiral'],
  ['/?jogador=1234&sistema=darkness', 'site'],
  ['/?jogador=1234', 'site'],
])('setas acompanham a área aberta: %s', async (url, tema) => {
  window.history.replaceState({}, '', url);
  render(<App />);
  await act(async () => {});
  expect(document.documentElement.dataset.controlTheme).toBe(tema);
});
