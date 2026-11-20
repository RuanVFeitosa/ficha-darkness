const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function searchMasterSheets(sheets, query) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return sheets.filter(ficha => {
    const sheet = ficha.personagem || ficha;
    const text = normalize([sheet.name, sheet.nome, sheet.player, sheet.jogador, sheet.nomeJogador, sheet.vertente, sheet.occupation, sheet.classe, sheet.especialidade, ficha.fichaId, ficha.espiralId].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  });
}
