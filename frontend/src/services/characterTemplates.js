import { criarPersonagem } from './personagemApi';
import { validateCharacterLimit } from '../utils/playerCharacters';

export async function salvarFichaTemplate(sistema, dados, perfil) {
  validateCharacterLimit([...(perfil.personagens || []), { id: 'novo', sistema }]);
  if (sistema === 'darkness') {
    const resposta = await criarPersonagem(dados);
    if (!resposta.fichaId) throw new Error('O servidor não retornou o código da ficha.');
    return { id: String(resposta.fichaId), sistema };
  }
  if (sistema !== 'espiral') throw new Error('Sistema inválido.');
  for (let i=0;i<20;i++) {
    const bytes = new Uint32Array(1);
    window.crypto.getRandomValues(bytes);
    const id = String(10000000 + bytes[0] % 90000000);
    const chave = `espiral:sheet:v1:${id}`;
    if (localStorage.getItem(chave)) continue;
    localStorage.setItem(chave,JSON.stringify({...dados,codigoFicha:id}));
    return { id, sistema };
  }
  throw new Error('Não foi possível gerar um código livre. Tente novamente.');
}
