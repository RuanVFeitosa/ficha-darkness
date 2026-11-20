import React from 'react';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import DarknessAbilities from './DarknessAbilities';
import { readAbilityCatalog } from '../../utils/darknessAbilityCatalog';
import { grantEspiralCatalogEntry } from '../../utils/espiralCatalogGrant';

const fichas = [{ fichaId: 'a', espiralId: '111', personagem: { name: 'Jorge' } }, { fichaId: 'b', espiralId: '222', personagem: { name: 'Jorge' } }];
beforeEach(() => localStorage.clear());
test('edita custos e níveis e entrega a versão personalizada à ficha correta', async () => {
  const entry = readAbilityCatalog()[0];
  const onGrant = jest.fn().mockResolvedValue(true);
  render(<DarknessAbilities fichas={fichas} onGrant={onGrant}/>);
  fireEvent.change(screen.getByLabelText('Buscar habilidades'), { target: { value: entry.name } });
  fireEvent.click(screen.getAllByRole('button', { name: /^Editar habilidade:/ })[0]);
  let dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Nome da habilidade'), { target: { value: 'Poder da mesa' } });
  fireEvent.change(dialog.getByLabelText('Custo no fracasso'), { target: { value: '5' } });
  fireEvent.change(dialog.getByLabelText('Efeito do Nível I'), { target: { value: 'Efeito personalizado.' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }));
  fireEvent.change(screen.getByLabelText('Buscar habilidades'), { target: { value: 'Poder da mesa' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entregar habilidade: Poder da mesa' }));
  dialog = within(screen.getByRole('dialog'));
  fireEvent.click(dialog.getByRole('button', { name: 'Nível III' }));
  fireEvent.change(dialog.getByLabelText('Buscar personagem'), { target: { value: '222' } });
  fireEvent.click(dialog.getByRole('button', { name: /Jorge.*222/ }));
  fireEvent.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(onGrant).toHaveBeenCalledWith(fichas[1], expect.objectContaining({ id: entry.id, name: 'Poder da mesa', hope: [5, entry.hope[1]], customized: true }));
  const delivered = onGrant.mock.calls[0][1];
  expect(grantEspiralCatalogEntry({}, delivered).evolution.abilities[0]).toMatchObject({ level: 1, levels: ['Efeito personalizado.', ...entry.levels.slice(1)], hope: [5, entry.hope[1]] });
});

test('impede duplicatas e mantém a entrega aberta quando o servidor falha', async () => {
  const entry = readAbilityCatalog()[0];
  const onGrant = jest.fn().mockResolvedValue(false);
  const owned = { ...fichas[0], personagem: { name: 'Jorge', evolution: { abilities: [{ id: entry.id, name: entry.name, category: entry.category, level: 1 }] } } };
  render(<DarknessAbilities fichas={[owned, fichas[1]]} onGrant={onGrant}/>);
  fireEvent.change(screen.getByLabelText('Buscar habilidades'), { target: { value: entry.name } });
  fireEvent.click(screen.getAllByRole('button', { name: /^Entregar habilidade:/ })[0]);
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('button', { name: /Jorge.*111/ })).toBeDisabled();
  fireEvent.click(dialog.getByRole('button', { name: /Jorge.*222/ }));
  fireEvent.click(dialog.getByRole('button', { name: 'Confirmar entrega' }));
  await waitFor(() => expect(dialog.getByRole('alert')).toHaveTextContent('Não foi possível salvar'));
  expect(dialog.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled();
});


test('confirma exclusão, persiste a remoção e permite desfazer', () => {
  const entry = readAbilityCatalog()[0];
  const view = render(<DarknessAbilities fichas={fichas} onGrant={jest.fn()}/>);
  fireEvent.change(screen.getByLabelText('Buscar habilidades'), { target: { value: entry.name } });
  fireEvent.click(screen.getAllByRole('button', { name: /^Apagar habilidade:/ })[0]);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
  expect(readAbilityCatalog().some(item => item.id === entry.id)).toBe(true);
  fireEvent.click(screen.getAllByRole('button', { name: /^Apagar habilidade:/ })[0]);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apagar habilidade' }));
  expect(readAbilityCatalog().some(item => item.id === entry.id)).toBe(false);
  expect(screen.getByRole('status')).toHaveTextContent('habilidade apagada');
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer exclusão' }));
  expect(readAbilityCatalog().some(item => item.id === entry.id)).toBe(true);
  fireEvent.click(screen.getAllByRole('button', { name: /^Apagar habilidade:/ })[0]);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apagar habilidade' }));
  view.unmount();
  render(<DarknessAbilities fichas={fichas} onGrant={jest.fn()}/>);
  expect(readAbilityCatalog().some(item => item.id === entry.id)).toBe(false);
});
