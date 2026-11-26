import book from '../data/ordemRulebook.json';

const page = number => book.pages.find(entry => entry.printedPage === number).content;
const weapons = [56, 57].flatMap(number => {
  const text = page(number).split('ARMAS IMPROVISADAS')[0];
  let skill = 'Luta';
  return text.split('\n').flatMap(line => {
    if (/^Corpo a Corpo/.test(line)) skill = 'Luta';
    if (/^Armas de (Disparo|Fogo)/.test(line)) skill = 'Pontaria';
    const match = /^(.+?) (0|I{1,3}|—) (\d+d\d+(?:\/\d+d\d+)?) (\S+) (\S+) (\S+) (\d+|—)$/.exec(line);
    if (!match) return [];
    const [, name, category, damage, critical, range, damageType, spaces] = match;
    return [{ name, group: 'Armas', skill, damage: damage.split('/')[0], detail: `Categoria ${category} · Dano ${damage} · Crítico ${critical} · Alcance ${range} · Tipo ${damageType} · Espaços ${spaces}` }];
  });
});

function items(text, group) {
  return [...text.matchAll(/^([^\n]+?) (0|I{1,3}) (\d+|\*)$/gm)]
    .map(([, name, category, spaces]) => ({ name, group, detail: `Categoria ${category} · Espaços ${spaces === '*' ? 'especiais' : spaces}` }));
}

const general = page(63).split('Nome Categoria espaços')[1].replace('Equipamento\nde sobrevivência', 'Equipamento de sobrevivência');
const paranormal = page(67).split('Nome Categoria espaços')[1].split('ScannerScanner')[0]
  .replace(/Componentes\n|Emissor de\n|Medidor de\n|Scanner de manifestação\n/g, match => match.replace('\n', ' '));
const protections = [['Proteção leve', '+5', 'I', 2], ['Proteção pesada', '+10', 'II', 5], ['Escudo', '+2', 'I', 2]]
  .map(([name, defense, category, spaces]) => ({ name, group: 'Proteções', detail: `Defesa ${defense} · Categoria ${category} · Espaços ${spaces}` }));

export const equipmentCatalog = [
  ...weapons, ...protections,
  ...items(page(59).split('TABELA 3.4: MUNIÇÕES')[1], 'Munições'),
  ...items(general, 'Equipamentos'),
  ...items(paranormal, 'Itens paranormais'),
];
