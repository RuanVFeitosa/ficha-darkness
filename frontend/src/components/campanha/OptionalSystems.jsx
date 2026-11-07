import React, {useRef, useState} from 'react';
import Icon from '@mdi/react';
import {mdiAmmunition,mdiWaterOutline,mdiTuneVariant,mdiPlus,mdiPencilOutline,mdiTrashCanOutline} from '@mdi/js';
import {OPTIONAL_SYSTEMS} from '../../utils/optionalSystems';
import {normalizeMechanics} from '../../utils/specialMechanics';
import {commitMechanicAction} from '../../services/mechanicActions';
import '../../styles/OptionalSystems.css';

const systemIcon=kind=>kind==='ammo'?mdiAmmunition:kind==='survival'?mdiWaterOutline:mdiTuneVariant;
const systemCategory=kind=>kind==='ammo'?'ARSENAL':kind==='survival'?'SOBREVIVÊNCIA':'REGRA DA MESA';

function SystemCard({system, campaign, master, playerId, busy, commit}) {
 const [editing,setEditing]=useState(false);
 return <article className={`optional-system-card ${system.enabled?'is-enabled':''}`}><header><div className="optional-system-identity"><span className="optional-system-icon"><Icon path={systemIcon(system.kind)} size={1}/></span><div><small>{systemCategory(system.kind)}</small><h4>{system.name}</h4></div></div><span className="optional-status" data-active={system.enabled}>{system.enabled?'Ativo':'Desativado'}</span></header>
 <p style={{whiteSpace:'pre-wrap'}}>{system.rules}</p>
 {master && <footer className="optional-system-actions"><button className="optional-activation" role="switch" aria-checked={Boolean(system.enabled)} aria-label={`Ativar ${system.name}`} disabled={busy} onClick={()=>commit({type:'optionalToggle',id:system.id})}><span className="optional-switch" aria-hidden="true"/>{system.enabled?'Em uso na campanha':'Ativar na campanha'}</button><button className="optional-edit" aria-expanded={editing} onClick={()=>setEditing(!editing)}><Icon path={mdiPencilOutline} size={.65}/>Editar regras</button><button className="optional-delete" aria-label={`Excluir ${system.name}`} title="Excluir sistema" disabled={busy} onClick={()=>commit({type:'optionalRemove',id:system.id})}><Icon path={mdiTrashCanOutline} size={.75}/></button></footer>}
 {editing && <form onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);if(await commit({type:'optionalEdit',id:system.id,name:data.get('name'),rules:data.get('rules')}))setEditing(false);}}><label>Nome<input name="name" defaultValue={system.name} required maxLength={100}/></label><label>Regras<textarea name="rules" defaultValue={system.rules} maxLength={4000}/></label><button disabled={busy}>Salvar regras</button></form>}
 {system.kind==='survival' && (master || system.enabled) && <div className="optional-participants">{!(campaign.membros || []).length && <p>Vincule fichas à campanha para acompanhar fome e sede.</p>}{(campaign.membros || []).filter(m=>master || m.ficha_id===playerId).map(member=><section key={member.ficha_id}><strong>{member.nome || member.ficha_id}</strong>{[['hunger','Fome'],['thirst','Sede']].map(([key,label])=><div className="optional-counter" key={key}><span>{label}</span>{master && <button aria-label={`Reduzir ${label} de ${member.nome}`} disabled={busy || !system.participants?.[member.ficha_id]?.[key]} onClick={()=>commit({type:'optionalSurvival',id:system.id,playerId:member.ficha_id,key,delta:-1})}>−</button>}<output>{system.participants?.[member.ficha_id]?.[key] || 0}/10</output>{master && <button aria-label={`Aumentar ${label} de ${member.nome}`} disabled={busy || system.participants?.[member.ficha_id]?.[key]>=10} onClick={()=>commit({type:'optionalSurvival',id:system.id,playerId:member.ficha_id,key,delta:1})}>+</button>}</div>)}</section>)}</div>}
 </article>;
}
export default function OptionalSystems({campaign, onState, master=false, playerId}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [creating,setCreating]=useState(false);
 const lock=useRef(false);
 const state=normalizeMechanics(campaign.mecanicasEspeciais);
 const systems=state.optionalSystems || [];
 const commit=async action=>{
  if(lock.current)return false;
  lock.current=true;setBusy(true);setError('');
  try {onState(await commitMechanicAction(campaign,state,action,{master,playerId}));return true;}
  catch(e){setError(e.message);return false;}
  finally{lock.current=false;setBusy(false);}
 };
 return <section className="optional-systems" aria-label="Sistemas opcionais">
 {master && <div className="optional-workspace-heading"><div><span>REGRAS DESTA CAMPANHA</span><h3>Sua mesa, suas regras.</h3><p>Escolha o que faz parte da experiência de {campaign.nome || 'sua campanha'}.</p></div><button className="optional-primary" aria-expanded={creating} onClick={()=>setCreating(!creating)}><Icon path={mdiPlus} size={.8}/>{creating?'Fechar criação':'Novo sistema'}</button></div>}
 {master && creating && <form className="optional-create-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);if(await commit({type:'optionalCreate',kind:'custom',id:`optional-${Date.now()}`,name:data.get('name'),rules:data.get('rules')})){form.reset();setCreating(false);}}}><h4>Criar sistema personalizado</h4><p>Registre as regras que tornam esta campanha única.</p><label>Nome<input name="name" required maxLength={100} placeholder="Ex.: Corrupção, reputação, suprimentos…" autoFocus/></label><label>Regras<textarea name="rules" maxLength={4000} placeholder="Descreva quando a regra se aplica e como os jogadores devem usá-la."/></label><div className="optional-system-actions"><button className="optional-primary" disabled={busy}>Criar sistema</button><button type="button" onClick={()=>setCreating(false)}>Cancelar</button></div></form>}
 {error && <p role="alert">{error}</p>}
 {master && <div className="optional-section-label"><span>NA CAMPANHA <b>{systems.length}</b></span><small>{systems.filter(s=>s.enabled).length} ativos</small></div>}
 <div className="optional-system-grid">{systems.filter(s=>master || s.enabled).map(system=><SystemCard key={system.id} {...{system,campaign,master,playerId,busy,commit}}/>)}</div>
 {!systems.filter(s=>master || s.enabled).length && <div className="optional-empty"><Icon path={mdiTuneVariant} size={1.5}/><h4>{master?'Comece pelas regras da sua mesa':'Nenhum sistema ativo'}</h4><p>{master?'Adicione um modelo abaixo ou crie um sistema próprio.':'As regras opcionais aparecerão aqui quando o mestre as ativar.'}</p></div>}
 {master && <section className="optional-templates"><div className="optional-section-label"><span>MODELOS DISPONÍVEIS</span><small>Prontos para adicionar</small></div><div className="optional-template-grid">{Object.entries(OPTIONAL_SYSTEMS).map(([kind,preset])=>{const added=systems.some(s=>s.kind===kind);return <article key={kind}><span className="optional-system-icon"><Icon path={systemIcon(kind)} size={1}/></span><div><small>{systemCategory(kind)}</small><h4>{preset.name}</h4><p>{kind==='ammo'?'Cada disparo conta. Controle carregadores e reservas das armas.':'Acompanhe a sobrevivência com fome e sede por personagem.'}</p><button disabled={busy || added} onClick={()=>commit({type:'optionalCreate',kind,id:`optional-${Date.now()}-${kind}`})} aria-label={`Adicionar ${preset.name}`}>{added?'✓ Adicionado à campanha':'+ Adicionar à campanha'}</button></div></article>;})}</div></section>}
 </section>;
}
