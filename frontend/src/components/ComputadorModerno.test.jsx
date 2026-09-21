import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ComputadorModerno from './ComputadorModerno';
import { lerConteudoComputador, salvarConteudoComputador } from '../services/mesaApi';

jest.mock('../services/mesaApi', () => ({ lerConteudoComputador: jest.fn(), salvarConteudoComputador: jest.fn() }));
const content = { pages: [], messages: [], files: [], emails: [{ subject: 'Pista compartilhada' }] };
beforeEach(() => { jest.clearAllMocks(); lerConteudoComputador.mockResolvedValue(content); salvarConteudoComputador.mockResolvedValue(); });

test('carrega o conteúdo compartilhado e permite ao mestre salvar na evidência correta', async () => {
  render(<ComputadorModerno campanhaId="campanha-1" documento={{ id: 'pc-1' }} admin />);
  await screen.findByText('Conteúdo compartilhado carregado.');
  const frame = screen.getByTitle('Computador moderno');
  const post = jest.spyOn(frame.contentWindow, 'postMessage');
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: frame.contentWindow, data: { type: 'darkness:pc-ready' } })));
  await waitFor(() => expect(post).toHaveBeenCalledWith({ type: 'darkness:pc-load', content }, window.location.origin));
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: frame.contentWindow, data: { type: 'darkness:pc-save', content } })));
  await waitFor(() => expect(salvarConteudoComputador).toHaveBeenCalledWith('campanha-1', 'pc-1', content));
});

test('jogador não grava conteúdo e mensagens de outra origem são ignoradas', async () => {
  render(<ComputadorModerno campanhaId="campanha-1" documento={{ id: 'pc-1' }} admin={false} />);
  await screen.findByText('Conteúdo compartilhado carregado.');
  const frame = screen.getByTitle('Computador moderno');
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: frame.contentWindow, data: { type: 'darkness:pc-save', content } })));
  expect(salvarConteudoComputador).not.toHaveBeenCalled();
  const count = lerConteudoComputador.mock.calls.length;
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://outro.example', source: frame.contentWindow, data: { type: 'darkness:pc-ready' } })));
  expect(lerConteudoComputador).toHaveBeenCalledTimes(count);
});
