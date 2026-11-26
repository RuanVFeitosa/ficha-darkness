import book from '../data/ordemRulebook.json';

const pages = new Map(book.pages.filter(page => page.printedPage).map(page => [page.printedPage, page.content]));
const at = page => pages.get(page) || '';

const creatureIndex = [
  ['Sangue', [[182,'Aberração de Carne'],[186,'Aniquilação'],[188,'Carente'],[190,'Dama de Sangue'],[193,'Enpap-X'],[194,'Kerberos'],[197,'Minotauro'],[199,'Mulher Afogada'],[201,'Titã de Sangue'],[202,'Zumbi de Sangue'],[203,'Zumbi de Sangue Bestial'],[206,'O Diabo',207]]],
  ['Morte', [[209,'Aracnasita'],[211,'Carniçal Preto da Morte'],[213,'Ceifador Espiral'],[214,'Enraizado'],[216,'Escutado'],[217,'Esqueleto de Lodo'],[219,'Marionete'],[221,'Múmia Xipófaga'],[224,'Nidere'],[226,'Sempiternal'],[227,'Succ'],[230,'O Deus da Morte',231]]],
  ['Conhecimento', [[234,'Anjo'],[237,'Bicho-Papão'],[238,'Espreitador'],[241,'Estrangeiro'],[242,'Existido'],[243,'Lembrado'],[244,'Ocioso'],[246,'Parasita de Culpa'],[248,'Rastejador Sombrio'],[250,'Silhueta'],[251,'Vulto'],[254,'Máscara do Desespero',255]]],
  ['Energia', [[257,'Anárquico'],[259,'Anárquico Descontrolado'],[261,'Anomalia'],[263,'Anomiático'],[265,'Ciborgue'],[267,'Infecticídio'],[268,'Perturbado de Energia'],[269,'Sukkalgir'],[271,'Telopsia'],[273,'Tempestuoso'],[274,'Viajante'],[278,'Anfitrião',279]]],
  ['Medo', [[282,'Degolificada',283]]],
];

function clean(text) {
  return text.replace(/-\n(?=\p{Ll})/gu, '')
    .replace(/\uF071/g, ' quadrados').replace(/[\uE000-\uF8FF]/g, ' · ')
    .replace(/[ \t]+/g, ' ').trim();
}

const inline = text => clean(text).replace(/\s*\n\s*/g, ' ');

const labels = [
  'PRESENÇA PERTURBADORA', 'SENTIDOS', 'DEFESA', 'PONTOS DE VIDA',
  'IMUNIDADES', 'RESISTÊNCIAS', 'VULNERABILIDADES', 'ATRIBUTOS',
  'PERÍCIAS', 'DESLOCAMENTO', 'AÇÕES',
];

const attributePattern = /AGI\s*([-–—]|\d+)\s+FOR\s*([-–—]|\d+)\s+INT\s*([-–—]|\d+)\s+PRE\s*([-–—]|\d+)\s+VIG\s*([-–—]|\d+)/;

function parseBlock(text) {
  const starts = [...text.matchAll(new RegExp(`^(?:(${labels.join('|')})(?![\\p{L}])|(?=AGI\\s+[–—\\d]))`, 'gmu'))];
  const stats = [];
  let attributes = [];
  let actions = '';
  const effects = [];
  starts.forEach((match, index) => {
    const label = match[1] || 'ATRIBUTOS';
    const start = match.index + match[0].length;
    const raw = text.slice(start, starts[index + 1]?.index);
    if (label === 'ATRIBUTOS') {
      const values = raw.match(attributePattern);
      if (values) attributes = values.slice(1).map((value, i) => [ ['AGI','FOR','INT','PRE','VIG'][i], value ]);
    } else if (label === 'AÇÕES') {
      actions = raw.trim();
    } else if (raw.trim()) {
      const extras = label === 'DESLOCAMENTO' ? raw.match(/\n(?=[\p{Lu}\d][\p{Lu}\d –-]+(?:\n| [\p{Lu}][\p{Ll}]))/u) : null;
      if (extras) effects.push({ name: 'Efeitos passivos', text: clean(raw.slice(extras.index)) });
      stats.push([label, clean(extras ? raw.slice(0, extras.index) : raw)]);
    }
  });
  const headings = [...actions.matchAll(/^(PADRÃO|REAÇÃO|LIVRE|MOVIMENTO|COMPLETA|ESPECIAL)\s+[\uE000-\uF8FF]+\s*([^\n]*)|^(ENIGMA\s+(?:DE MEDO|DE\nMEDO)|MECÂNICA ESPECIAL[^\n]*)/gm)];
  const abilities = headings.map((match, index) => ({
    type: match[1] || '',
    name: inline(match[2] || match[3]),
    text: clean(actions.slice(match.index + match[0].length, headings[index + 1]?.index)),
  }));
  const opening = clean(actions.slice(0, headings[0]?.index));
  if (opening) abilities.unshift({ name: 'Ações e efeitos', text: opening });
  return { stats, attributes, abilities: [...effects, ...abilities] };
}

function creature(element, [page, name, next]) {
  const content = at(page);
  const start = content.indexOf('PRESENÇA PERTURBADORA');
  const header = content.slice(0, start);
  const vd = name === 'Anfitrião' ? null : content.match(/\bVD\s*(\d+)/)?.[1];
  const size = header.match(/(?:CRIATURA|RELÍQUIA)\s*[\uE000-\uF8FF]\s*(MINÚSCULO|PEQUENO|MÉDIO|GRANDE|ENORME|COLOSSAL)\s*$/)?.[1];
  const type = /RELÍQUIA/.test(header.slice(-65)) || ['O Diabo', 'Anfitrião'].includes(name) ? 'Relíquia' : 'Criatura';
  const source = content.slice(start).replace(/\bVD\s*\d+(?=[A-ZÀ-Ú\s]|$)/, '').replace(/^[ \t]+(?=AÇÕES)/gm, '');
  const early = header.indexOf('AÇÕES');
  const statHeader = header.toUpperCase().lastIndexOf(name.toUpperCase());
  const earlyActions = early >= 0 ? header.slice(early, statHeader > early ? statHeader : header.lastIndexOf('\n', header.length - 2)) : '';
  const extraEnigma = name === 'Nidere' ? at(222).slice(at(222).indexOf('ENIGMA DE MEDO'))
    : name === 'Degolificada' ? header.slice(header.indexOf('ENIGMA DE MEDO')) : '';
  const body = [source, earlyActions, extraEnigma, next ? at(next).replace(/^\d{3}(?=ENIGMA)/, '') : ''].join('\n').replace(/^\d{3}\s*$/gm, '');
  return { id: `criatura-${page}`, name, group: 'Criaturas', element, vd, type, size, page, ...parseBlock(body) };
}

const mundaneSource = [284, 285, 286, 287, 288, 289].map(page => '\n\0' + page + '\n' + at(page)).join('\n');
const mundaneHeaders = [...mundaneSource.matchAll(/^([\p{Lu}\d &’'()–-]+(?:\n[\p{Lu}\d &’'()–-]+)?) VD\s*(\d+)/gmu)];

const mundane = mundaneHeaders.map((hit, index) => {
  const page = Number([...mundaneSource.slice(0, hit.index).matchAll(/\0(\d+)/g)].at(-1)?.[1]);
  const name = inline(hit[1].replace(/^ANIMAIS\n/, ''));
  const text = mundaneSource.slice(hit.index + hit[0].length, mundaneHeaders[index + 1]?.index).replace(/^\0\d+\n/gm, '');
  const start = text.indexOf('SENTIDOS');
  const description = text.slice(0, start).trim();
  const type = description.match(/^(PESSOA|ANIMAL).*$/m)?.[0];
  const body = text.slice(start).replace(/\n(?:CULTISTAS|POLICIAIS|ANIMAIS)\n[\s\S]*$/, '');
  return { id: `mundana-${index}`, name, group: 'Ameaças da Realidade', vd: hit[2], type: type ? inline(type) : 'Mundana', page, ...parseBlock(body) };
});

const hazardPages = [290, 291, 292, 293];
const hazardSource = hazardPages.map(page => '\n\0' + page + '\n' + at(page)).join('\n');
const hazardHeadings = [...hazardSource.matchAll(/^(ÁCIDO|ARMADILHAS|CLIMA,\s*CALOR E FRIO|DOENÇAS|ELETRICIDADE|FOGO|FOME E SEDE|FUMAÇA|LAVA|QUEDA|SONO|SUFOCAMENTO|VENENOS)\s*$/gm)];
const hazards = hazardHeadings.map((match, index) => {
  const page = Number([...hazardSource.slice(0, match.index).matchAll(/\0(\d+)/g)].at(-1)?.[1]);
  const text = hazardSource.slice(match.index + match[0].length, hazardHeadings[index + 1]?.index).replace(/^\0\d+\n/gm, '');
  return { id: `perigo-${index}`, name: inline(match[1]), group: 'Perigos mundanos', type: 'Perigo', page, text: clean(text) };
});
const remainingHazardTable = hazards.find(item => item.name === 'FOGO').text.split('Fonte Dano exemplos');
if (remainingHazardTable[1]) {
  hazards.find(item => item.name === 'FOGO').text = remainingHazardTable[0].trim();
  hazards.find(item => item.name === 'ELETRICIDADE').text += '\n\nFonte · Dano · Exemplos\n' + remainingHazardTable[1].trim();
}

export const ordemThreats = [
  ...creatureIndex.flatMap(([element, entries]) => entries.map(entry => creature(element, entry))),
  ...mundane,
  ...hazards,
];
