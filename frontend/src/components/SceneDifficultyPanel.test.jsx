import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SceneDifficultyPanel from './SceneDifficultyPanel';
test('exibe todas as categorias e permite selecionar e editar sem editar Defesa',()=>{
 const onSave=jest.fn();
 render(<SceneDifficultyPanel scene={{dificuldades:{ambiente:5,combateAmbiente:8,conflitos:10}}} enemies={[{id:'a',nome:'Monstro',defesa:12}]} onSave={onSave}/>);
 expect(screen.getByRole('heading',{name:'Ambiente'})).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Combate'})).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Conflitos'})).toBeInTheDocument();
 expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 const input=screen.getByLabelText('Dificuldade de Ambiente da cena');
 fireEvent.change(input,{target:{value:'7'}});fireEvent.blur(input);
 expect(onSave).toHaveBeenCalledWith({ambiente:7});
 expect(screen.getByText('12')).toBeInTheDocument();
});