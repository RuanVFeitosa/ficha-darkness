import React from 'react';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import EspiralEncounters from './EspiralEncounters';
import { ESPIRAL_ENCOUNTERS_KEY } from '../../utils/espiralEncounters';
import { confirmarDialogo } from '../ui/DialogoGlobal';
import { compressProfileImage, prepareTokenImage } from '../../services/imageCompression';

jest.mock('../../services/imageCompression', () => ({ compressProfileImage: jest.fn(), prepareTokenImage: jest.fn() }));

jest.mock('../ui/DialogoGlobal', () => ({ confirmarDialogo: jest.fn(() => Promise.resolve(true)) }));

test('envia, salva, reabre e remove retrato e token de corpo inteiro separadamente', async () => {
  compressProfileImage.mockResolvedValue('data:image/webp;base64,portrait');
  prepareTokenImage.mockResolvedValue('data:image/webp;base64,token');
  render(<EspiralEncounters />);
  fireEvent.click(screen.getByRole('button', { name: 'Criar NPC' }));
  const file = new File(['image'], 'npc.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Enviar foto de perfil'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText('Foto de perfil de Novo NPC')).toHaveAttribute('src', 'data:image/webp;base64,portrait'));
  fireEvent.change(screen.getByLabelText('Enviar token 3d'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText('Token 3D de Novo NPC')).toHaveAttribute('src', 'data:image/webp;base64,token'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  fireEvent.click(screen.getByRole('button', { name: 'Abrir ficha de Novo NPC' }));
  expect(screen.getByAltText('Token 3D de Novo NPC')).toHaveAttribute('src', 'data:image/webp;base64,token');
  fireEvent.click(screen.getByRole('button', { name: 'Remover foto de perfil' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  const record = JSON.parse(localStorage.getItem(ESPIRAL_ENCOUNTERS_KEY)).records[0];
  expect(record.profileImage).toBe('');
  expect(record.tabletopTokenImage).toBe('data:image/webp;base64,token');
});

test('falha no upload preserva a imagem anterior e permite salvar', async () => {
  prepareTokenImage.mockRejectedValue(new Error('Imagem inválida'));
  render(<EspiralEncounters />);
  fireEvent.click(screen.getByRole('button', { name: 'Criar NPC' }));
  fireEvent.change(screen.getByLabelText('URL do token 3D'), { target: { value: '/token.png' } });
  fireEvent.change(screen.getByLabelText('Enviar token 3d'), { target: { files: [new File(['bad'], 'bad.png', { type: 'image/png' })] } });
  await waitFor(() => expect(screen.getByText('Imagem inválida')).toBeInTheDocument());
  expect(screen.getByAltText('Token 3D de Novo NPC')).toHaveAttribute('src', '/token.png');
  expect(screen.getByRole('button', { name: 'Salvar ficha' })).toBeEnabled();
});
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  confirmarDialogo.mockResolvedValue(true);
  global.structuredClone = value => JSON.parse(JSON.stringify(value));
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: jest.fn().mockReturnValueOnce('first').mockReturnValueOnce('second').mockReturnValue('third') } });
});

test('cria, edita e reabre a mesma ficha ESPIRAL para NPC e inimigo', () => {
  localStorage.setItem('darkness_npcs', '[{"id":"legacy","nome":"Darkness NPC"}]');
  const view = render(<EspiralEncounters />);
  expect(screen.queryByText('Darkness NPC')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Criar NPC' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.queryByLabelText('Força')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aliada' } });
  fireEvent.change(screen.getByLabelText('Pasta'), { target: { value: 'Conselho' } });
  fireEvent.change(screen.getByLabelText('Razão'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Criar inimigo' }));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ameaça' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  view.unmount();
  render(<EspiralEncounters />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir ficha de Aliada' }));
  expect(screen.getByLabelText('Razão')).toHaveValue('4');
  fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'inimigo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  expect(JSON.parse(localStorage.getItem(ESPIRAL_ENCOUNTERS_KEY)).records.map(item => item.tipo)).toEqual(['inimigo', 'inimigo']);
  expect(localStorage.getItem('darkness_npcs')).toBe('[{"id":"legacy","nome":"Darkness NPC"}]');
});

test('incorpora equipamentos, habilidades e lesões e calcula dano com a fórmula ESPIRAL', () => {
  render(<EspiralEncounters />);
  fireEvent.click(screen.getByRole('button', { name: 'Criar inimigo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Equipamentos' }));
  fireEvent.change(screen.getByLabelText('Item do Acervo'), { target: { value: 'arma-pistola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
  const weapon = screen.getAllByRole('article').find(article => within(article).queryByLabelText('Dano de Pistola'));
  fireEvent.change(screen.getByLabelText('Dano de Pistola'), { target: { value: '2d6+2' } });
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  fireEvent.click(within(weapon).getByRole('button', { name: 'Rolar dano' }));
  expect(screen.getByText('Dano · Pistola · Dano rolado')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Lesão Moderada' })).toBeInTheDocument();
  expect(screen.getByText('Dados: 1, 1')).toBeInTheDocument();
  expect(screen.getByText('4', { selector: 'strong' })).toBeInTheDocument();
  random.mockRestore();
  fireEvent.click(screen.getByRole('button', { name: 'Habilidades', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar habilidade' }));
  fireEvent.change(screen.getByLabelText('Nível de Golpe Calculado'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lesões' }));
  fireEvent.change(screen.getByLabelText('Nota da lesão'), { target: { value: 'Queda' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar lesão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));
  const record = JSON.parse(localStorage.getItem(ESPIRAL_ENCOUNTERS_KEY)).records[0];
  expect(record.weapons).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Pistola', damage: '2d6+2' })]));
  expect(record.evolution.abilities[0].level).toBe(2);
  expect(record.injuries[0].note).toBe('Queda');
});

test('cancelar alterações não grava uma ficha incompleta', async () => {
  render(<EspiralEncounters />);
  fireEvent.click(screen.getByRole('button', { name: 'Criar NPC' }));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Rascunho' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fechar ficha de encontro' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(confirmarDialogo).toHaveBeenCalled();
  expect(localStorage.getItem(ESPIRAL_ENCOUNTERS_KEY)).toBeNull();
});
