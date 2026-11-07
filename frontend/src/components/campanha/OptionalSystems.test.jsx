import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import OptionalSystems from './OptionalSystems';
import {commitMechanicAction} from '../../services/mechanicActions';
jest.mock('../../services/mechanicActions',()=>({commitMechanicAction:jest.fn()}));
test('mestre cadastra sistema pela aba e recebe o estado persistido',async()=>{
 const state={version:1,revision:1,events:[],optionalSystems:[]};
 commitMechanicAction.mockResolvedValue(state);
 const onState=jest.fn();const campaign={id:'c',membros:[]};
 render(<OptionalSystems campaign={campaign} master onState={onState}/>);
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Contagem de balas'}));
 await waitFor(()=>expect(onState).toHaveBeenCalledWith(state));
 expect(commitMechanicAction.mock.calls[0][2]).toMatchObject({type:'optionalCreate',kind:'ammo'});
});
test('jogador vê somente regras ativas e seus próprios contadores sem administração',()=>{
 render(<OptionalSystems playerId="lia" campaign={{membros:[{ficha_id:'lia',nome:'Lia'},{ficha_id:'leo',nome:'Leo'}],mecanicasEspeciais:{version:1,revision:0,events:[],optionalSystems:[{id:'s',kind:'survival',name:'Fome e sede',enabled:true,participants:{lia:{hunger:3,thirst:2}}},{id:'secret',kind:'custom',name:'Desativado',enabled:false}]}}}/>);
 expect(screen.getByText('3/10')).toBeInTheDocument();expect(screen.queryByText('Leo')).not.toBeInTheDocument();expect(screen.queryByText('Desativado')).not.toBeInTheDocument();expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('criação personalizada fica recolhida e pode ser cancelada sem salvar',()=>{
 render(<OptionalSystems campaign={{id:'c',membros:[]}} master onState={jest.fn()}/>);
 expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Novo sistema'}));
 expect(screen.getByLabelText('Nome')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
});

test('controle de ativação persiste a mudança do sistema correto',async()=>{
 const campaign={id:'c',mecanicasEspeciais:{version:1,revision:0,events:[],optionalSystems:[{id:'ammo',kind:'ammo',name:'Contagem de balas',enabled:true}]}};
 commitMechanicAction.mockResolvedValue({...campaign.mecanicasEspeciais,revision:1});
 render(<OptionalSystems campaign={campaign} master onState={jest.fn()}/>);
 const toggle=screen.getByRole('switch',{name:'Ativar Contagem de balas'});
 expect(toggle).toHaveAttribute('aria-checked','true');fireEvent.click(toggle);
 await waitFor(()=>expect(commitMechanicAction).toHaveBeenLastCalledWith(campaign,expect.anything(),{type:'optionalToggle',id:'ammo'},expect.objectContaining({master:true})));
});
