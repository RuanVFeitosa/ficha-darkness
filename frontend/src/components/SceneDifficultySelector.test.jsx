import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SceneDifficultySelector from './SceneDifficultySelector';
test('jogador consulta a dificuldade sem selecionar contexto',()=>{
 render(<SceneDifficultySelector scene={{dificuldades:{ambiente:8}}} selected="ambiente" readOnly/>);
 expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
 expect(screen.getByText(/Dificuldade 8/)).toBeInTheDocument();
});
test('mestre seleciona inimigo com dificuldade automática da defesa',()=>{
 const onChange=jest.fn();render(<SceneDifficultySelector selected="ambiente" enemies={[{id:'a',nome:'Monstro',defesa:12}]} onChange={onChange}/>);
 expect(screen.getByRole('option',{name:'Monstro · Dificuldade 12'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'inimigo:a'}});
 expect(onChange).toHaveBeenCalledWith('inimigo:a');
});