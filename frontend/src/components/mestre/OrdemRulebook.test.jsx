import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrdemRulebook from './OrdemRulebook';

test('encontra um ritual sem acentos e abre a página escolhida no sumário', () => {
  render(<OrdemRulebook />);
  const search = screen.getByRole('searchbox', { name: 'Buscar em Ordem Paranormal' });
  fireEvent.change(search, { target: { value: 'cicatrizacao' } });

  const summary = screen.getByRole('navigation', { name: 'Sumário de Ordem Paranormal' });
  fireEvent.click(within(summary).getByRole('button', { name: /página 126/i }));
  expect(screen.getByRole('heading', { name: 'Página 126' })).toBeInTheDocument();

  fireEvent.change(search, { target: { value: 'zzzzzzzzz' } });
  expect(screen.getByText('Nenhuma página encontrada.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
  expect(screen.getByRole('heading', { name: 'Página 126' })).toBeInTheDocument();
});
