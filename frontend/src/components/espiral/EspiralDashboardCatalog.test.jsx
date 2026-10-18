import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EspiralDashboardCatalog from './EspiralDashboardCatalog';

const ficha = { fichaId: 'espiral:123', espiralId: '123', personagem: { name: 'Ana', evolution: { points: 5, abilities: [] } } };
test('exibe o acervo ESPIRAL e concede a arma selecionada', () => {
  const onGrant = jest.fn();
  render(<EspiralDashboardCatalog kind="items" fichas={[ficha]} onGrant={onGrant} />);
  expect(screen.getByRole('heading', { name: 'Faca' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Armas de fogo' }));
  expect(screen.getByRole('heading', { name: 'Pistola' })).toBeInTheDocument();
  expect(screen.queryByText('PISTOLA SABLE 9MM')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Conceder a uma ficha local'), { target: { value: ficha.fichaId } });
  fireEvent.click(screen.getByRole('button', { name: 'Conceder: Pistola' }));
  expect(onGrant).toHaveBeenCalledWith(ficha, expect.objectContaining({ name: 'Pistola', damage: '2d6', type: 'weapon' }));
  fireEvent.click(screen.getByRole('button', { name: 'Medicina' }));
  fireEvent.change(screen.getByLabelText('Buscar no catálogo'), { target: { value: 'torníquete' } });
  expect(screen.getByRole('heading', { name: 'Torniquete' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Kit Médico' })).not.toBeInTheDocument();
});

test('usa as habilidades da Transformação com custos e níveis e consulta vertentes', () => {
  render(<EspiralDashboardCatalog kind="abilities" fichas={[ficha]} onGrant={jest.fn()} />);
  expect(screen.getByRole('heading', { name: 'Golpe Calculado' })).toBeInTheDocument();
  expect(screen.getAllByText('Nível III').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Esperança: 2 no Fracasso / 1 no Sucesso com Consequência').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Resistência' }));
  expect(screen.getByRole('heading', { name: 'Último Fôlego' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Vertentes' }));
  expect(screen.getByRole('heading', { name: 'Método' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Conceder a uma ficha local')).not.toBeInTheDocument();
});

test('habilidade já adquirida não pode ser concedida novamente e falha não anuncia sucesso', () => {
  const onGrant = jest.fn(() => false);
  const ownedFicha = { ...ficha, personagem: { ...ficha.personagem, evolution: { abilities: [{ id: 'Ofensiva:Golpe Calculado' }] } } };
  render(<EspiralDashboardCatalog kind="abilities" fichas={[ownedFicha]} onGrant={onGrant} />);
  fireEvent.change(screen.getByLabelText('Conceder a uma ficha local'), { target: { value: ficha.fichaId } });
  expect(screen.getByRole('button', { name: 'Já concedida: Golpe Calculado' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Conceder: Sem Hesitar' }));
  expect(screen.getByRole('status')).toHaveTextContent('Não foi possível salvar');
});
