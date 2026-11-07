import React from 'react';
import {render,screen,waitFor,act} from '@testing-library/react';
import SurvivalIndicators,{SheetSurvival,survivalFor} from './SurvivalIndicators';
import OptionalSystems from './OptionalSystems';
import {listarCampanhasDaFicha,ouvirCampanha} from '../../services/mesaApi';
jest.mock('../../services/mesaApi',()=>({listarCampanhasDaFicha:jest.fn(),ouvirCampanha:jest.fn()}));
const makeCampaign=(enabled=true,id='espiral:123')=>({id:'c',nome:'ATO III',codigo:'ATO',sistema:'espiral',membros:[{ficha_id:id}],mecanicasEspeciais:{optionalSystems:[{id:'survival',kind:'survival',enabled,participants:{[id]:{hunger:3,thirst:7}}}]}});
beforeEach(()=>{jest.clearAllMocks();window.history.replaceState({},'','/');});

test('10/10 no controle do mestre aparece como 10/10 na ficha e no HUD',()=>{
 const campaign=makeCampaign();
 campaign.membros[0].nome='Victoria';
 campaign.mecanicasEspeciais={version:1,revision:0,events:[],...campaign.mecanicasEspeciais};
 campaign.mecanicasEspeciais.optionalSystems[0].participants['espiral:123']={hunger:10,thirst:10};
 const {rerender}=render(<><OptionalSystems campaign={campaign} master/><SurvivalIndicators campaign={campaign} playerId="espiral:123"/></>);
 expect(screen.getAllByText('10/10')).toHaveLength(2);
 for(const meter of screen.getAllByRole('meter')){
  expect(meter).toHaveAttribute('aria-valuenow','10');
  expect(meter.querySelectorAll('.is-filled')).toHaveLength(10);
  expect(meter.closest('.survival-gauge')).toHaveAttribute('data-level','low');
 }
 rerender(<SurvivalIndicators campaign={campaign} playerId="espiral:123" compact/>);
 for(const meter of screen.getAllByRole('meter'))expect(meter).toHaveAttribute('aria-valuenow','10');
});

test('10 no escudo corresponde à barra cheia; zero esvazia a barra',()=>{
 const campaign=makeCampaign();
 campaign.mecanicasEspeciais.optionalSystems[0].participants['espiral:123']={hunger:10,thirst:0};
 render(<SurvivalIndicators campaign={campaign} playerId="espiral:123"/>);
 expect(screen.getByRole('meter',{name:'Fome'})).toHaveAttribute('aria-valuenow','10');
 expect(screen.getByRole('meter',{name:'Sede'})).toHaveAttribute('aria-valuenow','0');
 expect(screen.getByText('Alimentado')).toBeInTheDocument();
 expect(screen.getByRole('meter',{name:'Fome'}).querySelectorAll('.is-filled')).toHaveLength(10);
 expect(screen.getByRole('meter',{name:'Sede'}).querySelectorAll('.is-filled')).toHaveLength(0);
});

test('ficha e HUD mostram os mesmos contadores e ocultam ao desativar',()=>{
 const {rerender}=render(<SurvivalIndicators campaign={makeCampaign()} playerId="espiral:123"/>);
 expect(screen.getByRole('meter',{name:'Fome'})).toHaveAttribute('aria-valuenow','3');
 expect(screen.getByRole('meter',{name:'Sede'})).toHaveAttribute('aria-valuenow','7');
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 rerender(<SurvivalIndicators campaign={makeCampaign()} playerId="espiral:123" compact/>);
 expect(screen.getByRole('meter',{name:'Sede'})).toHaveAttribute('aria-valuenow','7');
 rerender(<SurvivalIndicators campaign={makeCampaign(false)} playerId="espiral:123"/>);
 expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});
test('não mostra dados de outros jogadores e aceita identificação do Absoluto',()=>{
 expect(survivalFor(makeCampaign(),'espiral:other')).toBeNull();
 expect(survivalFor(makeCampaign(true,'123'),'darkness:123')).toEqual({hunger:3,thirst:7});
 expect(survivalFor(makeCampaign(),'123')).toBeNull();
 const campaign=makeCampaign();campaign.mecanicasEspeciais.optionalSystems[0].participants={};
 expect(survivalFor(campaign,'espiral:123')).toEqual({hunger:0,thirst:0});
});
test('ficha avulsa acompanha atualizações da campanha vinculada e encerra assinatura',async()=>{
 let refresh;const stop=jest.fn();
 ouvirCampanha.mockImplementation((id,fn)=>{refresh=fn;return stop;});
 listarCampanhasDaFicha.mockResolvedValue([makeCampaign()]);
 const view=render(<SheetSurvival sheetId="espiral:123"/>);
 await waitFor(()=>expect(screen.getByRole('meter',{name:'Fome'})).toHaveAttribute('aria-valuenow','3'));
 const updated=makeCampaign();updated.mecanicasEspeciais.optionalSystems[0].participants['espiral:123'].hunger=8;
 listarCampanhasDaFicha.mockResolvedValue([updated]);
 await act(async()=>refresh());expect(screen.getByRole('meter',{name:'Fome'})).toHaveAttribute('aria-valuenow','8');
 listarCampanhasDaFicha.mockResolvedValue([makeCampaign(false)]);
 await act(async()=>refresh());expect(screen.queryByRole('meter')).not.toBeInTheDocument();
 view.unmount();expect(stop).toHaveBeenCalled();
});
test('campanha explícita do tabletop tem prioridade sobre outros vínculos',()=>{
 render(<SheetSurvival sheetId="espiral:123" campaign={makeCampaign(false)}/>);
 expect(listarCampanhasDaFicha).not.toHaveBeenCalled();expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});
