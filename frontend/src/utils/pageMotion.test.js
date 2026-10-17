import {fecharAnimado} from './pageMotion';
afterEach(()=>{delete window.matchMedia;});
test('aguarda a saída antes de desmontar e ignora cliques repetidos',async()=>{
 const node=document.createElement('div'),done=jest.fn();let finish;
 node.animate=jest.fn(()=>({finished:new Promise(resolve=>{finish=resolve;})}));
 fecharAnimado(node,done);fecharAnimado(node,done);
 expect(node.animate).toHaveBeenCalledTimes(1);expect(done).not.toHaveBeenCalled();
 finish();await Promise.resolve();expect(done).toHaveBeenCalledTimes(1);
});
test('movimento reduzido fecha sem animação',()=>{
 window.matchMedia=()=>({matches:true});
 const node=document.createElement('div'),done=jest.fn();node.animate=jest.fn();
 fecharAnimado(node,done);expect(done).toHaveBeenCalledTimes(1);expect(node.animate).not.toHaveBeenCalled();
});