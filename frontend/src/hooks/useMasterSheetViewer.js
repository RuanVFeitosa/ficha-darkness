import { useCallback, useState } from 'react';

// Um único visualizador ativo evita que o dossiê anterior cubra a ficha clicada.
export default function useMasterSheetViewer() {
  const [viewer, setViewer] = useState(null);
  const setModalFichaAberto = useCallback(open => {
    setViewer(current => {
      const next = typeof open === 'function' ? open(current?.type === 'legacy') : open;
      return next ? { type: 'legacy' } : current?.type === 'legacy' ? null : current;
    });
  }, []);
  const setFichaEspiralAberta = useCallback(value => {
    setViewer(current => {
      const sheet = typeof value === 'function' ? value(current?.type === 'modern' ? current.sheet : null) : value;
      return sheet ? { type: 'modern', sheet } : current?.type === 'modern' ? null : current;
    });
  }, []);
  return {
    modalFichaAberto: viewer?.type === 'legacy',
    fichaEspiralAberta: viewer?.type === 'modern' ? viewer.sheet : null,
    setModalFichaAberto,
    setFichaEspiralAberta,
  };
}
