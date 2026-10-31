import React from 'react';
import {render,act} from '@testing-library/react';
import useTabletopTokenSync from './useTabletopTokenSync';
import {buscarCampanhaPorCodigo} from '../../services/mesaApi';
jest.mock('../../services/mesaApi',()=>({buscarCampanhaPorCodigo:jest.fn()}));
test('jogador recebe nova pista mesmo sem evento realtime e atualiza ao voltar à tela',async()=>{
 jest.useFakeTimers();
 const onTokens=jest.fn();const tokens=[{id:'new',ficha_id:'custom3d:uv',posicoes:{uvText:'Mensagem'}}];
 buscarCampanhaPorCodigo.mockResolvedValue({tokens});
 function Demo(){useTabletopTokenSync('ABC',true,onTokens);return null;}
 const {unmount}=render(<Demo/>);
 await act(async()=>{jest.advanceTimersByTime(4000);});
 expect(buscarCampanhaPorCodigo).toHaveBeenCalledWith('ABC');
 expect(onTokens).toHaveBeenCalledWith(tokens);
 await act(async()=>window.dispatchEvent(new Event('focus')));
 expect(buscarCampanhaPorCodigo).toHaveBeenCalledTimes(2);
 unmount();await act(async()=>{jest.advanceTimersByTime(8000);});
 expect(buscarCampanhaPorCodigo).toHaveBeenCalledTimes(2);
 jest.useRealTimers();
});
