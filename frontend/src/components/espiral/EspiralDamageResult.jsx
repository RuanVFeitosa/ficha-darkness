import React from 'react';
import { injurySeverity } from '../../utils/espiralInjuries';

export default function EspiralDamageResult({ damage }) {
  const severity = Number(damage) >= 13 ? 'Catastrófica / Fatal' : injurySeverity(Number(damage));
  return <div className="es-damage-result">
    <h3>{severity ? `Lesão ${severity}` : 'Sem lesão'}</h3>
  </div>;
}
