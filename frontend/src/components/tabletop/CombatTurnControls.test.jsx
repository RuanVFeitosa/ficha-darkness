import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import CombatTurnControls from './CombatTurnControls';
test('mestre escolhe quem inicia, encerra e passa ao próximo',()=>{
 const onAction=jest.fn(),entries=[{chave:'a',nome:'Ellie',valor:9},{chave:'b',nome:'Chefe',valor:4}];
 const {rerender}=render(<CombatTurnControls entries={entries} onAction={onAction}/>);
 fireEvent.change(screen.getByLabelText('Participante do turno'),{target:{value:'b'}});
 fireEvent.click(screen.getByRole('button',{name:'Iniciar turno'}));
 expect(onAction).toHaveBeenLastCalledWith('start','b');
 rerender(<CombatTurnControls entries={entries} onAction={onAction} turn={{chave:'b',rodada:1,estado:'ativo'}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Encerrar turno'}));
 expect(onAction).toHaveBeenLastCalledWith('end');
 fireEvent.click(screen.getByRole('button',{name:/Encerrar e próximo/}));
 expect(onAction).toHaveBeenLastCalledWith('next');
});
