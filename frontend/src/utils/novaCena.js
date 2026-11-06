export function resetarEfeitosCena(personagem, marco) {
  return {...personagem,medo:0,rupturaNaCena:false,esperancaNaCena:false,
    protecaoMedoUsada:false,bonusEsquivaMedo:0,ultimaNovaCena:marco};
}
