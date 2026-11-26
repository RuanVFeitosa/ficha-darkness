import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerCampaign from './PlayerCampaign';
import { buscarCampanhaPorCodigo, vincularFicha } from '../../services/mesaApi';

jest.mock('../../services/mesaApi', () => ({ buscarCampanhaPorCodigo: jest.fn(), resolverCapaCampanha: async campaign => campaign, vincularFicha: jest.fn() }));

test('confirma o convite com ficha compatível e abre a mesa pelos detalhes', async () => {
  const campaign = { id: 'campaign', codigo: 'MESA', sistema: 'ordem', nome: 'Arquivo 13', membros: [] };
  const sheets = [{ id: 'agent', sistema: 'ordem', nome: 'Lia' }, { id: 'other', sistema: 'espiral', nome: 'Rui' }];
  const onOpen = jest.fn();
  const onBack = jest.fn();
  buscarCampanhaPorCodigo.mockResolvedValue(campaign);
  const { unmount } = render(<PlayerCampaign code="MESA" invite sheets={sheets} playerCode="1234" onOpen={onOpen} onBack={onBack} />);
  expect(await screen.findByRole('heading', { name: 'Arquivo 13' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Rui' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na campanha' }));
  await waitFor(() => expect(onOpen).toHaveBeenCalledWith('MESA'));
  expect(vincularFicha).toHaveBeenCalledWith('campaign', 'ordem:agent', { nome: 'Lia' });
  unmount();

  buscarCampanhaPorCodigo.mockResolvedValue({ ...campaign, membros: [{ id: 'member', ficha_id: 'ordem:agent', nome: 'Lia' }] });
  render(<PlayerCampaign code="MESA" sheets={sheets} playerCode="1234" onOpen={onOpen} onBack={onBack} />);
  expect(await screen.findByRole('link', { name: 'Entrar no Tabletop' })).toHaveAttribute('href', '/?campanha=MESA&sistema=ordem&papel=jogador&vinculo=ordem%3Aagent');
  expect(screen.getByRole('link', { name: 'Acessar ficha' })).toHaveAttribute('href', '?ordem=1&agente=agent&jogadorOrigem=1234&mesa=MESA');
});
