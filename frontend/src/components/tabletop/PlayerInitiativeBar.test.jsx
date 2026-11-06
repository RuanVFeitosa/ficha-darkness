import React from 'react';
import {render,screen} from '@testing-library/react';
import PlayerInitiativeBar from './PlayerInitiativeBar';
import {initiativeOrder} from '../../utils/initiativeOrder';

test('mostra automaticamente os cards ao iniciar combate e remove ao encerrar',()=>{
 const campaign={membros:[{ficha_id:'a',nome:'Ellie'}],iniciativas:{a:7},inimigos:[]};
 const {rerender}=render(<PlayerInitiativeBar campaign={campaign} entries={initiativeOrder(campaign)}/>);
 expect(screen.queryByRole('region')).not.toBeInTheDocument();
 rerender(<PlayerInitiativeBar campaign={{...campaign,combateAtivo:true}} entries={initiativeOrder(campaign)}/>);
 expect(screen.getByRole('region',{name:'Iniciativa de combate'})).toHaveTextContent('Ellie');
 expect(screen.getByLabelText('Iniciativa de Ellie')).toHaveTextContent('7');
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 rerender(<PlayerInitiativeBar campaign={campaign} entries={initiativeOrder(campaign)}/>);
 expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
test('investigação inclui os múltiplos turnos de bosses na mesma ordem do mestre',()=>{
 const campaign={investigacaoAtiva:true,membros:[],inimigos:[{id:'boss',nome:'Chefe',bossIniciativa:true}],iniciativas:{'inimigo:boss:1':4,'inimigo:boss:2':9}};
 const entries=initiativeOrder(campaign);
 expect(entries.map(entry=>entry.valor)).toEqual([9,4]);
 const {container}=render(<PlayerInitiativeBar campaign={campaign} entries={entries} variant="3d"/>);
 expect(screen.getByRole('region',{name:'Iniciativa de investigação'})).toBeInTheDocument();
 expect(container.querySelectorAll('[data-kind="boss"]')).toHaveLength(2);
});
test('coluna do jogador destaca o turno atual com identidade do sistema',()=>{
 const campaign={sistema:'espiral',combateAtivo:true,turnoCombate:{chave:'a',rodada:2,estado:'ativo'}};
 const entries=[{chave:'a',nome:'Ellie',tipo:'jogador',valor:7}];
 const {container,rerender}=render(<PlayerInitiativeBar campaign={campaign} entries={entries}/>);
 expect(container.querySelector('[data-system="espiral"]')).toBeInTheDocument();
 expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Ellie');
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
 rerender(<PlayerInitiativeBar campaign={{...campaign,turnoCombate:{...campaign.turnoCombate,estado:'encerrado'}}} entries={entries}/>);
 expect(container.querySelector('[aria-current="step"]')).toBeNull();
});
