import {muralClient} from './investigacaoApi';
import {executarAcaoMural} from './personagemApi';
import {SENHA_MESTRE} from '../constants/masterAccess';
jest.mock('./personagemApi',()=>({executarAcaoMural:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
test('mural pessoal usa o perfil e envia revisão junto da mutação',()=>{
 const client=muralClient({scope:'pessoal',id:'1234',codigo:'1234'});
 client.load();expect(executarAcaoMural).toHaveBeenCalledWith('pessoal','1234',{playerCode:'1234',action:'load'});
 client.mutate(7,'moveCard',{id:'pista',x:10,y:20});expect(executarAcaoMural).toHaveBeenLastCalledWith('pessoal','1234',{playerCode:'1234',version:7,action:'moveCard',id:'pista',x:10,y:20});
});
test('mestre registra participantes locais ao abrir a campanha',()=>{
 muralClient({scope:'campanha',id:'c1',mestre:true,members:['ana','espiral:bia']}).load();
 expect(executarAcaoMural).toHaveBeenCalledWith('campanha','c1',{masterPassword:SENHA_MESTRE,action:'load',members:['ana','espiral:bia']});
});
