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
 expect(screen.queryByRole('button',{name:/salvar/i})).not.toBeInTheDocument();
 expect(screen.getAllByRole('button',{name:'Aumentar valor'})).toHaveLength(3);
 const input=screen.getByLabelText('Dificuldade de Ambiente da cena');
 fireEvent.change(input,{target:{value:'7'}});fireEvent.blur(input);
 expect(onSave).toHaveBeenCalledWith({ambiente:7});
 expect(screen.getByText('12')).toBeInTheDocument();
});

test('master chooses the enemy whose defense defines combat difficulty',()=>{
 const onSave=jest.fn();
 const scene={dificuldades:{ambiente:1,combateAmbiente:4}};
 const enemies=[{id:'a',nome:'Cultista',defesa:2},{id:'b',nome:'Guardião',defesa:3}];
 const view=render(<SceneDifficultyPanel system="absoluto" scene={scene} enemies={enemies} onSave={onSave}/>);
 fireEvent.change(screen.getByLabelText('Inimigo que define a dificuldade de combate'),{target:{value:'b'}});
 expect(onSave).toHaveBeenCalledWith({combateInimigoId:'b'});
 view.rerender(<SceneDifficultyPanel system="absoluto" scene={{dificuldades:{...scene.dificuldades,combateInimigoId:'b'}}} enemies={enemies} onSave={onSave}/>);
 expect(screen.getByLabelText('Dificuldade de Ambiente do combate')).toHaveValue(3);
 expect(screen.getByLabelText('Dificuldade de Ambiente do combate')).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Inimigo que define a dificuldade de combate'),{target:{value:''}});
 expect(onSave).toHaveBeenLastCalledWith({combateInimigoId:null});
});
