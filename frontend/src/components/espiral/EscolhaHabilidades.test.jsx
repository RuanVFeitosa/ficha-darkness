import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscolhaHabilidades from './EscolhaHabilidades';

function Selector() {
  const [value, setValue] = useState([]);
  return <EscolhaHabilidades value={value} onChange={setValue} />;
}

test('mantém escolhas entre categorias e permite remover pelo resumo', () => {
  render(<Selector />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Sem Hesitar' }));
  fireEvent.click(screen.getByRole('button', { name: /^Resistência/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Último Fôlego' }));
  expect(screen.getByRole('status')).toHaveTextContent('2 / 2');
  expect(screen.getByRole('checkbox', { name: 'Respira' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Remover Sem Hesitar' }));
  expect(screen.getByRole('checkbox', { name: 'Respira' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Último Fôlego' })).toBeChecked();
});

test('busca em todas as categorias sem exigir acentos e mostra busca vazia', () => {
  render(<Selector />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ultimo folego' } });
  expect(screen.getByRole('checkbox', { name: 'Último Fôlego' })).toBeInTheDocument();
  expect(screen.queryByRole('checkbox', { name: 'Sem Hesitar' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyzxyz' } });
  expect(screen.getByText(/Nenhuma habilidade encontrada/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Ofensiva/ }));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByRole('checkbox', { name: 'Sem Hesitar' })).toBeInTheDocument();
});
