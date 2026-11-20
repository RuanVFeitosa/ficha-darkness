import React,{useState} from 'react';
import NumberInput from '../ui/NumberInput';
import {healInjuries,remainingInjuryImpact} from '../../utils/espiralInjuries';

export default function EspiralHealing({sheet,setSheet,region,onRegionChange,regions,maximum}) {
  const [amount,setAmount]=useState(''),[all,setAll]=useState(false),[manual,setManual]=useState({}),[message,setMessage]=useState('');
  const target=all?null:region;
  const unknown=(sheet.injuries || []).filter(injury=>(!target||injury.region===target)&&remainingInjuryImpact(injury)===null);
  const valid=Number.isInteger(Number(amount))&&Number(amount)>0&&unknown.every(injury=>Number.isInteger(Number(manual[injury.id]))&&Number(manual[injury.id])>0);
  const preview=valid?healInjuries(sheet,Number(amount),target,maximum,manual):null;
  function apply(){
    if(!valid)return;
    setSheet(previous=>healInjuries(previous,Number(amount),target,maximum,manual).sheet);
    setMessage(`Cura aplicada: +${preview.recovered} de Integridade. ${preview.removed} lesão(ões) removida(s) e ${preview.improved} tratada(s).`);
    setAmount('');setManual({});
  }
  return <section className="es-rule-card es-damage pd-simple-damage pd-simple-healing" aria-label="Aplicar cura">
    <div className="pd-injury-step"><span>1</span><h3>Onde vai tratar?</h3></div>
    <label className="es-field"><span>Região a curar</span><select value={all?'all':region} onChange={event=>{setAll(event.target.value==='all');if(event.target.value!=='all')onRegionChange(event.target.value);setMessage('');}}><option value="all">Todo o corpo</option>{regions.map(name=><option key={name}>{name}</option>)}</select></label>
    <div className="pd-injury-step"><span>2</span><h3>Quanto de cura recebeu?</h3></div>
    <label className="es-field"><span>Pontos de cura</span><NumberInput type="number" min="1" step="1" value={amount} placeholder="0" onChange={event=>{setAmount(event.target.value);setMessage('');}}/></label>
    {unknown.length>0&&<div className="pd-healing-manual"><p>Estas lesões foram registradas sem dano. Informe quanto falta curar para permitir o tratamento automático.</p>{unknown.map(injury=><label className="es-field" key={injury.id}><span>Dano restante · {injury.region} / {injury.severity}</span><NumberInput type="number" min="1" step="1" value={manual[injury.id] || ''} onChange={event=>setManual({...manual,[injury.id]:event.target.value})}/></label>)}</div>}
    <div className="pd-injury-step"><span>3</span><h3>Confira a recuperação</h3></div>
    <div className="pd-injury-preview pd-healing-preview" aria-live="polite">{preview?<><div className="pd-injury-health"><span>Integridade</span><strong>{sheet.integrity} → {preview.sheet.integrity}</strong><small>+{preview.recovered} / máximo {maximum}</small></div><p>{preview.removed} lesão(ões) removida(s) · {preview.improved} tratada(s)</p>{preview.sheet.injuries.filter(injury=>remainingInjuryImpact(injury)!==null&&(sheet.injuries || []).some(previous=>previous.id===injury.id&&remainingInjuryImpact(previous)!==remainingInjuryImpact(injury))).map(injury=><p key={injury.id}>{injury.region}: {injury.severity.toLowerCase()} · {injury.remainingImpact} ponto(s) para curar</p>)}</>:<p>Informe a cura para ver a recuperação.</p>}</div>
    <p className="pd-healing-help">Cada ponto recupera Integridade e reduz o impacto das lesões escolhidas, começando pela mais antiga. Ao zerar o impacto, a lesão desaparece.</p>
    <button type="button" className="es-primary" disabled={!valid} onClick={apply}>Aplicar cura</button>
    {message&&<p className="pd-injury-feedback" role="status">{message}</p>}
  </section>;
}
