import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import PlayerAppearance from './PlayerAppearance';
import { PALETA_CLARA } from '../utils/playerAppearance';
test('paleta da página é salva no perfil e fichas são alvos separados',async()=>{
 const salvar=jest.fn().mockResolvedValue(true);
 render(<PlayerAppearance perfil={{nome:'Ana'}} fichas={[{id:'1234',sistema:'darkness',nome:'Renegada',dados:{}},{id:'5678',sistema:'espiral',nome:'Investigadora',dados:{}}]} onSavePagina={salvar} onFichaSalva={jest.fn()}/>);
 fireEvent.click(screen.getByText('Paletas de cores'));
 expect(await screen.findByRole('option',{name:'Página do Jogador'})).toBeInTheDocument();
 expect(screen.getByRole('option',{name:'Renegada'})).toBeInTheDocument();
 expect(screen.getByRole('option',{name:'Investigadora'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Branco e preto'}));
 fireEvent.click(screen.getByRole('button',{name:'Salvar paleta'}));
 await waitFor(()=>expect(salvar).toHaveBeenCalledWith(PALETA_CLARA));
 expect(await screen.findByRole('status')).toHaveTextContent('Paleta da página salva');
});
