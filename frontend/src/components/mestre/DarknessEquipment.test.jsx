import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DarknessEquipment from './DarknessEquipment';
import { readWeaponCatalog } from '../../utils/darknessWeaponCatalog';

const fichas = [{ fichaId: 'a', espiralId: '111', personagem: { name: 'Jorge', player: 'Ruan' } }, { fichaId: 'b', espiralId: '222', personagem: { name: 'Jorge', player: 'Ana' } }];
beforeEach(() => localStorage.clear());

test('edita proteções e itens de qualquer categoria com persistência', () => {
  render(<DarknessEquipment fichas={fichas} onGrant={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Editar equipamento: Colete Leve' }));
  let dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Valor de proteção'), { target: { value: '5' } });
  fireEvent.change(dialog.getByLabelText('Regiões protegidas'), { target: { value: 'Torso/Braços' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
  expect(readWeaponCatalog().find(entry => entry.name === 'Colete Leve')).toMatchObject({ value: 5, region: 'Torso/Braços' });
  fireEvent.click(screen.getByRole('button', { name: 'Editar equipamento: Lanterna' }));
  dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Nome do equipamento'), { target: { value: 'Lanterna de campo' } });
  fireEvent.change(dialog.getByLabelText('Descrição e propriedades'), { target: { value: 'Ilumina o corredor.' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
  expect(readWeaponCatalog().find(entry => entry.name === 'Lanterna de campo')).toMatchObject({ detail: 'Ilumina o corredor.' });
});

test('busca destinatário por código, confirma quantidade e bloqueia entrega duplicada', async () => {
  let resolve;
  const onGrant = jest.fn().mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<DarknessEquipment fichas={fichas} onGrant={onGrant}/>);
  fireEvent.change(screen.getByLabelText('Buscar equipamentos'), { target: { value: 'Lanterna Compacta' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled();
  fireEvent.change(dialog.getByLabelText('Buscar personagem'), { target: { value: '222' } });
  fireEvent.click(dialog.getByRole('button', { name: /Jorge.*222/ }));
  fireEvent.change(dialog.getByLabelText('Quantidade'), { target: { value: '3' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));
  expect(onGrant).toHaveBeenCalledWith(fichas[1], expect.objectContaining({ name: 'Lanterna Compacta', quantity: 3 }));
  expect(dialog.getByRole('button', { name: 'Entregando…' })).toBeDisabled();
  resolve(true);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('status')).toHaveTextContent('3 × Lanterna Compacta entregue a Jorge');
  expect(onGrant).toHaveBeenCalledTimes(1);
});

test('falha mantém destinatário e permite tentar novamente sem anunciar sucesso', async () => {
  const onGrant = jest.fn().mockResolvedValue(false);
  render(<DarknessEquipment fichas={fichas} onGrant={onGrant}/>);
  fireEvent.change(screen.getByLabelText('Buscar equipamentos'), { target: { value: 'Pistola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.click(dialog.getByRole('button', { name: /Jorge.*111/ }));
  fireEvent.change(dialog.getByLabelText('Balas na entrega'), { target: { value: '4' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));
  await waitFor(() => expect(dialog.getByRole('alert')).toHaveTextContent('Não foi possível salvar'));
  expect(onGrant).toHaveBeenCalledWith(fichas[0], expect.objectContaining({ ammo: 4 }));
  expect(dialog.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
