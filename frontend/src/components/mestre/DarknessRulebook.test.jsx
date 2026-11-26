import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DarknessRulebook from './DarknessRulebook';
import { loadRulebook, saveRulebook } from '../../services/darknessRulebook';
jest.mock('react-markdown', () => ({children}) => <div>{children}</div>);
jest.mock('remark-gfm', () => () => {});
jest.mock('./DarknessEquipment', () => ({EquipmentDialog: ({title,children}) => <div role="dialog" aria-label={title}>{children}</div>}));
jest.mock('../../services/darknessRulebook', () => ({
  loadRulebook: jest.fn(), saveRulebook: jest.fn(),
  searchRulebook: (sections, query) => sections.filter(s => `${s.title} ${s.content}`.toLowerCase().includes(query.toLowerCase())),
}));
beforeEach(() => {
  jest.clearAllMocks();
  loadRulebook.mockResolvedValue({version:1,sourcePages:233,sections:[{id:'first',title:'Introdução',chapter:'Começo',content:'Texto inicial'}]});
  saveRulebook.mockImplementation(async book => book);
});
test('edits, adds, removes and restores sections through the reader', async () => {
  render(<DarknessRulebook/>);
  await screen.findByRole('heading', {name:'Introdução'});
  fireEvent.click(screen.getByRole('button',{name:'Editar subcapítulo'}));
  fireEvent.change(screen.getByLabelText('Conteúdo da seção'),{target:{value:'Regra revisada'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar seção'}));
  await screen.findByText('Regra revisada');
  fireEvent.click(screen.getByRole('button',{name:'+ Novo subcapítulo'}));
  fireEvent.change(screen.getByLabelText('Título da seção'),{target:{value:'Minha regra'}});
  fireEvent.change(screen.getByLabelText('Conteúdo da seção'),{target:{value:'Texto da mesa'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar seção'}));
  await screen.findByRole('heading',{name:'Minha regra'});
  fireEvent.click(screen.getByRole('button',{name:'Remover subcapítulo'}));
  expect(saveRulebook).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button',{name:'Confirmar remoção'}));
  await waitFor(() => expect(screen.queryByRole('heading',{name:'Minha regra'})).toBeNull());
  fireEvent.click(screen.getByRole('button',{name:'Desfazer exclusão'}));
  await screen.findByRole('heading',{name:'Minha regra'});
  expect(saveRulebook.mock.calls[3][0].sections).toHaveLength(2);
});
test('keeps an unsuccessful edit open so the text can be retried', async () => {
  render(<DarknessRulebook/>);
  await screen.findByRole('heading',{name:'Introdução'});
  fireEvent.click(screen.getByRole('button',{name:'Editar subcapítulo'}));
  fireEvent.change(screen.getByLabelText('Conteúdo da seção'),{target:{value:'Não perder este texto'}});
  saveRulebook.mockRejectedValueOnce(new Error('Não foi possível salvar'));
  fireEvent.click(screen.getByRole('button',{name:'Salvar seção'}));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Conteúdo da seção').value).toBe('Não perder este texto');
});
