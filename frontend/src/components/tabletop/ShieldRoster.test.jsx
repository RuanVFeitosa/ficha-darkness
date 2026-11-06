import React from 'react';
import {render,screen,fireEvent,within,waitFor} from '@testing-library/react';
import ShieldRoster from './ShieldRoster';
const enemy={id:'a',nome:'Cultista',defesa:2,tipo:'inimigo',sanidade:{atual:6,max:10},membros:{cabeca:{atual:8,max:12},torso:{atual:20,max:20}},ataques:[{nome:'Adaga',dano:'1d6'}]};
const npc={id:'b',nome:'Médica',tipo:'npc',defesa:1};
beforeEach(()=>localStorage.clear());
test('filters NPCs and searches names without accents',()=>{
 render(<ShieldRoster system="absoluto" enemies={[enemy,npc]}/>);
 fireEvent.click(screen.getByText('Cultista'));
 expect(screen.getByRole('article',{name:'Cultista'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'NPCs · 1'}));
 expect(screen.queryByRole('article',{name:'Cultista'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Buscar inimigo ou NPC'),{target:{value:'medica'}});
 expect(screen.getByRole('article',{name:'Médica'})).toBeInTheDocument();
});
test('edits regional integrity without losing other regions or resources',async()=>{
 const onSave=jest.fn().mockResolvedValue();
 render(<ShieldRoster system="absoluto" enemies={[enemy]} onSave={onSave}/>);
 fireEvent.click(screen.getByText('Cultista'));
 const input=screen.getByLabelText('Valor para alterar Cabeça de Cultista');
 fireEvent.change(input,{target:{value:'4'}});fireEvent.click(screen.getByRole('button',{name:'Subtrair de Cabeça de Cultista'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith({...enemy,membros:{...enemy.membros,cabeca:{atual:4,max:12}}}));
 expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
 expect(screen.getByText('Adaga')).toBeInTheDocument();
});
test('save failures are visible and do not report success',async()=>{
 const onSave=jest.fn().mockRejectedValue(new Error('Falha de conexão'));
 render(<ShieldRoster system="absoluto" enemies={[enemy]} onSave={onSave}/>);
 fireEvent.click(screen.getByText('Cultista'));
 const input=screen.getByLabelText('Defesa de Cultista');
 fireEvent.change(input,{target:{value:'3'}});fireEvent.blur(input);
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha de conexão');
 expect(screen.queryByText('Alterações salvas.')).not.toBeInTheDocument();
});
test('chooses combat defense directly from a participant',async()=>{
 const onChoose=jest.fn().mockResolvedValue();
 render(<ShieldRoster system="absoluto" enemies={[enemy]} onChoose={onChoose}/>);
 fireEvent.click(screen.getByText('Cultista'));
 fireEvent.click(screen.getByRole('button',{name:'Usar Defesa no combate'}));
 await waitFor(()=>expect(onChoose).toHaveBeenCalledWith({combateInimigoId:'a'}));
});
test('adds existing NPCs from the library and hides already linked entries',async()=>{
 localStorage.setItem('darkness_inimigos',JSON.stringify([{...enemy,id:'source-a'}]));
 localStorage.setItem('darkness_npcs',JSON.stringify([npc]));
 const onAdd=jest.fn().mockResolvedValue();
 render(<ShieldRoster system="absoluto" enemies={[{...enemy,inimigo_ref:'source-a'}]} onAdd={onAdd}/>);
 fireEvent.click(screen.getByText('Cultista'));
 fireEvent.click(screen.getByText('+ Adicionar participantes'));
 expect(screen.queryByRole('button',{name:'Adicionar Cultista à mesa'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Buscar na biblioteca'),{target:{value:'medica'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Médica à mesa'}));
 await waitFor(()=>expect(onAdd).toHaveBeenCalledWith(npc));
});

test('vital adjustments clamp healing at maximum and damage at zero',async()=>{
 const onSave=jest.fn().mockResolvedValue();
 const view=render(<ShieldRoster system="absoluto" enemies={[enemy]} onSave={onSave}/>);
 fireEvent.click(screen.getByText('Cultista'));
 const input=screen.getByLabelText('Valor para alterar Sanidade de Cultista');
 fireEvent.change(input,{target:{value:'99'}});
 fireEvent.click(screen.getByRole('button',{name:'Somar a Sanidade de Cultista'}));
 await waitFor(()=>expect(onSave).toHaveBeenLastCalledWith({...enemy,sanidade:{atual:10,max:10}}));
 await screen.findByText('Alterações salvas.');
 fireEvent.click(screen.getByRole('button',{name:'Subtrair de Sanidade de Cultista'}));
 await waitFor(()=>expect(onSave).toHaveBeenLastCalledWith({...enemy,sanidade:{atual:0,max:10}}));
 view.rerender(<ShieldRoster system="absoluto" enemies={[{...enemy,sanidade:{atual:0,max:10}}]} onSave={onSave}/>);
 expect(screen.getByRole('button',{name:'Subtrair de Sanidade de Cultista'})).toBeDisabled();
});
