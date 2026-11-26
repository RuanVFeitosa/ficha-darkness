import React, { lazy, Suspense, useState } from 'react';
import MasterSystemPanel from '../components/mestre/MasterSystemPanel';
import CampanhaDashboard from '../components/campanha/CampanhaDashboard';
import MasterSystemTabs, { masterSystems } from '../components/mestre/MasterSystemTabs';
import { masterSections } from '../constants/masterSections';
import PainelMestreOrdem from './PainelMestreOrdem';
import '../styles/PainelMestreIndividual.css';

const DarknessEquipment = lazy(() => import('../components/mestre/DarknessEquipment'));
const DarknessAbilities = lazy(() => import('../components/mestre/DarknessAbilities'));
const DarknessRulebook = lazy(() => import('../components/mestre/DarknessRulebook'));
const DarknessEncounters = lazy(() => import('../components/espiral/DarknessEncounters'));
const arte = { '--darkness-master-sigil': 'url("/simbolo-darkness.png")' };
const areas = masterSections.filter(({ id }) => ['campanha', 'fichas', 'inimigos', 'loja', 'habilidades', 'regras'].includes(id));

export default function PainelMestreIndividual({ usuario, onSair }) {
  const preferenceKey = `darkness:painel:mestre:sistema:${usuario.id}`;
  const [sistema, setSistema] = useState(() => {
    const saved = localStorage.getItem(preferenceKey);
    return masterSystems.some(item => item.id === saved) ? saved : 'absoluto';
  });
  const [area, setArea] = useState('campanha');

  function trocarSistema(next) {
    setSistema(next);
    localStorage.setItem(preferenceKey, next);
  }

  const seletor = <MasterSystemTabs sistema={sistema} onChange={trocarSistema} />;

  if (sistema === 'ordem') return <PainelMestreOrdem usuario={usuario} onSair={onSair}>{seletor}</PainelMestreOrdem>;

  return <MasterSystemPanel theme="personal-master" style={arte} usuario={usuario} onSair={onSair}
    seletor={seletor} navLabel="Ferramentas de Darkness" areas={areas} area={area} onAreaChange={setArea}>
    <Suspense fallback={<p role="status">Abrindo ferramentas de Darkness…</p>}>
      {area === 'campanha' && <CampanhaDashboard mestreId={usuario.id} sistemaPainel="absoluto" permite3D={false} />}
      {area === 'fichas' && <section className="personal-master-empty">
        <h2>Personagens</h2>
        <p>Abra seu perfil de jogador para consultar suas fichas e participar de outras mesas.</p>
        <a href="/?mestre=1&personagens=1">Abrir meus personagens</a>
      </section>}
      {area === 'inimigos' && <DarknessEncounters storageKey={`darkness:encontros:mestre:${usuario.id}`} />}
      {area === 'loja' && <DarknessEquipment readOnly />}
      {area === 'habilidades' && <DarknessAbilities readOnly />}
      {area === 'regras' && <DarknessRulebook readOnly />}
    </Suspense>
  </MasterSystemPanel>;
}
