jest.mock('./personagemApi',()=>({buscarPersonagem:jest.fn(),salvarPersonagem:jest.fn()}));
jest.mock('./syncEvents',()=>({notificarPersonagemAtualizado:jest.fn()}));
import {iniciarNovaCena} from './novaCena';
import {buscarPersonagem,salvarPersonagem} from './personagemApi';
import {resetarEfeitosCena} from '../utils/novaCena';
import {protegerDoMedo} from '../utils/absolutoMedo';

beforeEach(()=>jest.clearAllMocks());
test('limpa efeitos do sistema e preserva todos os efeitos ativados pelo jogador',()=>{
 const p={medo:6,bonusEsquivaMedo:3,protecaoMedoUsada:true,rupturaNaCena:true,esperancaNaCena:true,esperanca:{atual:2,max:7},sanidade:{atual:4},membros:{torso:{atual:10}},ritosAtivos:['rito'],efeitosHabilidadesAtivos:[{id:'habilidade'}],usosHabilidades:{h:'cena'}};
 const next=resetarEfeitosCena(p,'nova');
 expect(next).toMatchObject({medo:0,bonusEsquivaMedo:0,protecaoMedoUsada:false,rupturaNaCena:false,esperancaNaCena:false});
 for(const k of ['esperanca','sanidade','membros','ritosAtivos','efeitosHabilidadesAtivos','usosHabilidades']) expect(next[k]).toBe(p[k]);
 expect(protegerDoMedo({...next,medo:6}).medo).toBe(5);
});
test('busca fichas recentes, evita duplicatas e persiste o reset em todos os participantes',async()=>{
 buscarPersonagem.mockResolvedValue({medo:6,ritosAtivos:['rito']});salvarPersonagem.mockImplementation(async(id,p)=>p);
 expect(await iniciarNovaCena([{ficha_id:'a'},{ficha_id:'b'},{ficha_id:'a'},{}])).toBe(2);
 expect(buscarPersonagem).toHaveBeenCalledTimes(2);
 expect(salvarPersonagem).toHaveBeenCalledWith('a',expect.objectContaining({medo:0,ritosAtivos:['rito']}));
});
test('informa falha parcial sem declarar sucesso para todas as fichas',async()=>{
 buscarPersonagem.mockImplementation(async id=>{if(id==='b')throw Error('offline');return {medo:5};});
 await expect(iniciarNovaCena([{ficha_id:'a'},{ficha_id:'b'}])).rejects.toThrow('Falha nas fichas: b');
});
