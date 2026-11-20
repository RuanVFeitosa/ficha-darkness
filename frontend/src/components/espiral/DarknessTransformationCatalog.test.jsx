import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DarknessTransformationCatalog from './DarknessTransformationCatalog';

test('pagina centenas de habilidades sem sobreposição e busca sem classificações do sistema anterior', () => {
  render(<DarknessTransformationCatalog owned={[]} points={6} busy={false} onAcquire={jest.fn()} onUpgrade={jest.fn()} />);
  const results = screen.getByRole('region', { name: 'Resultados de habilidades' });
  expect(results.querySelectorAll('.dt-entry')).toHaveLength(12);
  expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
  expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText('25–36 de 107')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima →' }));
  expect(within(results).queryByRole('button', { name: '01 Golpe Calculado' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Buscar no repertório'), { target: { value: 'golpe devastador' } });
  expect(screen.queryByLabelText('Origem', { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Classe de origem')).not.toBeInTheDocument();
  expect(within(results).getByRole('button', { name: /Golpe Devastador/ })).toBeInTheDocument();
  fireEvent.click(within(results).getByRole('button', { name: /Golpe Devastador/ }));
  const catalog = screen.getByRole('region', { name: 'Catálogo de habilidades Darkness' });
  expect(catalog).not.toHaveTextContent(/Aniquilador|LUTADOR DESARMADO|Especialismo|Aptidão|Habilidade de classe/);
  expect(screen.getByText('Habilidade Darkness')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '← Anterior' })).toBeDisabled();
});

test('consulta e compra em outra categoria preservam a categoria da seleção', () => {
  const onAcquire = jest.fn();
  render(<DarknessTransformationCatalog owned={[]} points={3} busy={false} onAcquire={onAcquire} onUpgrade={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Resistência/ }));
  fireEvent.click(screen.getByRole('button', { name: /Último Fôlego/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Nível III' }));
  expect(screen.getByText(/Permaneça consciente/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Adquirir · 3 pontos/ }));
  expect(onAcquire).toHaveBeenCalledWith(expect.arrayContaining(['Último Fôlego']), 'Resistência');
});

test('filtra adquiridas, consulta nível atual e não permite gasto sem saldo', () => {
  render(<DarknessTransformationCatalog owned={[{ id: 'Ofensiva:Golpe Calculado', name: 'Golpe Calculado', category: 'Ofensiva', level: 2 }]} points={0} busy={false} onAcquire={jest.fn()} onUpgrade={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('Repertório', { exact: true }), { target: { value: 'owned' } });
  fireEvent.click(screen.getByRole('button', { name: '01 Golpe Calculado' }));
  expect(screen.getByRole('button', { name: /Nível II Atual/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Aprimorar para o Nível 3/ })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Buscar no repertório'), { target: { value: 'inexistente-xyz' } });
  expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver todas as habilidades' }));
  expect(screen.getByLabelText('Buscar no repertório')).toHaveValue('');
});
