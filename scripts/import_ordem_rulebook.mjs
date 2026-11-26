import { readFile, writeFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Uso: node scripts/import_ordem_rulebook.mjs <PDF v1.3>');

const task = getDocument({ data: new Uint8Array(await readFile(sourcePath)), useSystemFonts: true });
try {
  const pdf = await task.promise;
  const outline = await pdf.getOutline();
  if (pdf.numPages !== 332 || !outline?.[0]?.items.some(item => item.title.includes('(v1.3)'))) {
    throw new Error('Selecione o livro de regras Ordem Paranormal RPG v1.3.');
  }

  async function readBookmark({ dest, title, items }, depth = 0) {
    const destination = typeof dest === 'string' ? await pdf.getDestination(dest) : dest;
    if (!destination) return [];
    const page = 1 + await pdf.getPageIndex(destination[0]);
    const children = [];
    for (const item of items) children.push(...await readBookmark(item, depth + 1));
    return [{ page, title: title.trim(), depth }, ...children];
  }

  const bookmarks = [];
  for (const item of outline) {
    if (item.title === 'Ficha de Personagem') break;
    bookmarks.push(...await readBookmark(item));
  }

  const chapters = bookmarks.filter(mark => mark.depth === 0);
  const example = await pdf.getPage(65);
  const exampleItems = (await example.getTextContent()).items;
  const dieFont = exampleItems.find((item, index) => item.str === 'O' && exampleItems[index - 1]?.str.endsWith('sofre –'))?.fontName;
  if (!dieFont) throw new Error('Não foi possível identificar o símbolo de dado da edição v1.3.');

  const pages = [];
  for (let number = 1; number <= 328; number++) {
    const page = await pdf.getPage(number);
    const { items } = await page.getTextContent();
    const lines = items.map((item, index) => {
      const previous = items[index - 1];
      const hasQuantity = item.str === 'O' && previous && !previous.hasEOL && /\d$/.test(previous.str);
      const text = item.fontName === dieFont && /^O+$/.test(item.str) ? `${hasQuantity ? '' : item.str.length}d20` : item.str;
      return text + (item.hasEOL ? '\n' : '');
    }).join('').split('\n');
    const printedPage = number >= 11 ? number - 10 : null;
    if (lines[0]?.trim() === String(printedPage)) lines.shift();
    const content = lines.join('\n').trim();
    const topics = [...new Set(bookmarks.filter(mark => mark.page === number && mark.depth > 0).map(mark => mark.title))];
    if (content || topics.length) pages.push({ number, printedPage, topics, content });
    page.cleanup();
  }

  const output = new URL('../frontend/src/data/ordemRulebook.json', import.meta.url);
  await writeFile(output, JSON.stringify({ chapters, pages }, null, 2) + '\n');
  console.log(`${chapters.length} capítulos e ${pages.length} páginas indexadas.`);
} finally {
  await task.destroy();
}
