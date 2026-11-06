import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import InlineInitiative from './InlineInitiative';
test('adiciona mais um turno de boss diretamente ao lado dos valores existentes',async()=>{
 const record={id:'boss',nome:'Chefe',bossIniciativa:true};
 const onAdd=jest.fn().mockResolvedValue(undefined);
 render(<InlineInitiative record={record} turns={[{chave:'inimigo:boss:1',valor:7}]} drafts={{}} onAdd={onAdd}/>);
 expect(screen.getByLabelText('Iniciativa 1 de Chefe')).toHaveValue('7');
 fireEvent.change(screen.getByLabelText('Nova iniciativa de Chefe'),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar iniciativa de Chefe'}));
 await waitFor(()=>expect(onAdd).toHaveBeenCalledWith(record,0,'boss'));
 await waitFor(()=>expect(screen.getByLabelText('Nova iniciativa de Chefe')).toHaveValue(null));
});
