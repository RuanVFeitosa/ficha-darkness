import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ArchetypePicker from './ArchetypePicker';
const arquetipos=[{id:'lutador',nome:'O Lutador',descricao:'Enfrenta o perigo.',vantagens:['+2 em combate'],desvantagem:'Pouca paciência.',habilidadePrincipal:'Fúria Interior'},{id:'investigador',nome:'O Investigador',descricao:'Segue as pistas.',vantagens:['+2 em investigação'],desvantagem:'Curiosidade.',habilidadePrincipal:'Olhar atento'}];
test('mini cards selecionam o arquétipo e revelam apenas seus detalhes ao lado',()=>{
 const onSelect=jest.fn();
 const view=render(<ArchetypePicker arquetipos={arquetipos} selecionado="" onSelect={onSelect}/>);
 expect(screen.queryByText('Fúria Interior')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/O Lutador/}));
 expect(onSelect).toHaveBeenCalledWith(arquetipos[0]);
 view.rerender(<ArchetypePicker arquetipos={arquetipos} selecionado="lutador" onSelect={onSelect}/>);
 const painel=screen.getByRole('region',{name:'Detalhes do arquétipo'});
 expect(within(painel).getByText('Fúria Interior')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:/O Lutador/})).toHaveAttribute('aria-pressed','true');
 expect(within(painel).queryByText('Olhar atento')).not.toBeInTheDocument();
 view.rerender(<ArchetypePicker arquetipos={arquetipos} selecionado="investigador" onSelect={onSelect}/>);
 expect(within(painel).getByText('Olhar atento')).toBeInTheDocument();
 expect(within(painel).queryByText('Fúria Interior')).not.toBeInTheDocument();
});
