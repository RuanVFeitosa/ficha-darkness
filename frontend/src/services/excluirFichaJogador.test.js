import { excluirFichaJogador } from './excluirFichaJogador';
import { apagarPersonagem,buscarPersonagem,salvarJogador } from './personagemApi';
jest.mock('./personagemApi',()=>({apagarPersonagem:jest.fn(),buscarPersonagem:jest.fn(),salvarJogador:jest.fn()}));
const absoluto={id:'caio',sistema:'darkness'},espiral={id:'87654321',sistema:'espiral'};
const perfil={nome:'Ana',personagens:[absoluto,espiral],templatesPersonagem:[{id:'modelo'}]};
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();buscarPersonagem.mockResolvedValue({nome:'Caio'});salvarJogador.mockImplementation(async(c,p)=>p);});
test('exclui Absoluto e limpa vínculo, cache e pendências preservando modelos',async()=>{
 localStorage.setItem('fichaRPG_personagem_caio','{}');
 localStorage.setItem('darkness:jogador:pendentes:1234',JSON.stringify([absoluto,espiral]));
 const salvo=await excluirFichaJogador('1234',perfil,absoluto);
 expect(apagarPersonagem).toHaveBeenCalledWith('caio');
 expect(salvo.personagens).toEqual([espiral]);
 expect(salvo.templatesPersonagem).toEqual(perfil.templatesPersonagem);
 expect(localStorage.getItem('fichaRPG_personagem_caio')).toBeNull();
 expect(JSON.parse(localStorage.getItem('darkness:jogador:pendentes:1234'))).toEqual([espiral]);
});
test('exclui ESPIRAL apenas do dispositivo e remove o vínculo',async()=>{
 localStorage.setItem('espiral:sheet:v1:87654321','{}');
 const salvo=await excluirFichaJogador('1234',perfil,espiral);
 expect(apagarPersonagem).not.toHaveBeenCalled();
 expect(localStorage.getItem('espiral:sheet:v1:87654321')).toBeNull();
 expect(salvo.personagens).toEqual([absoluto]);
});
test('falha no servidor mantém o vínculo para tentar novamente',async()=>{
 apagarPersonagem.mockRejectedValueOnce(new Error('Sem conexão'));
 await expect(excluirFichaJogador('1234',perfil,absoluto)).rejects.toThrow('Sem conexão');
 expect(salvarJogador).not.toHaveBeenCalled();
});
test('nova tentativa conclui vínculo de ficha já apagada',async()=>{
 buscarPersonagem.mockResolvedValue(null);
 expect((await excluirFichaJogador('1234',perfil,absoluto)).personagens).toEqual([espiral]);
 expect(apagarPersonagem).not.toHaveBeenCalled();
});
