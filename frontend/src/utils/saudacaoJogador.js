export const PRONOMES_JOGADOR = ['Ele', 'Ela', 'Elu'];
export function saudacaoJogador(pronome, nome = '') {
  const valor = String(pronome || '').trim().toLowerCase();
  const saudacao = ['ela', 'ela/dela', 'feminino'].includes(valor) ? 'Bem-vinda' : ['ele', 'ele/dele', 'masculino'].includes(valor) ? 'Bem-vindo' : 'Bem-vinde';
  return nome.trim() ? `${saudacao}, ${nome.trim()}` : saudacao;
}
