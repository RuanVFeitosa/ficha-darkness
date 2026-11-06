import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CriadorCutscene from './CriadorCutscene';
import {buscarCampanhaPorCodigo,salvarCena} from '../services/mesaApi';
jest.mock('../services/mesaApi',()=>({buscarCampanhaPorCodigo:jest.fn(),salvarCena:jest.fn(),resolverProjetoCutscene:jest.fn(),enviarMidiaCutscene:jest.fn()}));
jest.mock('../components/cutscene/CutsceneEditor',()=>props=><section><h1>{props.initialValue.name}</h1>{props.navigation}<button onClick={()=>props.onApply({version:1,name:'Projeto salvo',duration:10,layers:[]})}>Salvar teste</button><span>{props.standalone?'Editor completo':'Editor incorporado'}</span></section>);
const campaign={id:'c1',codigo:'TEST78',nome:'Campanha de teste',cenas:[{id:'s1',nome:'Abertura',cenaEspecial:{cutscene:{name:'Projeto existente'}}}],tokens:[]};
beforeEach(()=>{jest.clearAllMocks();window.history.replaceState({},'', '/?cutscene=1&campanha=TEST78&cena=s1&retorno=3d');buscarCampanhaPorCodigo.mockResolvedValue(campaign);salvarCena.mockResolvedValue({...campaign.cenas[0],cenaEspecial:{}});});
test('abre projeto existente, mantém página dedicada e retorna ao tabletop de origem',async()=>{
 render(<CriadorCutscene/>);
 expect(await screen.findByRole('heading',{name:'Projeto existente'})).toBeInTheDocument();
 expect(screen.getByText('Editor completo')).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Voltar à campanha ou tabletop'})).toHaveAttribute('href','/?campanha=TEST78&papel=mestre&tabletop3d=1');
 fireEvent.click(screen.getByRole('button',{name:'Salvar teste'}));
 await waitFor(()=>expect(salvarCena).toHaveBeenCalledWith('c1',expect.objectContaining({id:'s1',nome:'Projeto salvo',cenaEspecial:expect.objectContaining({tipoMidia:'cutscene'})})));
});
test('uma cena inexistente exibe erro sem abrir ou substituir outro projeto',async()=>{
 window.history.replaceState({},'', '/?cutscene=1&campanha=TEST78&cena=missing');render(<CriadorCutscene/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('A cena solicitada não está nesta campanha.');
 expect(screen.queryByText('Editor completo')).toBeNull();
 expect(salvarCena).not.toHaveBeenCalled();
});
