export function resetarEfeitosCena(personagem, marco) {
  const usosCena={...personagem.usosPassivas,...personagem.usosEspecialidades};
  return {...personagem,medo:0,rupturaNaCena:false,esperancaNaCena:false,
    protecaoMedoUsada:false,bonusEsquivaMedo:0,ultimaNovaCena:marco,
    ...(Object.values(usosCena).includes('cena') ? {
      usosHabilidades:Object.fromEntries(Object.entries(personagem.usosHabilidades||{}).filter(([id])=>usosCena[id]!=='cena')),
      usosPassivas:Object.fromEntries(Object.entries(personagem.usosPassivas||{}).filter(([,limite])=>limite!=='cena')),
      usosEspecialidades:Object.fromEntries(Object.entries(personagem.usosEspecialidades||{}).filter(([,limite])=>limite!=='cena')),
    } : {})};
}
