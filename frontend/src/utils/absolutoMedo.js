export const CONSEQUENCIAS_MEDO = [
  {nivel:1,nome:'Apreensão',texto:'Contra a fonte do Medo, não recebe vantagens por ajuda de aliados.'},
  {nivel:3,nome:'Temor',texto:'−1 dado nos testes de Domínio contra a fonte do Medo.'},
  {nivel:4,nome:'Pavor',texto:'Não pode usar Esforço contra a fonte do Medo.'},
  {nivel:5,nome:'Pânico',texto:'Esquiva perde o bônus de +1 Defesa contra a fonte do Medo.'},
  {nivel:6,nome:'Colapso',texto:'No início do turno, escolha fugir, buscar abrigo ou proteger-se. Enfrentar o Medo custa 5 Esperança imediatamente e reduz o Medo para II.'},
];
export const efeitosMedo = (personagem, contraFonte = false) => {
  const nivel = contraFonte ? Number(personagem?.medo) || 0 : 0;
  return {semAjuda:nivel>=1,penalidadeDominio:nivel>=3?1:0,semEsforco:Number(personagem?.medo)>=4,semEsquiva:nivel>=5,colapso:nivel>=6};
};

export function enfrentarMedo(personagem) {
  if (Number(personagem.medo)<6 || Number(personagem.esperanca?.atual)<5) return personagem;
  return {...personagem,medo:2,bonusEsquivaMedo:0,esperanca:{...personagem.esperanca,atual:Number(personagem.esperanca.atual)-5}};
}

export function protegerDoMedo(personagem) {
  if (Number(personagem.medo)<6 || personagem.protecaoMedoUsada) return personagem;
  return {...personagem,medo:5,protecaoMedoUsada:true,bonusEsquivaMedo:3};
}
