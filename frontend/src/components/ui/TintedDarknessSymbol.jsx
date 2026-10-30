import React, { useId } from 'react';

export default function TintedDarknessSymbol({ cor = '#ffffff' }) {
  const id = `symbol-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hex = /^#[0-9a-f]{6}$/i.test(cor) ? cor : '#ffffff';
  return <svg className="pj-colored-symbol" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600" style={{ maskType: 'luminance' }}>
      <image href="/simbolo-darkness.png" width="600" height="600" />
    </mask></defs>
    <rect width="600" height="600" fill={hex} mask={`url(#${id})`} />
  </svg>;
}
