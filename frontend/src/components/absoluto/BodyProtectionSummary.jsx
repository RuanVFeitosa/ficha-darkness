import React from 'react';
import {REGIOES} from '../../data/absolutoV1';
import {protecaoRegional} from '../../utils/absolutoProtecao';
import './BodyProtectionSummary.css';

const shapes={
 cabeca:<><ellipse cx="16" cy="11" rx="7" ry="9"/><path d="M11 19v5h10v-5"/></>,
 pescoco:<path d="M10 4v9l-5 6v9h22v-9l-5-6V4M10 13h12"/>,
 torso:<path d="m10 3 6 4 6-4 7 7-5 8-2 11H10L8 18l-5-8Z M16 8v18"/>,
 abdomen:<path d="M7 4h18l-2 10 4 12-11 4-11-4 4-12ZM10 14h12M16 5v22"/>,
 bracoDireito:<path d="m20 3-7 3-5 11-3 10 5 3 6-11 4-6 7-5Z"/>,
 bracoEsquerdo:<path d="m12 3 7 3 5 11 3 10-5 3-6-11-4-6-7-5Z"/>,
 pernaDireita:<path d="M12 2h12l-4 13-3 10 1 5H5l1-5 5-12Z"/>,
 pernaEsquerda:<path d="M8 2h12l1 11 5 12 1 5H14l1-5-3-10Z"/>,
};
export default function BodyProtectionSummary({members={},defensesFor=()=>[]}) {
 const regions=Object.entries(REGIOES).map(([key,region])=>({key,name:region.nome,...protecaoRegional(members[key],defensesFor(key))})).filter(r=>r.total>0);
 if(!regions.length) return null;
 return <section className="abs-region-protection" aria-label="Defesa Total por região"><span>PROTEÇÃO REGIONAL</span><div>{regions.map(r=><div className="abs-region-protection-value" key={r.key} role="img" aria-label={`${r.name}: ${r.total} de Defesa Total`} title={`${r.name}: ${r.equipamento} por equipamento + ${r.adicionais} adicionais`}><svg viewBox="0 0 32 32" aria-hidden="true">{shapes[r.key]}</svg><strong>{r.total}</strong></div>)}</div></section>;
}
