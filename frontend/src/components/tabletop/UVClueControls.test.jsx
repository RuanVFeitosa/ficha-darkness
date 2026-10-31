import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import UVClueControls from './UVClueControls';
test('mestre cria uma mensagem e ajusta ou remove pistas existentes',()=>{
 const create=jest.fn(),edit=jest.fn(),remove=jest.fn();
 render(<UVClueControls clues={[{id:'mark',name:'Mensagem'}]} onCreate={create} onEdit={edit} onRemove={remove}/>);
 const button=screen.getByRole('button',{name:'Posicionar pista UV no mapa'});
 expect(button).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Texto da pista UV'),{target:{value:'  Porta 37  '}});
 fireEvent.click(button);expect(create).toHaveBeenCalledWith('Porta 37');
 expect(screen.getByLabelText('Texto da pista UV')).toHaveValue('');
 fireEvent.click(screen.getByRole('button',{name:'Ajustar'}));expect(edit).toHaveBeenCalledWith('mark');
 fireEvent.click(screen.getByRole('button',{name:'Remover pista UV Mensagem'}));expect(remove).toHaveBeenCalledWith('mark');
});
