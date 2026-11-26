import React from 'react';

const elements = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
  medo: 'Medo',
};

export default function ElementSymbol({ element }) {
  const key = element?.toLowerCase();
  if (!Object.hasOwn(elements, key)) return null;
  return <span className="os-element-symbol" data-sigil={key} role="img" aria-label={elements[key]}
    style={{ '--os-element-image': `url("/ordem-elementos/${key}.png")` }} />;
}
