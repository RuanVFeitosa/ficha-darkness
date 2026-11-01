import React,{useState} from 'react';
import {REGIOES} from '../../data/absolutoV1';
import NumberInput from '../ui/NumberInput';
import '../../styles/AbsolutoBody.css';

const anatomy={
 cabeca:{path:'M277 41 Q300 28 323 41 L331 67 326 96 314 111 286 111 274 96 269 67Z',anchor:[324,70],label:[442,57]},
 pescoco:{path:'M286 117H314L318 140 300 149 282 140Z',anchor:[284,128],label:[18,115]},
 torso:{path:'M279 146 300 156 321 146 348 154 359 180 340 260 320 277H280L260 260 241 180 252 154Z',anchor:[343,207],label:[442,205]},
 abdomen:{path:'M263 272 279 284H321L337 272 332 324 345 362 326 387H274L255 362 268 324Z',anchor:[268,322],label:[18,310]},
 bracoDireito:{path:'M245 154 230 159 212 190 197 247 191 286 180 323 188 351 204 348 216 322 220 284 232 248 240 211 255 184Z',anchor:[207,239],label:[18,218]},
 bracoEsquerdo:{path:'M355 154 370 159 388 190 403 247 409 286 420 323 412 351 396 348 384 322 380 284 368 248 360 211 345 184Z',anchor:[399,307],label:[442,337]},
 pernaDireita:{path:'M270 393H297L295 472 284 543 282 608 275 677 278 699 259 716H235L239 696 250 673 250 604 246 541 250 471 253 418Z',anchor:[252,541],label:[18,532]},
 pernaEsquerda:{path:'M303 393H330L347 418 350 471 354 541 350 604 350 673 361 696 365 716H341L322 699 325 677 318 608 316 543 305 472Z',anchor:[348,609],label:[442,599]},
};
export function bodyRegionState(member){
 const ratio=Number(member?.max)>0 ? Number(member?.atual)/Number(member.max) : 0;
 return ratio<=0 ? {key:'nonfunctional',label:'Não Funcional'} : ratio<=.1 ? {key:'critical',label:'Crítico'} : ratio<=.5 ? {key:'injured',label:'Machucado'} : {key:'stable',label:'Estável'};
}
export default function AbsolutoBody({members,onChange,onMaxChange,onDamage,onDefenseChange,defensesFor=()=>[],onInspectDefense}){
 const [selected,setSelected]=useState('torso');const [amount,setAmount]=useState(1);
 const member=members[selected] || {atual:0,max:1,defesa:0},region=REGIOES[selected],status=bodyRegionState(member);
 const defenses=defensesFor(selected);
 return <section className="abs-body" aria-label="Integridade regional do Absoluto">
  <header className="abs-body-heading"><div><span>ANATOMIA / ABSOLUTO</span><h3>O corpo guarda as marcas.</h3><p>Selecione uma região para cuidar da sua Integridade.</p></div><strong>{Object.values(members).filter(item=>item.atual>0).length}<small>/ 8 funcionais</small></strong></header>
  <div className="abs-body-workspace">
   <div className="abs-body-figure">
    <svg viewBox="0 0 600 760" aria-label="Mapa corporal de Integridade">
     <g className="abs-body-guides" aria-hidden="true"><circle cx="300" cy="280" r="208"/><circle cx="300" cy="280" r="190"/><path d="M300 10V742M170 140H430M145 390H455M210 722H390"/><path d="M290 20H310M290 735H310"/></g>
     {Object.entries(anatomy).map(([key,shape],index)=>{
      const current=members[key] || {atual:0,max:0},state=bodyRegionState(current);const [x,y]=shape.label;const right=x>300;
      return <g key={key} role="button" tabIndex="0" aria-pressed={key===selected} aria-label={`${REGIOES[key].nome}: ${current.atual} de ${current.max}, ${state.label}`} className={`abs-body-region is-${state.key}${key===selected ? ' is-selected' : ''}`} onClick={()=>setSelected(key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(key);}}}>
       <title>{REGIOES[key].nome} · {current.atual}/{current.max} · {state.label}</title>
       <path className="abs-body-shape" d={shape.path}/>
       <path className="abs-body-leader" d={`M${shape.anchor[0]} ${shape.anchor[1]}H${right ? 421 : 176}L${right ? x-8 : x+143} ${y+17}`}/>
       <circle className="abs-body-pin" cx={shape.anchor[0]} cy={shape.anchor[1]} r="3"/>
       <g className="abs-body-readout" transform={`translate(${x},${y})`}><rect x="-8" y="-10" width="150" height="65" rx="4"/><text className="abs-body-region-name" y="3">{String(index+1).padStart(2,'0')} / {REGIOES[key].nome}</text><text className="abs-body-region-value" y="31">{current.atual}<tspan> / {current.max}</tspan></text><text className="abs-body-region-status" y="47">{state.label}</text></g>
      </g>;
     })}
     <g className="abs-body-seams" aria-hidden="true"><path d="M300 166V266M267 194 289 203M333 194 311 203M274 313H326M275 336H325M205 265 220 270M380 270 395 265M252 552H280M320 552H348"/></g>
    </svg>
    <div className="abs-body-legend">{['stable','injured','critical','nonfunctional'].map((key,i)=><span key={key} className={`is-${key}`}><i/>{['Estável','Machucado','Crítico','Não Funcional'][i]}</span>)}</div>
   </div>
   <div className={`abs-body-detail is-${status.key}`}>
    <span className="abs-body-kicker">REGIÃO SELECIONADA</span><h4>{region.nome}</h4><span className="abs-body-state"><i/>{status.label}</span>
    <div className="abs-body-integrity"><label>Integridade atual<NumberInput aria-label={`Integridade atual de ${region.nome}`} min="0" max={member.max} value={member.atual} onChange={event=>onChange(selected,event.target.value)}/></label><span>/</span><label>Máxima<NumberInput aria-label={`Integridade máxima de ${region.nome}`} min="1" value={member.max} onChange={event=>onMaxChange(selected,event.target.value)}/></label></div>
    <div className="abs-body-adjustments" aria-label="Ajuste direto de Integridade">{[-10,-5,-1,1,5,10].map(delta=><button type="button" key={delta} onClick={()=>onChange(selected,Math.max(0,Math.min(member.max,Number(member.atual)+delta)))} aria-label={`Ajustar ${delta>0?'+':''}${delta} de Integridade`}>{delta>0?'+':''}{delta}</button>)}</div>
    <form className="abs-body-damage" onSubmit={event=>{event.preventDefault();if(amount>0)onDamage(selected,amount);}}><label>Dano recebido<NumberInput aria-label="Dano recebido na região" min="1" value={amount} onChange={event=>setAmount(Math.max(1,Number(event.target.value)||1))}/></label><button type="submit">Aplicar dano</button><small>Aplica a defesa e as resistências do tipo de dano selecionado.</small></form>
    <label className="abs-body-defense">Defesa regional<NumberInput aria-label={`Defesa de ${region.nome}`} min="0" value={member.defesa || 0} onChange={event=>onDefenseChange(selected,event.target.value)}/></label>
    <section className="abs-body-equipment"><span>PROTEÇÃO EQUIPADA</span>{defenses.length ? defenses.map((defense,index)=><button type="button" key={defense.id || index} onClick={()=>onInspectDefense?.(defense,-1)}>{defense.nome} ↗</button>) : <p>Esta região não está protegida.</p>}</section>
    <small className="abs-body-thresholds">Estável: acima de 50% · Machucado: até 50% · Crítico: até 10% · Não Funcional: 0.</small>
   </div>
  </div>
 </section>;
}
