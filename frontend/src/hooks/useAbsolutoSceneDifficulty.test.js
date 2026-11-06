import {renderHook,waitFor,act} from '@testing-library/react';
import useAbsolutoSceneDifficulty from './useAbsolutoSceneDifficulty';
import {buscarCampanhaPorCodigo,ouvirCampanha} from '../services/mesaApi';
jest.mock('../services/mesaApi',()=>({buscarCampanhaPorCodigo:jest.fn(),ouvirCampanha:jest.fn()}));
test('sheet follows chosen defense, combat end, and unsubscribes',async()=>{
 const campaign={id:'c',combateAtivo:true,cenaAtiva:{dificuldades:{ambiente:1,combateInimigoId:'b'}},inimigos:[{id:'b',defesa:3}]};
 buscarCampanhaPorCodigo.mockResolvedValue(campaign);
 const stop=jest.fn();let refresh;ouvirCampanha.mockImplementation((id,fn)=>{refresh=fn;return stop;});
 const view=renderHook(()=>useAbsolutoSceneDifficulty('CODE'));
 await waitFor(()=>expect(view.result.current.difficulty?.value).toBe(3));
 buscarCampanhaPorCodigo.mockResolvedValue({...campaign,combateAtivo:false});
 await act(async()=>refresh());
 expect(view.result.current.difficulty.value).toBe(1);
 view.unmount();expect(stop).toHaveBeenCalled();
});
test('standalone sheet keeps manual difficulty without campaign context',()=>{
 const view=renderHook(()=>useAbsolutoSceneDifficulty(null));
 expect(view.result.current.difficulty).toBeNull();expect(view.result.current.loading).toBe(false);
});
