import {
  mdiAccountBoxMultipleOutline, mdiBookOpenPageVariantOutline, mdiClipboardCheckOutline,
  mdiDiceMultipleOutline, mdiFilmstrip, mdiFolderOutline, mdiMapOutline,
  mdiShapeOutline, mdiStarFourPointsOutline, mdiSwordCross, mdiTagOutline,
} from '@mdi/js';

export const masterSections = [
  { id: 'campanha', label: 'Campanhas', icon: mdiMapOutline },
  { id: 'fichas', label: 'Personagens', icon: mdiAccountBoxMultipleOutline },
  { id: 'inimigos', label: 'Encontros', icon: mdiSwordCross },
  { id: 'loja', label: 'Acervo', icon: mdiFolderOutline },
  { id: 'habilidades', label: 'Habilidades', icon: mdiStarFourPointsOutline },
  { id: 'analises', label: 'Solicitações', icon: mdiClipboardCheckOutline },
  { id: 'marcas', label: 'Marcas', icon: mdiTagOutline },
  { id: 'regras', label: 'Livro de regras', icon: mdiBookOpenPageVariantOutline },
  { id: 'ordem', label: 'Ordem Paranormal', icon: mdiShapeOutline },
  { id: 'animacoes', label: 'Estúdio de Tokens', icon: mdiFilmstrip },
];

export const rollSection = { id: 'rolagens', label: 'Rolagens de campo', icon: mdiDiceMultipleOutline };
export const ordemSections = [
  ...['fichas', 'habilidades'].map(id => masterSections.find(section => section.id === id)),
  { id: 'paranormal', label: 'Paranormal', icon: mdiStarFourPointsOutline },
  ...['loja', 'inimigos', 'regras'].map(id => masterSections.find(section => section.id === id)),
];
