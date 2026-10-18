import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import BuildCatalog from './BuildCatalog';
import {catalogoBuilds} from '../../utils/buildCatalog';
const catalogo=catalogoBuilds();
test('ESPIRAL mostra níveis I a III e custo da habilidade em cards',()=>{
 const onToggle=jest.fn();render(<BuildCatalog sistema="espiral" entries={catalogo} selected={[]} onToggle={onToggle} busca="" setBusca={jest.fn()}/>);
 expect(screen.getByRole('heading',{name:'Golpe Calculado'})).toBeInTheDocument();
 expect(screen.getAllByText('Nível III').length).toBeGreaterThan(0);
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Golpe Calculado à build'}));
 expect(onToggle).toHaveBeenCalledWith('espiral:Ofensiva:Golpe Calculado');
 expect(screen.queryByText(/Conceder a uma ficha/)).not.toBeInTheDocument();
});
test('ESPIRAL separa armas de fogo e armas brancas',()=>{
 render(<BuildCatalog sistema="espiral" entries={catalogo} selected={[]} onToggle={jest.fn()} busca="" setBusca={jest.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Armas e equipamentos'}));
 expect(screen.getByRole('heading',{name:'Pistola',exact:true})).toBeInTheDocument();
 expect(screen.getAllByRole('img',{name:'Dado de 6 faces'}).length).toBeGreaterThan(0);
 fireEvent.click(screen.getByRole('button',{name:'Armas brancas'}));
 expect(screen.getByRole('heading',{name:'Faca',exact:true})).toBeInTheDocument();
 expect(screen.queryByRole('heading',{name:'Pistola',exact:true})).not.toBeInTheDocument();
});
test('Absoluto filtra aptidões pela classe',()=>{
 render(<BuildCatalog sistema="darkness" entries={catalogo} selected={[]} onToggle={jest.fn()} busca="" setBusca={jest.fn()}/>);
 expect(screen.getByRole('heading',{name:'Concentracao Aniquiladora'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Aptidões',exact:true}));
 expect(screen.queryByRole('heading',{name:'Concentracao Aniquiladora'})).not.toBeInTheDocument();
 expect(screen.getAllByRole('button',{name:/^Adicionar .* à build$/}).length).toBeGreaterThan(0);
});
