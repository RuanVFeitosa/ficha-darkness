import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import TokenQuickActions from './TokenQuickActions';
test('quick actions focus the dialog, hide a token and reveal to a chosen player',()=>{
 const visibility=jest.fn(),focus=jest.fn(),close=jest.fn();
 const {rerender}=render(<TokenQuickActions name="Guarda" onVisibility={visibility} onFocus={focus} onEdit={()=>{}} onClose={close}/>);
 expect(screen.getByRole('button',{name:'Fechar ações do token'})).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Ocultar dos jogadores'}));
 expect(visibility).toHaveBeenCalledWith({hidden:true});
 fireEvent.click(screen.getByRole('button',{name:'Focar câmera'}));expect(focus).toHaveBeenCalled();
 rerender(<TokenQuickActions name="Guarda" audience={[]} members={[{ficha_id:'123',nome:'Ana'}]} onVisibility={visibility} onFocus={focus} onEdit={()=>{}} onClose={close}/>);
 fireEvent.click(screen.getByLabelText('Ana'));expect(visibility).toHaveBeenCalledWith({audience:['123']});
 fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(close).toHaveBeenCalled();
});
test('initiative errors remain visible and do not close the dialog',async()=>{
 const close=jest.fn(),add=jest.fn().mockRejectedValue(new Error('Sem conexão'));
 render(<TokenQuickActions name="Guarda" onVisibility={()=>{}} onFocus={()=>{}} onEdit={()=>{}} onClose={close} onInitiative={add}/>);
 fireEvent.change(screen.getByLabelText('Iniciativa'),{target:{value:'8'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar à iniciativa'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
 expect(add).toHaveBeenCalledWith(8);expect(close).not.toHaveBeenCalled();
 await waitFor(()=>expect(screen.getByRole('button',{name:'Adicionar à iniciativa'})).not.toBeDisabled());
});
