import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ComputadorModerno from './ComputadorModerno';
import { lerConteudoComputador, ouvirConteudoComputador, salvarConteudoComputador } from '../services/mesaApi';

jest.mock('../services/mesaApi', () => ({ lerConteudoComputador: jest.fn(), ouvirConteudoComputador: jest.fn(), salvarConteudoComputador: jest.fn() }));
const content = { pages: [], messages: [], files: [], emails: [{ subject: 'Pista compartilhada' }] };
beforeEach(() => {
  jest.clearAllMocks();
  lerConteudoComputador.mockResolvedValue(content);
  ouvirConteudoComputador.mockReturnValue(jest.fn());
  salvarConteudoComputador.mockResolvedValue(content);
});

test('carrega o conteúdo compartilhado e permite ao mestre salvar na evidência correta', async () => {
  render(<ComputadorModerno campanhaId="campanha-1" documento={{ id: 'pc-1' }} admin />);
  await screen.findByText('Conteúdo compartilhado carregado.');
  const frame = screen.getByTitle('Computador moderno');
  const post = jest.spyOn(frame.contentWindow, 'postMessage');
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: frame.contentWindow, data: { type: 'darkness:pc-ready' } })));
  await waitFor(() => expect(post).toHaveBeenCalledWith({ type: 'darkness:pc-load', content }, window.location.origin));
  expect(lerConteudoComputador).toHaveBeenCalledTimes(1);
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: frame.contentWindow, data: { type: 'darkness:pc-save', content } })));
  await waitFor(() => expect(salvarConteudoComputador).toHaveBeenCalledWith(
    'campanha-1',
    'pc-1',
    content,
    content,
  ));
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

test('recebe atualizações em tempo real sem consultar o conteúdo repetidamente', async () => {
  render(<ComputadorModerno campanhaId="campanha-1" documento={{ id: 'pc-1' }} admin={false} />);
  await screen.findByText('Conteúdo compartilhado carregado.');
  const frame = screen.getByTitle('Computador moderno');
  const post = jest.spyOn(frame.contentWindow, 'postMessage');
  const atualizar = ouvirConteudoComputador.mock.calls[0][2];
  const atualizado = { ...content, emails: [{ subject: 'Nova pista' }] };

  act(() => atualizar(atualizado));

  expect(post).toHaveBeenCalledWith(
    { type: 'darkness:pc-load', content: atualizado },
    window.location.origin,
  );
  expect(lerConteudoComputador).toHaveBeenCalledTimes(1);
});

test('mestre migra imagens incorporadas para o armazenamento ao abrir', async () => {
  const incorporado = {
    ...content,
    files: [{ id: 'imagem-1', type: 'image', image: 'data:image/png;base64,AAAA' }],
  };
  const otimizado = {
    ...incorporado,
    files: [{ id: 'imagem-1', type: 'image', image: 'https://cdn.example/imagem.png' }],
  };
  lerConteudoComputador.mockResolvedValueOnce(incorporado);
  salvarConteudoComputador.mockResolvedValueOnce(otimizado);

  render(<ComputadorModerno campanhaId="campanha-1" documento={{ id: 'pc-1' }} admin />);

  await screen.findByText('Conteúdo compartilhado carregado.');
  expect(salvarConteudoComputador).toHaveBeenCalledWith(
    'campanha-1',
    'pc-1',
    incorporado,
    incorporado,
  );
});
