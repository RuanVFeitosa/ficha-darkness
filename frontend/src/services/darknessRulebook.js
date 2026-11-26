import original from '../data/darknessRulebook.json';
import legacyOriginal from '../data/darknessRulebookLegacy.json';
import { readLocalCampaign, writeLocalCampaign } from './localCampaignStorage';

export const RULEBOOK_KEY = 'darkness:rulebook:v1';
export const defaultRulebook = () => JSON.parse(JSON.stringify(original));
export function upgradeRulebook(saved) {
  validateRulebook(saved);
  if (saved.edition === original.edition) return saved;
  // Custom books from other sources must never be replaced by a seed upgrade.
  if (saved.source !== legacyOriginal.source) return saved;
  const byId = new Map(saved.sections.map(section => [section.id, section]));
  const legacy = new Map(legacyOriginal.sections.map(section => [section.id, section]));
  const book = defaultRulebook();
  const retainedEdits = new Set();
  book.sections = book.sections.map(section => {
    const content = section.sourceSpans.map(span => {
      const id = `pdf-page-${span.page}`;
      const old = byId.get(id);
      if (!old) return '';
      const baseline = legacy.get(id);
      if (old.content !== baseline?.content || old.title !== baseline?.title || old.chapter !== baseline?.chapter) {
        if (retainedEdits.has(id)) return '';
        retainedEdits.add(id);
        return `## ${old.title}\n\n${old.content}`;
      }
      return section.content.slice(span.start, span.end);
    }).filter(Boolean).join('\n\n');
    return { ...section, content };
  }).filter(section => section.content.trim());
  book.sections.push(...saved.sections.filter(section => !legacy.has(section.id)));
  book.legacyBackup = saved;
  return book;
}
export function validateRulebook(book) {
  if (book?.version !== 1 || !Array.isArray(book.sections)) throw new Error('O livro salvo não está em um formato válido.');
  const ids = new Set();
  for (const section of book.sections) {
    if (!section?.id || ids.has(section.id) || !section.title?.trim() || !section.chapter?.trim() || !section.content?.trim()) throw new Error('Preencha título, capítulo e conteúdo de cada seção.');
    ids.add(section.id);
  }
  return book;
}
export async function loadRulebook() {
  const saved = await readLocalCampaign(RULEBOOK_KEY);
  return saved ? upgradeRulebook(saved) : defaultRulebook();
}
export async function saveRulebook(book) {
  const updated = { ...validateRulebook(book), updatedAt: new Date().toISOString() };
  await writeLocalCampaign(RULEBOOK_KEY, updated);
  return updated;
}
export function searchRulebook(sections, query) {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return sections.filter(section => terms.every(term => normalize(`${section.title} ${section.chapter} ${section.content}`).includes(term)));
}
