import { salvarFichaTemplate } from './characterTemplates';
import { criarPersonagem } from './personagemApi';
jest.mock('./personagemApi',()=>({criarPersonagem:jest.fn()}));
beforeEach(()=>{localStorage.clear();jest.clearAllMocks();});
test('criação Absoluto usa um novo ID do servidor',async()=>{
 criarPersonagem.mockResolvedValue({fichaId:'lia-2'});
 expect(await salvarFichaTemplate('darkness',{nome:'Lia'},{personagens:[]})).toEqual({id:'lia-2',sistema:'darkness'});
});
test('ESPIRAL grava uma ficha nova sem sobrescrever códigos existentes',async()=>{
 let tentativa=0;
 const originalCrypto=window.crypto;
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:a=>{a[0]=++tentativa;return a;}}});
 localStorage.setItem('espiral:sheet:v1:10000001',JSON.stringify({name:'Original'}));
 const ref=await salvarFichaTemplate('espiral',{name:'Cópia'},{personagens:[]});
 expect(ref.id).not.toBe('10000001');
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:10000001')).name).toBe('Original');
 expect(JSON.parse(localStorage.getItem(`espiral:sheet:v1:${ref.id}`)).name).toBe('Cópia');
 Object.defineProperty(window,'crypto',{configurable:true,value:originalCrypto});
});
test('limite impede criação antes de gravar',async()=>{
 await expect(salvarFichaTemplate('darkness',{}, {personagens:Array(10).fill({id:'a'})})).rejects.toThrow('10 personagens');
 expect(criarPersonagem).not.toHaveBeenCalled();
});
