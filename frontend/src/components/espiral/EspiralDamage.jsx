import NumberInput from '../ui/NumberInput';
import React, {useEffect,useState} from 'react';
import {damageImpact,injurySeverity,INJURY_EFFECTS,remainingInjuryImpact} from '../../utils/espiralInjuries';
import '../../styles/SimpleInjuries.css';

export default function EspiralDamage({region,onApply,integrity,onRegionChange,regions=[]}) {
  const [damage,setDamage]=useState(''),[protection,setProtection]=useState('0'),[reduction,setReduction]=useState('0'),[note,setNote]=useState(''),[bleeding,setBleeding]=useState(false),[critical,setCritical]=useState(null),[message,setMessage]=useState('');
  useEffect(()=>{setCritical(null);setMessage('');},[region]);
  const criticalRegion=critical ?? !/^(Braço|Perna)/.test(region);
  const impact=damageImpact(damage,protection,reduction),severity=injurySeverity(impact,criticalRegion);
  const valid=[damage,protection,reduction].every(value=>value!==''&&Number.isInteger(Number(value))&&Number(value)>=0);
  const remaining=Number.isFinite(integrity)?Math.max(0,integrity-impact):null;
  function apply(){
    onApply({region,severity,impact,damage:Number(damage),protection:Number(protection),reduction:Number(reduction),criticalRegion,bleeding:impact>0&&bleeding,note});
    setMessage(impact?`Ferimento registrado em ${region}. Integridade reduzida em ${impact}.`:'Todo o dano foi bloqueado. Sem lesão e sem perda de Integridade.');
    setDamage('');setNote('');setBleeding(false);
  }
  return <section className="es-rule-card es-damage pd-simple-damage" aria-label="Aplicar dano">
    <div className="pd-injury-step"><span>1</span><h3>Onde acertou?</h3></div>
    {onRegionChange?<label className="es-field"><span>Parte do corpo</span><select value={region} onChange={event=>onRegionChange(event.target.value)}>{regions.map(name=><option key={name}>{name}</option>)}</select></label>:<p>{region}</p>}
    <div className="pd-injury-step"><span>2</span><h3>Quanto dano recebeu?</h3></div>
    <div className="pd-injury-main-fields"><label className="es-field"><span>Dano recebido</span><NumberInput aria-label="Dano rolado" type="number" min="0" step="1" placeholder="0" value={damage} onChange={event=>{setDamage(event.target.value);setMessage('');}}/></label><label className="es-field"><span>Proteção que bloqueou o dano</span><NumberInput aria-label="Proteção aplicada" type="number" min="0" step="1" value={protection} onChange={event=>{setProtection(event.target.value);setMessage('');}}/></label></div>
    <details className="pd-injury-options"><summary>Outros efeitos e detalhes do ferimento</summary><label className="es-field"><span>Redução por outros efeitos</span><NumberInput type="number" min="0" step="1" value={reduction} onChange={event=>{setReduction(event.target.value);setMessage('');}}/></label><label className="es-damage-check"><input type="checkbox" checked={criticalRegion} onChange={event=>setCritical(event.target.checked)}/>Região Crítica neste ferimento</label><label className="es-damage-check"><input type="checkbox" checked={bleeding} disabled={!impact} onChange={event=>setBleeding(event.target.checked)}/>Sangramento confirmado neste ferimento</label><label className="es-field"><span>Descrição do ataque e ferimento</span><input value={note} onChange={event=>setNote(event.target.value)} placeholder="Opcional"/></label></details>
    <div className="pd-injury-step"><span>3</span><h3>Confira e aplique</h3></div>
    <div className="pd-injury-preview" data-severity={severity || 'none'} aria-live="polite">
      {damage===''?<p>Informe o dano para ver o resultado.</p>:<><div className="pd-injury-preview-title"><strong>{severity?`Lesão ${severity.toLowerCase()}`:'Dano bloqueado'}</strong><span>{region}</span></div><div className="pd-injury-health"><span>Integridade</span><strong>{remaining!==null?`${integrity} → ${remaining}`:`−${impact}`}</strong><small>{impact?`Perde ${impact} ponto${impact===1?'':'s'}`:'Nenhum ponto perdido'}</small></div>{severity&&<p>{INJURY_EFFECTS[severity]}</p>}<small>{Number(damage)} de dano − {Number(protection)||0} de proteção{Number(reduction)>0?` − ${Number(reduction)} de redução`:''} = {impact} de impacto</small></>}
    </div>
    <button type="button" className="es-primary" aria-label="Aplicar dano e registrar lesão" disabled={!valid} onClick={apply}>{impact?`Confirmar ferimento · −${impact} de Integridade`:'Confirmar dano bloqueado'}</button>
    {message&&<p className="pd-injury-feedback" role="status">{message}</p>}
  </section>;
}

export function InjuryRecord({injury,onRemove}) {
  return <article className="pd-injury-record" data-severity={injury.severity}><header><div><strong>{injury.region}</strong><span>{injury.severity}{injury.bleeding?' · Sangramento':''}</span></div><button type="button" aria-label={`Remover lesão em ${injury.region}`} onClick={onRemove}>Remover</button></header>{remainingInjuryImpact(injury)!==null&&<small className="pd-injury-remaining">{remainingInjuryImpact(injury)} ponto(s) de cura para remover</small>}{injury.note&&<p>{injury.note}</p>}<p>{INJURY_EFFECTS[injury.severity]}</p><details><summary>Detalhes do registro</summary>{injury.impact!=null&&<p>Perda de Integridade: {injury.impact}. Dano {injury.damage} − proteção {injury.protection} − outros efeitos {injury.reduction}.</p>}<small>Remover o registro não recupera Integridade.</small></details></article>;
}
