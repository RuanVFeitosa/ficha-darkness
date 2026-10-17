import { paginaJogadorDaFicha } from './jogadorApi';
import { buscarJogador } from './personagemApi';
jest.mock('./personagemApi',()=>({buscarJogador:jest.fn()}));
beforeEach(()=>{localStorage.clear();sessionStorage.clear();jest.clearAllMocks();});
test('ignora sessão de outra ficha e usa o código da ficha atual',async()=>{sessionStorage.setItem('darkness:jogador','121212');buscarJogador.mockResolvedValue({personagens:[{id:'1234',sistema:'darkness'}]});expect(await paginaJogadorDaFicha('11111111','darkness')).toBe('/?jogador=11111111');});
test('preserva perfil com código diferente quando há vínculo confirmado',async()=>{sessionStorage.setItem('darkness:jogador','121212');buscarJogador.mockResolvedValue({personagens:[{id:'12345678',sistema:'espiral'}]});expect(await paginaJogadorDaFicha('12345678','espiral')).toBe('/?jogador=121212');});
test('não confunde fichas de sistemas diferentes com mesmo código',async()=>{sessionStorage.setItem('darkness:jogador','121212');buscarJogador.mockResolvedValue({personagens:[{id:'12345678',sistema:'darkness'}]});expect(await paginaJogadorDaFicha('12345678','espiral')).toBe('/?jogador=12345678');});
test('acesso direto sem sessão continua disponível',async()=>{expect(await paginaJogadorDaFicha('12345678','espiral')).toBe('/?jogador=12345678');});
test('recupera vínculo conhecido em outra aba e confirma antes de usar',async()=>{localStorage.setItem('darkness:ficha-jogador:espiral:12345678','4444');buscarJogador.mockResolvedValue({personagens:[{id:'12345678',sistema:'espiral'}]});expect(await paginaJogadorDaFicha('12345678','espiral')).toBe('/?jogador=4444');});
