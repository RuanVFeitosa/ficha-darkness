import book from '../data/ordemRulebook.json';
import { classes, origins, paranormalPowers } from './ordemCreation';

const classPages = { Combatente: [25, 27], Especialista: [29, 31], Ocultista: [33, 35] };
const classTrails = {
  Combatente: ['Aniquilador', 'Comandante de Campo', 'Guerreiro', 'Operações Especiais', 'Tropa de Choque'],
  Especialista: ['Atirador de Elite', 'Infiltrador', 'Médico de Campo', 'Negociador', 'Técnico'],
  Ocultista: ['Conduíte', 'Flagelador', 'Graduado', 'Intuitivo', 'Lâmina Paranormal'],
};

function pages(first, last) {
  return book.pages.filter(page => page.printedPage >= first && page.printedPage <= last)
    .map(page => page.content.replace(new RegExp(`^${page.printedPage}\\s*`), '')).join('\n');
}

const clean = text => text.replace(/-\n-?/g, '').replace(/\s+/g, ' ').trim();

function extract(text, pattern) {
  const headings = [...text.matchAll(pattern)];
  return headings.map((heading, index) => ({
    name: heading[heading.length - 1],
    detail: clean(text.slice(heading.index + heading[0].length, headings[index + 1]?.index)),
    nex: heading.length > 2 ? Number(heading[1]) : undefined,
  }));
}

function classEntries(category, range) {
  const text = pages(...range);
  const trails = classTrails[category];
  const starts = trails.map(trail => text.indexOf(`\n${trail}\n`));
  const general = text.slice(0, starts[0]).split(/\nTRILHAS\b/)[0];
  const powers = extract(general, /^b ([^.\n]+)\./gm);
  const initial = classes[category].abilities.map(([name, detail]) => ({ name, detail, nex: 5 }));
  return [
    ...initial.map(entry => ({ ...entry, group: 'Habilidades iniciais' })),
    ...powers.map(entry => ({ ...entry, group: `Poderes de ${category}`, nex: 15 })),
    ...trails.flatMap((trail, index) => extract(text.slice(starts[index], starts[index + 1]), /^NEX (\d+)%\s*-\s*([^.\n]+)\./gm)
      .map(entry => ({ ...entry, group: trail }))),
  ].map(entry => ({ ...entry, category, tag: 'Classe' }));
}

const paranormalGroups = {
  Gerais: ['Aprender Ritual', 'Resistir a um Elemento'],
  Conhecimento: ['Expansão de Conhecimento', 'Percepção Paranormal', 'Precognição', 'Sensitivo', 'Visão do Oculto'],
  Energia: ['Afortunado', 'Campo Protetor', 'Causalidade Fortuita', 'Golpe de Sorte', 'Manipular Entropia'],
  Morte: ['Encarar a Morte', 'Escapar da Morte', 'Potencial Aprimorado', 'Potencial Reaproveitado', 'Surto Temporal'],
  Sangue: ['Anatomia Insana', 'Arma de Sangue', 'Sangue de Ferro', 'Sangue Fervente', 'Sangue Vivo'],
};
const paranormalText = pages(114, 116);
const bookNames = Object.values(paranormalGroups).flat().map(name => name === 'Resistir a um Elemento' ? 'Resistir a <Elemento>' : name);
const paranormalDetails = new Map(extract(paranormalText, new RegExp(`^(${bookNames.join('|')})\\n`, 'gm')).map(entry => [entry.name, entry.detail]));

export const powerCategories = [...Object.keys(classPages), 'Origens', 'Poderes paranormais'];
export const powerCatalog = [
  ...Object.entries(classPages).flatMap(([category, range]) => classEntries(category, range)),
  ...Object.entries(origins).map(([group, [skills, name, detail]]) => ({
    category: 'Origens', group, tag: 'Origem', name,
    detail: skills.length ? `${detail} Perícias treinadas: ${skills.join(', ')}.` : detail,
  })),
  ...Object.entries(paranormalGroups).flatMap(([group, names]) => names.map(name => ({
    category: 'Poderes paranormais', group, tag: 'Paranormal', name,
    detail: paranormalPowers[name] || paranormalDetails.get(name),
  }))),
].map(entry => ({ ...entry, catalogId: `${entry.category}:${entry.group}:${entry.name}` }));
