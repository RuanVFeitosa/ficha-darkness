import React from 'react';
import Icon from '@mdi/react';
import { mdiFilterOffOutline, mdiShapeOutline } from '@mdi/js';
import ElementSymbol from './ElementSymbol';
import '../../styles/ParanormalFilters.css';

export const paranormalElements = {
  sangue: 'Sangue', morte: 'Morte', conhecimento: 'Conhecimento', energia: 'Energia', medo: 'Medo',
};
export const ritualCircleLabels = ['I', 'II', 'III', 'IV'];

export default function ParanormalFilters({ options = Object.values(paranormalElements), element, onElementChange, circle, onCircleChange }) {
  return <div className="ordem-element-filters">
    <div role="group" aria-label="Filtrar por elemento">
      {[...Object.values(paranormalElements), 'Gerais'].filter(name => options.includes(name)).map(name =>
        <button type="button" key={name} title={name} aria-label={name} aria-pressed={element === name}
          onClick={() => onElementChange(element === name ? '' : name)}>
          {name === 'Gerais' ? <Icon path={mdiShapeOutline} size={0.9} /> : <ElementSymbol element={name} />}
        </button>,
      )}
    </div>
    {onCircleChange && <div role="group" aria-label="Filtrar por círculo">
      {ritualCircleLabels.map((roman, index) => <button key={roman} type="button" aria-label={`Círculo ${roman}`} title={`Círculo ${roman}`}
        aria-pressed={circle === index + 1} onClick={() => onCircleChange(circle === index + 1 ? null : index + 1)}>{roman}</button>)}
    </div>}
    <button type="button" title="Limpar filtros" aria-label="Limpar filtros" disabled={!element && !circle} onClick={() => {
      onElementChange('');
      onCircleChange?.(null);
    }}><Icon path={mdiFilterOffOutline} size={0.8} /></button>
  </div>;
}
