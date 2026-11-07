import {renderHook,waitFor,act} from '@testing-library/react';
import useSheetAmmoEnabled from './useSheetAmmoEnabled';
import {listarCampanhasDaFicha,ouvirCampanha} from '../services/mesaApi';
jest.mock('../services/mesaApi',()=>({listarCampanhasDaFicha:jest.fn(),ouvirCampanha:jest.fn()}));
const campaign=enabled=>({id:'c',codigo:'ABC',mecanicasEspeciais:{optionalSystems:[{kind:'ammo',enabled}]}});
beforeEach(()=>{jest.clearAllMocks();window.history.replaceState({},'','/');});
test('ficha embutida acompanha a campanha atual sem consultar outras campanhas',()=>{
 const view=renderHook(({value})=>useSheetAmmoEnabled('espiral:123',value),{initialProps:{value:campaign(true)}});
 expect(view.result.current).toBe(true);
 view.rerender({value:campaign(false)});expect(view.result.current).toBe(false);
 expect(listarCampanhasDaFicha).not.toHaveBeenCalled();
});
test('ficha vinculada sincroniza ativação e desativação e encerra assinatura',async()=>{
 let refresh;const stop=jest.fn();ouvirCampanha.mockImplementation((id,fn)=>{refresh=fn;return stop;});
 listarCampanhasDaFicha.mockResolvedValue([campaign(true)]);
 const view=renderHook(()=>useSheetAmmoEnabled('espiral:123'));
 await waitFor(()=>expect(view.result.current).toBe(true));
 expect(listarCampanhasDaFicha).toHaveBeenCalledWith('espiral:123');
 listarCampanhasDaFicha.mockResolvedValue([campaign(false)]);
 await act(async()=>refresh());expect(view.result.current).toBe(false);
 view.unmount();expect(stop).toHaveBeenCalled();
});
test('sem vínculo não mostra munição',async()=>{
 listarCampanhasDaFicha.mockResolvedValue([]);
 const view=renderHook(()=>useSheetAmmoEnabled('espiral:123'));
 await act(async()=>{});expect(view.result.current).toBe(false);
});
