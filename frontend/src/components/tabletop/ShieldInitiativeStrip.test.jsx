jest.mock('../../services/mesaApi',()=>({atualizarModoCombate:jest.fn(),atualizarModoInvestigacao:jest.fn(),definirIniciativa:jest.fn(),salvarTurnoCombate:jest.fn()}));
import {atualizarModoCombate,atualizarModoInvestigacao,definirIniciativa,salvarTurnoCombate} from '../../services/mesaApi';
import React,{useState} from 'react';
import {render,screen,within,fireEvent,waitFor} from '@testing-library/react';
import ShieldInitiativeStrip from './ShieldInitiativeStrip';
const campaign={combateAtivo:true,membros:[{ficha_id:'lia',nome:'Lia'},{ficha_id:'ana',nome:'Ana'}],iniciativas:{lia:4,ana:9},turnoCombate:{chave:'lia',rodada:2,estado:'ativo'}};
test('header initiative shows sorted entries and follows the current round and turn',()=>{
 const {rerender}=render(<ShieldInitiativeStrip campaign={campaign}/>);
 const items=within(screen.getByRole('list',{name:'Ordem de iniciativa'})).getAllByRole('listitem');
 expect(items[0]).toHaveTextContent('Ana');expect(items[1]).toHaveTextContent('Lia');
 expect(items[1]).toHaveAttribute('aria-current','step');
 expect(screen.getByRole('status')).toHaveTextContent('Rodada 2 · Em andamento');
 rerender(<ShieldInitiativeStrip campaign={{...campaign,turnoCombate:{chave:'ana',rodada:3,estado:'encerrado'}}}/>);
 expect(screen.getByRole('status')).toHaveTextContent('Rodada 3 · Turno encerrado');
 expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current','step');
});
test('investigation uses the same order and inactive sessions hide stale turn data',()=>{
 const {rerender}=render(<ShieldInitiativeStrip campaign={{...campaign,combateAtivo:false,investigacaoAtiva:true}}/>);
 expect(screen.getByRole('status')).toHaveTextContent('Investigação');
 expect(screen.queryByText('Agora')).not.toBeInTheDocument();
 rerender(<ShieldInitiativeStrip campaign={{...campaign,combateAtivo:false}}/>);
 expect(screen.queryByRole('list')).not.toBeInTheDocument();
 expect(screen.getByRole('status')).toHaveTextContent('Sem combate ou investigação');
});

function Editable({initial}) {const [state,setState]=useState(initial);return <ShieldInitiativeStrip campaign={state} onCampaignChange={setState}/>;}
beforeEach(()=>{jest.clearAllMocks();atualizarModoCombate.mockResolvedValue();atualizarModoInvestigacao.mockResolvedValue();definirIniciativa.mockResolvedValue();salvarTurnoCombate.mockImplementation(async(id,turn)=>turn);});
test('header starts and ends turns, advances the order and sends the expected revision',async()=>{
 render(<Editable initial={{...campaign,id:'c',turnoCombate:null}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Iniciar turno',exact:true}));
 await waitFor(()=>expect(salvarTurnoCombate).toHaveBeenCalledWith('c',expect.objectContaining({chave:'ana',rodada:1,estado:'ativo',revision:1}),0));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Encerrar turno',exact:true})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'Encerrar turno',exact:true}));
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Turno encerrado'));
 await waitFor(()=>expect(screen.getByRole('button',{name:/Próximo turno/})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:/Próximo turno/}));
 await waitFor(()=>expect(salvarTurnoCombate).toHaveBeenLastCalledWith('c',expect.objectContaining({chave:'lia',estado:'ativo',revision:3}),2));
 await waitFor(()=>expect(screen.getByRole('button',{name:/Encerrar e próximo/})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:/Encerrar e próximo/}));
 await waitFor(()=>expect(salvarTurnoCombate).toHaveBeenLastCalledWith('c',expect.objectContaining({chave:'ana',rodada:2,revision:4}),3));
});
test('header changes session modes without deleting initiative values',async()=>{
 render(<Editable initial={{...campaign,id:'c',combateAtivo:false,turnoCombate:null}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Iniciar combate'}));
 await waitFor(()=>expect(atualizarModoCombate).toHaveBeenCalledWith('c',true,false));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Iniciar investigação'})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'Iniciar investigação'}));
 await waitFor(()=>expect(atualizarModoInvestigacao).toHaveBeenCalledWith('c',true,false));
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Investigação'));
 expect(screen.getByLabelText('Iniciativa de Ana')).toHaveValue(9);
 expect(screen.getByRole('button',{name:'Iniciar turno',exact:true})).toBeDisabled();
});
test('editing initiative persists a zero value and shows server errors without losing the draft',async()=>{
 render(<Editable initial={{...campaign,id:'c'}}/>);
 const field=screen.getByLabelText('Iniciativa de Ana');
 fireEvent.change(field,{target:{value:'0'}});fireEvent.blur(field);
 await waitFor(()=>expect(definirIniciativa).toHaveBeenCalledWith('c','ana',0,'Ana'));
 await waitFor(()=>expect(field).not.toBeDisabled());
 definirIniciativa.mockRejectedValueOnce(new Error('Sem conexão'));
 fireEvent.change(field,{target:{value:'12'}});fireEvent.blur(field);
 expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
 expect(field).toHaveValue(12);
});
test('repeated turn clicks do not submit duplicate requests',async()=>{
 let complete;salvarTurnoCombate.mockImplementation(()=>new Promise(resolve=>{complete=resolve;}));
 render(<Editable initial={{...campaign,id:'c',turnoCombate:null}}/>);
 const button=screen.getByRole('button',{name:'Iniciar turno',exact:true});
 fireEvent.click(button);fireEvent.click(button);
 expect(salvarTurnoCombate).toHaveBeenCalledTimes(1);
 complete({chave:'ana',rodada:1,estado:'ativo',revision:1});
 await waitFor(()=>expect(button).not.toBeDisabled());
});
