import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TabletopSheetGate from './TabletopSheetGate';
import { buscarFichaEspiral } from '../../services/espiralApi';
jest.mock('../../services/espiralApi', () => ({ buscarFichaEspiral: jest.fn() }));
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
const game = sheet => <div>Tabletop carregado: {sheet?.name || 'mestre'}</div>;

test('entra usando a ficha remota mesmo com cota local cheia', async () => {
  buscarFichaEspiral.mockResolvedValue({ version: 1, name: 'Alessandra', tabletopTokenImage: '/corpo.png' });
  const fail = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); });
  try {
    render(<TabletopSheetGate id="44085861" enabled missing={<div>Voltou para a ficha</div>}>{game}</TabletopSheetGate>);
    expect(await screen.findByText('Tabletop carregado: Alessandra')).toBeInTheDocument();
    expect(buscarFichaEspiral).toHaveBeenCalledWith('44085861');
    expect(screen.queryByText('Voltou para a ficha')).not.toBeInTheDocument();
  } finally { fail.mockRestore(); }
});
test('cache sem token é atualizado pelo servidor antes de impedir a entrada', async () => {
  localStorage.setItem('espiral:sheet:v1:44085861', JSON.stringify({ version: 1, name: 'Antiga', tabletopTokenImage: '' }));
  buscarFichaEspiral.mockResolvedValue({ version: 1, name: 'Atual', tabletopTokenImage: '/token.png' });
  render(<TabletopSheetGate id="44085861" enabled missing={<div>Token ausente</div>}>{game}</TabletopSheetGate>);
  expect(await screen.findByText('Tabletop carregado: Atual')).toBeInTheDocument();
});
test('somente falta de imagem confirmada retorna à ficha', async () => {
  buscarFichaEspiral.mockResolvedValue({ version: 1, name: 'Sem token' });
  render(<TabletopSheetGate id="sem-token" enabled missing={<div>Token ausente</div>}>{game}</TabletopSheetGate>);
  expect(await screen.findByText('Token ausente')).toBeInTheDocument();
});
test('falha de rede oferece nova tentativa sem redirecionar', async () => {
  buscarFichaEspiral.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ version: 1, name: 'Recuperada', tabletopTokenImage: '/token.png' });
  render(<TabletopSheetGate id="44085861" enabled missing={<div>Token ausente</div>}>{game}</TabletopSheetGate>);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('servidor'));
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Tabletop carregado: Recuperada')).toBeInTheDocument();
});
test('mestre entra sem exigir ficha de jogador', () => {
  render(<TabletopSheetGate id="principal" enabled={false}>{game}</TabletopSheetGate>);
  expect(screen.getByText('Tabletop carregado: mestre')).toBeInTheDocument();
  expect(buscarFichaEspiral).not.toHaveBeenCalled();
});
