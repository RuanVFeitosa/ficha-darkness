import React, { lazy, Suspense, useState } from 'react';
import Icon from '@mdi/react';
import { mdiArrowTopRight, mdiMapOutline } from '@mdi/js';
import { ordemSections } from '../constants/masterSections';
import MasterSystemTabs from '../components/mestre/MasterSystemTabs';
import MasterSystemPanel from '../components/mestre/MasterSystemPanel';

const FerramentasOrdem = lazy(() => import('../components/mestre/OrdemMasterTools'));
const CampanhaDashboard = lazy(() => import('../components/campanha/CampanhaDashboard'));
const campanha = { id: 'campanha', label: 'Campanhas', icon: mdiMapOutline };
const arte = { '--ordem-master-sigil': 'url("/ordem-dashboard-fundo.png")' };

export default function PainelMestreOrdem({ usuario, onSair, children }) {
  const proprietario = usuario.papel === 'proprietario';
  const [area, setArea] = useState(proprietario ? 'inimigos' : 'campanha');
  const areas = [campanha, ...ordemSections.filter(item => proprietario || item.id !== 'fichas')];

  return <MasterSystemPanel theme="ordem-master" style={arte} usuario={usuario} onSair={onSair}
    seletor={children || <MasterSystemTabs sistema="ordem" />} navLabel="Ferramentas de Ordem Paranormal"
    areas={areas} area={area} onAreaChange={setArea}
    action={proprietario && <a href="/?ordem=1&criar=1">Criar ficha de Ordem <Icon path={mdiArrowTopRight} size={0.8} /></a>}>
    <Suspense fallback={<p role="status">Abrindo ferramentas de Ordem…</p>}>
      {area === 'campanha'
        ? <CampanhaDashboard mestreId={proprietario ? undefined : usuario.id} sistemaPainel="ordem" permite3D={proprietario} />
        : <FerramentasOrdem abaIntegrada={area} podeEditarImagem={proprietario} />}
    </Suspense>
  </MasterSystemPanel>;
}
