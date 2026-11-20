import React, { useEffect, useState } from 'react';
import { buscarFichaEspiral } from '../../services/espiralApi';
import { hasEspiralToken, readEspiralTabletopSheet } from '../../utils/espiralTabletop';

export default function TabletopSheetGate({ id, enabled, children, missing }) {
  const [state, setState] = useState({ id: null, sheet: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const local = readEspiralTabletopSheet(id);
    if (hasEspiralToken(local)) {
      setState({ id, sheet: local, loading: false, error: '' });
      return;
    }
    setState({ id, sheet: null, loading: true, error: '' });
    buscarFichaEspiral(id).then(sheet => {
      if (active) setState({ id, sheet, loading: false, error: '' });
    }).catch(() => {
      if (active) setState({ id, sheet: null, loading: false, error: 'Não foi possível carregar a ficha do servidor. Tente novamente para entrar no tabletop.' });
    });
    return () => { active = false; };
  }, [id, enabled, retry]);
  if (!enabled) return children(null);
  if (state.id !== id || state.loading) return <div className="tabletop-sheet-loading" role="status" style={{ background: '#000', color: '#fff', padding: 40 }}>Carregando ficha e token para o tabletop…</div>;
  if (state.error) return <section style={{ background: '#000', color: '#fff', padding: 40 }}><p role="alert">{state.error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></section>;
  if (!hasEspiralToken(state.sheet)) return missing;
  // Keep the confirmed server copy in memory: entering must not require localStorage space.
  return children(state.sheet);
}
