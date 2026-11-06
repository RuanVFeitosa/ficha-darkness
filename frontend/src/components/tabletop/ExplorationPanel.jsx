import React,{useState} from 'react';
export default function ExplorationPanel({assets=[],config={},members=[],position=[0,0],elevation=0,onSave}) {
 const [draft,setDraft]=useState(()=>({visibility:{},audioZones:[],...config}));
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const patchAsset=(id,patch)=>setDraft(current=>({...current,visibility:{...current.visibility,[id]:{...current.visibility?.[id],...patch}}}));
 const zonePatch=(id,patch)=>setDraft(current=>({...current,audioZones:current.audioZones.map(zone=>zone.id===id?{...zone,...patch}:zone)}));
 const save=async()=>{setBusy(true);setError('');try{await onSave(draft);}catch(e){setError(e.message || 'Não foi possível salvar.');}finally{setBusy(false);}};
 return <div className="tt3-exploration-panel"><h3>Exploração e ambiente</h3><p>Controle os objetos mostrados a cada jogador e configure sons no mapa atual.</p>
 <section><h4>Objetos e pistas do mapa</h4>{!assets.length&&<p>Nenhum objeto neste mapa.</p>}{assets.map(item=>{
 const state=draft.visibility?.[item.instanceId] || {};
 return <details key={item.instanceId}><summary>{item.asset?.name || 'Objeto'}{state.hidden?' · Oculto':state.audience?' · Revelação individual':''}</summary>
 <label><input type="checkbox" checked={Boolean(state.hidden)} onChange={e=>patchAsset(item.instanceId,{hidden:e.target.checked})}/>Ocultar dos jogadores</label>
 <label><input type="checkbox" checked={state.audience!=null} onChange={e=>patchAsset(item.instanceId,{audience:e.target.checked?[]:null})}/>Revelar apenas para jogadores selecionados</label>
 {state.audience!=null&&members.filter(m=>m.papel!=='mestre').map(member=>{const id=String(member.ficha_id);return <label key={id}><input type="checkbox" checked={state.audience.includes(id)} onChange={e=>patchAsset(item.instanceId,{audience:e.target.checked?[...state.audience,id]:state.audience.filter(value=>value!==id)})}/>{member.nome || id}</label>;})}
 </details>;})}</section>
 <section><h4>Fontes de áudio</h4><p>Use uma URL direta de áudio. Cada jogador ativa o som no próprio navegador.</p>
 <button type="button" onClick={()=>setDraft(current=>({...current,audioZones:[...(current.audioZones || []),{id:'audio-'+Date.now(),name:'Som ambiente',url:'',x:position[0],y:elevation+.5,z:position[1],radius:5,volume:.5}]}))}>Adicionar som na posição selecionada</button>
 {(draft.audioZones || []).map(zone=><fieldset key={zone.id}><legend>{zone.name}</legend><label>Nome<input value={zone.name} onChange={e=>zonePatch(zone.id,{name:e.target.value})}/></label><label>URL do áudio<input type="url" value={zone.url} onChange={e=>zonePatch(zone.id,{url:e.target.value})}/></label>
 <div className="tt3-exploration-fields">{[['x','X'],['y','Altura'],['z','Z'],['radius','Alcance (m)'],['volume','Volume (0–1)']].map(([key,label])=><label key={key}>{label}<input type="number" step={key==='volume'?'.05':'.1'} min={key==='radius'?'.1':key==='volume'?'0':undefined} max={key==='volume'?'1':undefined} value={zone[key]} onChange={e=>zonePatch(zone.id,{[key]:Number(e.target.value)})}/></label>)}</div>
 <button type="button" onClick={()=>setDraft(current=>({...current,audioZones:current.audioZones.filter(item=>item.id!==zone.id)}))}>Remover som</button></fieldset>)}</section>
 {error&&<p role="alert">{error}</p>}<button type="button" disabled={busy} onClick={save}>{busy?'Salvando…':'Salvar exploração do mapa'}</button></div>;
}
