import { apagarPersonagem, buscarPersonagem, salvarJogador } from './personagemApi';
import { fichaKey } from './jogadorApi';

export async function excluirFichaJogador(codigo, perfil, ficha) {
  const chave = fichaKey(ficha);
  if (ficha.demo || !perfil.personagens.some(p => fichaKey(p) === chave)) throw new Error('Essa ficha não pertence ao perfil.');
  if (!['darkness','espiral'].includes(ficha.sistema)) throw new Error('Sistema inválido.');
  if (ficha.sistema === 'darkness') {
    // Uma segunda tentativa pode ocorrer depois da exclusão, se o vínculo falhar.
    if (await buscarPersonagem(ficha.id)) await apagarPersonagem(ficha.id);
  }
  let salvo;
  try {
    salvo = await salvarJogador(codigo, {...perfil,personagens:perfil.personagens.filter(p => fichaKey(p) !== chave)});
  } catch (error) {
    if (ficha.sistema === 'darkness') throw new Error('Não foi possível atualizar o perfil. Tente excluir novamente para concluir a remoção do vínculo.');
    throw error;
  }
  if (ficha.sistema === 'espiral') localStorage.removeItem(`espiral:sheet:v1:${ficha.id}`);
  else localStorage.removeItem(`fichaRPG_personagem_${ficha.id}`);
  localStorage.removeItem(`darkness:ficha-jogador:${chave}`);
  const pendentesKey = `darkness:jogador:pendentes:${codigo}`;
  try {
    const pendentes = JSON.parse(localStorage.getItem(pendentesKey) || '[]');
    localStorage.setItem(pendentesKey,JSON.stringify(pendentes.filter(p => fichaKey(p) !== chave)));
  } catch { /* Um cache inválido não deve restaurar o vínculo excluído. */ localStorage.removeItem(pendentesKey); }
  return salvo;
}
