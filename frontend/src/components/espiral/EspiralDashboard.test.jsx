import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EspiralAgentCard, EspiralDashboardHeader } from './EspiralDashboard';

test('abre o dossiê e mostra recursos e atributos', () => {
  const onOpen = jest.fn();
  const ficha = { espiralId: '1234', personagem: { name: 'Ana', vertente: 'Metódica', player: 'Ruan', integrity: 20, sanity: 8, hope: 6 } };
  render(<EspiralAgentCard ficha={ficha} attributes={ [['Pulso', 6], ['Sentido', 8]] } integrityMaximum={30} onOpen={onOpen} />);
  expect(screen.getByRole('progressbar', { name: 'Integridade' })).toHaveAttribute('value', '20');
  expect(screen.getByRole('progressbar', { name: 'Sanidade' })).toHaveAttribute('max', '10');
  fireEvent.click(screen.getByRole('button', { name: 'Abrir ficha de Ana' }));
  expect(onOpen).toHaveBeenCalledWith(ficha, 'jogador');
});

test('mantém troca de sistema e atualização disponíveis', () => {
  const onSystemChange = jest.fn(), onRefresh = jest.fn();
  render(<EspiralDashboardHeader agents={4} pending={2} onSystemChange={onSystemChange} onRefresh={onRefresh} onHome={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'DARKNESS' }));
  expect(onSystemChange).toHaveBeenCalledWith('darkness');
  fireEvent.click(screen.getByRole('button', { name: /Atualizar/ }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
  expect(screen.getByText('04')).toBeInTheDocument();
});
