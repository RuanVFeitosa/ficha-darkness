import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MasterShield from './MasterShield';

test('consulta o Protocolo no escudo organizado e aplica Pavor e Pressão', () => {
  render(<MasterShield organized campaignSystem="absoluto" />);
  fireEvent.click(screen.getByRole('button', { name: 'Regras', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Protocolo Darkness', exact: true }));
  fireEvent.change(screen.getByLabelText('Dados de atributo'), { target: { value: '6, 4, 2' } });
  fireEvent.change(screen.getByLabelText('Pressão (d6)'), { target: { value: '1' } });
  expect(screen.getByLabelText('Resultado do Protocolo')).toHaveTextContent('Sucesso · 2 êxitos / 1 exigidos · Abalo');
  fireEvent.change(screen.getByLabelText('Resultado de Pavor'), { target: { value: '5' } });
  expect(screen.getByLabelText('Resultado do Protocolo')).toHaveTextContent('Sucesso · 1 êxitos');
  fireEvent.change(screen.getByLabelText('Dados de atributo'), { target: { value: '7' } });
  expect(screen.getByLabelText('Resultado do Protocolo')).toHaveTextContent('Use de 1 a 6 dados válidos');
});
