import React from 'react';
import '../../styles/HaloEclipse.css';

// Geometria fixa mantém o halo estável durante a digitação.
const RAIOS_ECLIPSE = Array.from({ length: 360 }, (_, i) => {
  const ruido = (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
  const tamanho = 8 + Math.abs(ruido) * 55 + 12 * Math.sin(i * .13) ** 2;
  return { angulo: i, tamanho, opacidade: .25 + Math.abs(ruido) * .65 };
});
export default function HaloEclipse() {
  return <svg className="login-eclipse" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
    <circle className="login-eclipse-aura" cx="300" cy="300" r="188" />
    <g className="login-eclipse-raios">
      {RAIOS_ECLIPSE.map(({ angulo, tamanho, opacidade }) => <g key={angulo} transform={`rotate(${angulo} 300 300)`} opacity={opacidade}>
        <path d={`M 300 116 v -${tamanho}`} strokeWidth={angulo % 3 === 0 ? 1.6 : .7} />
        {angulo % 3 === 0 && <path d={`M 300 ${101 - tamanho} v -${2 + tamanho * .12}`} strokeWidth="1.2" />}
        {angulo % 7 === 0 && <circle cx="300" cy={68 - tamanho} r=".9" fill="currentColor" stroke="none" />}
      </g>)}
    </g>
    <circle className="login-eclipse-borda" cx="300" cy="300" r="184" />
  </svg>;
}
