import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OrdemPlayerSheet, OrdemShield } from './OrdemTabletop';

test('o dossiê abre o vínculo de Ordem mesmo sem ficha no catálogo genérico', () => {
  const onSelect = jest.fn();
  render(<OrdemPlayerSheet selectedId="ordem:lia" onSelect={onSelect} members={[
    { ficha_id: 'ordem:lia', nome: 'Lia' },
    { ficha_id: 'ordem:rui', nome: 'Rui' },
    { ficha_id: 'espiral:jo', nome: 'Jô' },
  ]} />);

  expect(screen.getByTitle('Ficha de Lia')).toHaveAttribute('src', '/?ordem=1&agente=lia&embed=mesa');
  expect(screen.queryByRole('option', { name: 'Jô' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Ficha vinculada' }), { target: { value: 'ordem:rui' } });
  expect(onSelect).toHaveBeenCalledWith('ordem:rui');
});

test('o escudo resolve um teste de Ordem e abre cenas na própria mesa', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.9);
  try {
    render(<OrdemShield campaign={{ membros: [], cenaAtiva: { nome: 'Arquivo' } }}
      renderTool={tool => <p>Controle de {tool}</p>} />);

    expect(screen.getByRole('heading', { name: 'Arquivo' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar' }));
    expect(screen.getByRole('status', { name: 'Resultado do teste privado' })).toHaveTextContent('Sucesso · 19');
    fireEvent.click(screen.getByRole('button', { name: 'Cenas e mapas' }));
    expect(screen.getByText('Controle de scenes')).toBeVisible();
  } finally {
    random.mockRestore();
  }
});
