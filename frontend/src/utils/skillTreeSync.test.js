import {createSkillTreeSync} from './skillTreeSync';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
test('uma leitura anterior à edição não pode restaurar valores antigos durante ou depois de salvar',async()=>{
 const remote=deferred(),sync=createSkillTreeSync(()=>remote.promise),version=sync.revision;
 expect(sync.canApplyRemote(version)).toBe(true);
 const saving=sync.enqueue({descricao:'Nova'});
 expect(sync.canApplyRemote(version)).toBe(false);
 remote.resolve({descricao:'Nova'});await saving;
 expect(sync.canApplyRemote(version)).toBe(false);
 expect(sync.canApplyRemote(sync.revision)).toBe(true);
});
test('edições consecutivas são enviadas em ordem e apenas a última publica o resultado',async()=>{
 const first=deferred(),save=jest.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce({descricao:'Final'});
 const sync=createSkillTreeSync(save),one=sync.enqueue({descricao:'Primeira'}),two=sync.enqueue({descricao:'Final'});
 await Promise.resolve();await Promise.resolve();
 expect(save).toHaveBeenCalledTimes(1);
 first.resolve({descricao:'Primeira'});
 expect((await one).latest).toBe(false);
 expect(await two).toEqual({latest:true,data:{descricao:'Final'}});
 expect(save.mock.calls.map(([value])=>value.descricao)).toEqual(['Primeira','Final']);
 expect(sync.canApplyRemote()).toBe(true);
});
test('falha protege a edição local e uma nova tentativa pode salvar',async()=>{
 const save=jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ok:true}),sync=createSkillTreeSync(save);
 await expect(sync.enqueue({descricao:'Nova'})).rejects.toThrow('offline');
 expect(sync.pending).toBe(0);expect(sync.canApplyRemote()).toBe(false);
 await sync.enqueue({descricao:'Nova'});expect(sync.canApplyRemote()).toBe(true);
});
