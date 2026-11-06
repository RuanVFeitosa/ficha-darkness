import {renderHook,act} from '@testing-library/react';
import useCutsceneClock from './useCutsceneClock';
let frame;
beforeEach(()=>{jest.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{frame=callback;return 1;});jest.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});});
afterEach(()=>jest.restoreAllMocks());
test('reprodução termina no fim, reinicia e pausa sem avançar',()=>{
 const {result}=renderHook(()=>useCutsceneClock(2,false,true));
 act(()=>frame(0));act(()=>frame(1000));expect(result.current.time).toBe(1);
 act(()=>frame(3000));expect(result.current.time).toBe(2);expect(result.current.playing).toBe(false);
 act(()=>result.current.restart());expect(result.current.time).toBe(0);expect(result.current.playing).toBe(true);
 act(()=>result.current.toggle());expect(result.current.playing).toBe(false);
});
test('loop preserva o excesso de tempo e continua reproduzindo',()=>{
 const {result}=renderHook(()=>useCutsceneClock(2,true,true));
 act(()=>frame(0));act(()=>frame(2500));expect(result.current.time).toBe(.5);expect(result.current.playing).toBe(true);
});
