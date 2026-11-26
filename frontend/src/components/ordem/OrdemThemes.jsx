import React, { useState } from 'react';
import { PRIDE_FLAGS, prideThemeColors } from '../../data/sheetThemes';
import { PrideFlag } from '../espiral/SheetThemeGallery';
import ElementSymbol from './ElementSymbol';

const customFlag = PRIDE_FLAGS.find(flag => flag.id === 'custom');
const elementThemes = [
  { key: 'sangue', name: 'Sangue', accent: '#ff8b98', outline: '#84333e', surface: '#1a090d' },
  { key: 'morte', name: 'Morte', accent: '#dedbda', outline: '#66616a', surface: '#151317' },
  { key: 'conhecimento', name: 'Conhecimento', accent: '#efd284', outline: '#80622d', surface: '#191206' },
  { key: 'energia', name: 'Energia', accent: '#d7a1ff', outline: '#745095', surface: '#170c23' },
  { key: 'medo', name: 'Medo', accent: '#e3f3ff', outline: '#6a808f', surface: '#0c171e' },
];

const elementThemeId = key => `elemento-${key}`;
const elementTexture = key => `url("/ordem-texturas/${key}.jpg")`;
const findElement = theme => elementThemes.find(item => elementThemeId(item.key) === theme?.id);
const findFlag = theme => PRIDE_FLAGS.find(item => item.id === theme?.id);

function customColors(theme) {
  return customFlag.colors.map((fallback, index) => {
    const color = theme?.colors?.[index];
    return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
  });
}

export function ordemThemeStyle(theme) {
  const element = findElement(theme);
  if (element) return {
    '--os-theme-accent': element.accent,
    '--os-theme-outline': element.outline,
    '--os-theme-surface': element.surface,
    '--os-theme-header': `linear-gradient(90deg, #000 15%, ${element.surface}cf 65%, #0009), ${elementTexture(element.key)}`,
  };
  const flag = findFlag(theme);
  if (!flag) return undefined;
  const { palette, stripes } = prideThemeColors(flag, customColors(theme));
  return {
    '--os-theme-stripes': stripes,
    '--os-theme-accent': palette.primaria,
    '--os-theme-outline': palette.borda,
    '--os-theme-surface': palette.secundaria,
    '--os-theme-page': palette.fundo,
  };
}

export function OrdemPortraitTheme({ theme }) {
  const element = findElement(theme);
  const flag = findFlag(theme);
  if (!element && !flag) return null;
  return <div className="os-seal-theme" aria-hidden="true"
    style={element ? { backgroundImage: elementTexture(element.key) } : undefined}>
    {flag && <PrideFlag flag={flag} customColors={customColors(theme)} />}
  </div>;
}

export default function OrdemThemes({ theme, onChange }) {
  const colors = customColors(theme);
  const [category, setCategory] = useState(() => findFlag(theme) ? 'pride' : 'elements');
  const activeName = findElement(theme)?.name ?? findFlag(theme)?.name ?? 'Padrão';
  return <section className="os-theme-settings" aria-labelledby="os-theme-heading">
    <div className="os-work-heading">
      <h2 id="os-theme-heading">Personalização</h2>
      <button type="button" disabled={!theme?.id} onClick={() => onChange({ ...theme, id: null })}>Restaurar padrão</button>
    </div>
    <div className="os-theme-gallery">
    <div className="os-work-heading"><h3>Temas da ficha</h3><small>Tema atual: {activeName}</small></div>
    <div className="os-nav os-theme-tabs" role="group" aria-label="Categorias de temas">
      <button type="button" aria-pressed={category === 'elements'} onClick={() => setCategory('elements')}>Elementos de Ordem Paranormal</button>
      <button type="button" aria-pressed={category === 'pride'} onClick={() => setCategory('pride')}>Temas LGBTQIA+</button>
    </div>
    {category === 'elements' ? <div className="os-theme-options os-element-theme-options">
      {elementThemes.map(element => {
        const id = elementThemeId(element.key);
        return <button type="button" key={id} aria-label={element.name} aria-pressed={theme?.id === id}
          style={{ '--os-element-preview': elementTexture(element.key), '--os-element-accent': element.accent }}
          onClick={() => onChange({ ...theme, id })}>
          <div className="os-theme-element-art"><ElementSymbol element={element.key} /></div><span>{element.name}</span>
        </button>;
      })}
    </div> : <div className="os-theme-options">
      {PRIDE_FLAGS.map(flag => <button type="button" key={flag.id}
        aria-label={flag.name} aria-pressed={theme?.id === flag.id} onClick={() => onChange({ ...theme, id: flag.id })}>
        <PrideFlag flag={flag} customColors={colors} /><span>{flag.name}</span>
      </button>)}
    </div>}
    </div>
    <div className="os-custom-theme">
      <div className="os-work-heading">
        <h3>Tema customizável</h3>
        <button type="button" aria-pressed={theme?.id === 'custom'} onClick={() => onChange({ id: 'custom', colors })}>
          Usar tema customizável
        </button>
      </div>
      <div className="os-theme-colors">
        {colors.map((color, index) => <label key={index}>Faixa {index + 1}
          <input type="color" value={color} onChange={event => {
            const next = colors.slice();
            next[index] = event.target.value;
            onChange({ id: 'custom', colors: next });
          }} />
        </label>)}
      </div>
    </div>
  </section>;
}
