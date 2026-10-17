import { salvarPaletaFicha, PALETA_MONO, variaveisPaleta } from './playerAppearance';
import { buscarPersonagem, salvarPersonagem } from '../services/personagemApi';
jest.mock('../services/personagemApi',()=>({buscarPersonagem:jest.fn(),salvarPersonagem:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();});
test('paleta Absoluto usa os dados atuais da ficha sem alterar recursos',async()=>{
 buscarPersonagem.mockResolvedValue({nome:'Ana',vida:{atual:7,max:20},inventario:[{id:'item'}]});
 await salvarPaletaFicha({sistema:'darkness',id:'1234'},PALETA_MONO);
 expect(salvarPersonagem).toHaveBeenCalledWith('1234',{nome:'Ana',vida:{atual:7,max:20},inventario:[{id:'item'}],temaFicha:PALETA_MONO});
});
test('paleta ESPIRAL atualiza a ficha local preservando progresso',async()=>{
 const sheet={version:1,attributes:{pulso:3},integrity:12,evolution:{points:7}};
 localStorage.setItem('espiral:sheet:v1:1234',JSON.stringify(sheet));
 await salvarPaletaFicha({sistema:'espiral',id:'1234'},PALETA_MONO);
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:1234'))).toEqual({...sheet,temaFicha:PALETA_MONO});
 expect(salvarPersonagem).not.toHaveBeenCalled();
});
test('rejeita paleta inválida antes de alterar fichas',async()=>{
 await expect(salvarPaletaFicha({sistema:'darkness',id:'1234'},{...PALETA_MONO,texto:'invalid'})).rejects.toThrow('cor válida');
 expect(buscarPersonagem).not.toHaveBeenCalled();
 expect(variaveisPaleta({})).toEqual({});
});
