import { act, renderHook } from '@testing-library/react';
import useLoginSound from './useLoginSound';
function contexto() {
 const source = {connect:jest.fn(),start:jest.fn(),stop:jest.fn()};
 return {state:'running',currentTime:0,sampleRate:44100,destination:{},source,createBuffer:jest.fn(()=>({getChannelData:()=>new Float32Array(2000)})),createBufferSource:jest.fn(()=>source),createBiquadFilter:jest.fn(()=>({connect:jest.fn(),frequency:{value:0},Q:{value:0}})),createGain:jest.fn(()=>({connect:jest.fn(),gain:{setValueAtTime:jest.fn(),exponentialRampToValueAtTime:jest.fn()}})),close:jest.fn(()=>Promise.resolve())};
}
afterEach(()=>{delete window.AudioContext;localStorage.clear();});
test('sintetiza toque local e silencia após desligar o som',()=>{
 const audio=contexto();window.AudioContext=jest.fn(()=>audio);
 const hook=renderHook(useLoginSound);
 act(()=>hook.result.current.tocar());expect(audio.source.start).toHaveBeenCalledTimes(1);
 act(()=>hook.result.current.alternar());
 expect(localStorage.getItem('darkness:login:som')).toBe('off');
 act(()=>hook.result.current.tocar());expect(audio.source.start).toHaveBeenCalledTimes(1);
 hook.unmount();expect(audio.close).toHaveBeenCalledTimes(1);
});
test('navegador sem Web Audio mantém digitação disponível',()=>{
 const hook=renderHook(useLoginSound);
 expect(()=>hook.result.current.tocar()).not.toThrow();
});
