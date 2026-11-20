import React from 'react';
import {render,screen,within,waitFor} from '@testing-library/react';
import PlayerSheetSummaries from './PlayerSheetSummaries';
import {freshProtocolSheet} from '../../data/protocoloDarkness';
import {buscarFichaEspiral} from '../../services/espiralApi';
import {buscarPersonagem} from '../../services/personagemApi';
jest.mock('../../services/espiralApi',()=>({buscarFichaEspiral:jest.fn()}));
jest.mock('../../services/personagemApi',()=>({buscarPersonagem:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();buscarFichaEspiral.mockResolvedValue(null);buscarPersonagem.mockResolvedValue(null);});
test('protocol cards display actual vitals, defenses and attribute dice without losing zeros',()=>{
 const sheet={...freshProtocolSheet(),name:'Alessandra',player:'Ana',occupation:'Investigadora',profileImage:'/alessandra.png',integrity:0,sanity:4,hope:10,pressure:0,attributes:{pulso:3,razao:4,sentido:2,voz:1}};
 render(<PlayerSheetSummaries active={false} members={[{ficha_id:'espiral:123',nome:'Nome antigo'}]} characters={{'espiral:123':sheet}}/>);
 const card=screen.getByRole('article',{name:'Resumo de Alessandra'});
 expect(within(card).getByRole('heading',{name:'Alessandra'})).toBeInTheDocument();
 expect(card.querySelector('img')).toHaveAttribute('src','/alessandra.png');
 expect(within(card).getByText('Investigadora')).toBeInTheDocument();
 expect(card.querySelector('[data-tone=integrity]')).toHaveTextContent('0 / 40');
 expect(card.querySelector('[data-tone=sanity]')).toHaveTextContent('4 / 10');
 expect(card.querySelector('.shield-player-defenses')).toHaveTextContent('Esquiva2Defesa1Bloqueio3Pressão0');
 expect(card.querySelector('.shield-player-attributes')).toHaveTextContent('Pulsod8Razãod10Sentidod6Vozd4');
});
test('only player sheets appear and missing sheets do not receive invented stats',()=>{
 render(<PlayerSheetSummaries active={false} members={[{ficha_id:'espiral:a',nome:'Ana'},{ficha_id:'npc:1',nome:'NPC'},{ficha_id:'inimigo:1',nome:'Ameaça'},{ficha_id:'custom3d:1',nome:'Objeto'},{ficha_id:'master',nome:'Mestre',papel:'mestre'}]}/>);
 expect(screen.getAllByRole('article')).toHaveLength(1);
 expect(screen.getByText('Ficha indisponível no momento.')).toBeInTheDocument();
 expect(screen.queryByText('Integridade')).not.toBeInTheDocument();
});
test('fetches linked remote sheets and keeps local data when another sheet cannot load',async()=>{
 buscarFichaEspiral.mockResolvedValueOnce({...freshProtocolSheet(),name:'Ficha remota',integrity:12});
 buscarPersonagem.mockRejectedValueOnce(new Error('Offline'));
 render(<PlayerSheetSummaries members={[{ficha_id:'espiral:remote',nome:'Remota'},{ficha_id:'local',nome:'Local'}]} characters={{'darkness:local':{...freshProtocolSheet(),name:'Cópia local',integrity:8}}}/>);
 await waitFor(()=>expect(screen.getByRole('article',{name:'Resumo de Ficha remota'})).toBeVisible());
 expect(buscarFichaEspiral).toHaveBeenCalledWith('remote');expect(buscarPersonagem).toHaveBeenCalledWith('local');
 expect(screen.getByRole('article',{name:'Resumo de Cópia local'})).toBeVisible();
});
test('inactive shield sections do not fetch player data',()=>{
 render(<PlayerSheetSummaries active={false} members={[{ficha_id:'espiral:a',nome:'Ana'}]}/>);
 expect(buscarFichaEspiral).not.toHaveBeenCalled();
});
