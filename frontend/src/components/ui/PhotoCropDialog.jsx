import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { photoCropRect } from '../../utils/photoCrop';
import '../../styles/PhotoCropDialog.css';

export function PhotoCropDialog({ image, onFinish }) {
  const dialog = useRef(null), preview = useRef(null), drag = useRef(null);
  const [zoom, setZoom] = useState(1), [x, setX] = useState(.5), [y, setY] = useState(.5);
  const [circle, setCircle] = useState(true), [error, setError] = useState('');
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  useEffect(() => {
    const canvas = preview.current;
    const rect = photoCropRect(width, height, zoom, x, y);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, canvas.width, canvas.height);
  }, [image, width, height, zoom, x, y]);
  function apply() {
    try {
      const output = document.createElement('canvas');
      output.width = output.height = 512;
      const rect = photoCropRect(width, height, zoom, x, y);
      output.getContext('2d').drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, 512, 512);
      // The preview mask is not baked in: the same photo works in round and rectangular portraits.
      onFinish(output.toDataURL('image/png'));
    } catch { setError('Não foi possível aplicar o enquadramento. Tente outra imagem.'); }
  }
  function move(event) {
    if (!drag.current) return;
    const rect = photoCropRect(width, height, zoom, x, y);
    const scale = rect.size / preview.current.getBoundingClientRect().width;
    const dx = (event.clientX - drag.current.x) * scale;
    const dy = (event.clientY - drag.current.y) * scale;
    if (width > rect.size) setX(old => Math.max(0, Math.min(1, old - dx / (width - rect.size))));
    if (height > rect.size) setY(old => Math.max(0, Math.min(1, old - dy / (height - rect.size))));
    drag.current = { x: event.clientX, y: event.clientY };
  }
  return <dialog className="photo-crop-dialog" ref={dialog} aria-labelledby="photo-crop-title" onCancel={event => { event.preventDefault(); onFinish(null); }}>
    <header><span>IDENTIDADE / RETRATO</span><h2 id="photo-crop-title">Ajuste sua foto</h2><p>Arraste a imagem ou use os controles para escolher o enquadramento.</p></header>
    <div className={`photo-crop-preview${circle ? ' is-circle' : ''}`}>
      <canvas ref={preview} width={512} height={512} aria-label="Prévia do enquadramento" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = {x:event.clientX,y:event.clientY}; }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}/>
    </div>
    <label className="photo-crop-shape"><input type="checkbox" checked={circle} onChange={event => setCircle(event.target.checked)}/>Prévia circular</label>
    <div className="photo-crop-controls">
      <label>Zoom <output>{zoom.toFixed(1)}×</output><input autoFocus aria-label="Zoom da foto" type="range" min="1" max="5" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))}/></label>
      <label>Posição horizontal<input aria-label="Posição horizontal da foto" type="range" min="0" max="1" step="0.005" value={x} onChange={event => setX(Number(event.target.value))}/></label>
      <label>Posição vertical<input aria-label="Posição vertical da foto" type="range" min="0" max="1" step="0.005" value={y} onChange={event => setY(Number(event.target.value))}/></label>
    </div>
    {error && <p role="alert">{error}</p>}
    <footer><button type="button" onClick={() => { setZoom(1); setX(.5); setY(.5); }}>Restaurar</button><div><button type="button" onClick={() => onFinish(null)}>Cancelar</button><button className="photo-crop-apply" type="button" onClick={apply}>Usar enquadramento</button></div></footer>
  </dialog>;
}

// Shared async entry point for all portrait upload flows, independent of their page layout.
export async function ajustarEnquadramento(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Não foi possível abrir essa imagem. Escolha outra foto.'));
      image.src = url;
    });
    return await new Promise(resolve => {
      const previousFocus = document.activeElement;
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);
      let finished = false;
      root.render(<PhotoCropDialog image={image} onFinish={result => {
        if (finished) return;
        finished = true;
        // Unmount outside the React event handler.
        queueMicrotask(() => { root.unmount(); host.remove(); previousFocus?.focus(); resolve(result); });
      }}/>);
    });
  } finally { URL.revokeObjectURL(url); }
}
