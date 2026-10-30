import React from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import LojaEspiral from './lojaEspiral';
import { freshSheet } from '../data/espiral';
beforeEach(()=>{
 localStorage.clear();window.history.replaceState({},'','/?sistema=espiral&lojaEspiral=1&ficha=12345678');
 localStorage.setItem('espiral:sheet:v1:12345678',JSON.stringify({...freshSheet(),name:'Maya',notes:'Preservar'}));
});
test('busca filtra catálogo e incorporar mantém os dados da ficha',()=>{
 render(<LojaEspiral/>);
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'faca'}});
 const artigo=screen.getByRole('region',{name:'Item selecionado'});
 expect(screen.queryByRole('heading',{name:'Martelo'})).not.toBeInTheDocument();
 fireEvent.click(within(artigo).getByRole('button',{name:'Separar'}));
 fireEvent.click(screen.getByRole('button',{name:'Incorporar à ficha'}));
 const ficha=JSON.parse(localStorage.getItem('espiral:sheet:v1:12345678'));
 expect(ficha.weapons).toHaveLength(2);
 expect(ficha.weapons[1]).toMatchObject({name:'Faca',damage:'1d6'});
 expect(ficha.name).toBe('Maya');expect(ficha.notes).toBe('Preservar');
 expect(screen.getByRole('button',{name:'Incorporar à ficha'})).toBeDisabled();
});
test('selecionar arma da lista exibe suas características na área de inspeção',()=>{
 render(<LojaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:/^Faca ARMA/}));
 const detalhe=screen.getByRole('region',{name:'Item selecionado'});
 expect(within(detalhe).getByRole('heading',{name:'Faca'})).toBeInTheDocument();
 expect(within(detalhe).getByText('Corte/Perfuração · Ocultável')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:/^Faca ARMA/})).toHaveAttribute('aria-pressed','true');
});
test('busca vazia informa o resultado e permite recuperar os itens',()=>{
 render(<LojaEspiral/>);
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'inexistente'}});
 expect(screen.getByText(/Nenhum item encontrado/)).toBeInTheDocument();
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:''}});
 expect(screen.getByRole('button',{name:/^Faca ARMA/})).toBeInTheDocument();
});
