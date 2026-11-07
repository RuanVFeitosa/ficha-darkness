import {activeSceneDifficulty} from '../../utils/sceneDifficulty';
import ShieldNavigation from './ShieldNavigation';
import OptionalSystems from '../campanha/OptionalSystems';
import NewSceneControl from './NewSceneControl';
import Icon from '@mdi/react';
import {mdiTuneVariant,mdiAccountGroupOutline,mdiFileDocumentMultipleOutline,mdiViewDashboardOutline,mdiImageOutline,mdiNotebookEditOutline,mdiMusicBoxMultipleOutline} from '@mdi/js';
import React,{useMemo,useState} from 'react';
import {masterShieldEntries} from '../../data/masterShield';
import {EXITO_DOMINIO,resolverTeste} from '../../data/absolutoV1';
import {resolveRoll} from '../../data/espiral';
import {damageImpact,injurySeverity} from '../../utils/espiralInjuries';
import ShieldRoster from './ShieldRoster';
import SceneDifficultyPanel from './SceneDifficultyPanel';
import '../../styles/MasterShield.css';
function readStored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function usePrivateStorage(key,fallback){const [value,set]=useState(()=>readStored(key,fallback));return [value,next=>{set(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{}}];}
function ResolutionTools({system}){
 const [dice,setDice]=useState(''),[pressure,setPressure]=useState(''),[target,setTarget]=useState(system==='espiral'?4:1),[domain,setDomain]=useState(1),[sides,setSides]=useState(6);
 const [damage,setDamage]=useState(0),[armor,setArmor]=useState(0),[reduction,setReduction]=useState(0),[critical,setCritical]=useState(false);
 const parse=value=>value.split(/[\s,;]+/).filter(Boolean).map(Number);
 let result='Insira os resultados já rolados para consultar a resolução.';
 if(dice.trim())try{
  const values=parse(dice);
  if(system==='espiral'){
   const extra=parse(pressure);if(values.some(v=>!Number.isInteger(v)||v<1||v>sides)||extra.some(v=>!Number.isInteger(v)||v<1||v>6))throw new Error('Confira as faces dos dados informados.');
   const roll=resolveRoll(values,extra,sides,target);result=`${roll.outcome} · margem ${roll.margin>=0?'+':''}${roll.margin} · ${roll.stress}${roll.mastery?' · Domínio':''}`;
  }else {const roll=resolverTeste(values,target,domain);result=`${roll.critico?'Crítico':roll.sucesso?'Sucesso':'Falha'} · ${roll.exitos} Êxitos · ${roll.finais} Finais`;}
 }catch(error){result=error.message;}
 const impact=damageImpact(damage,armor,reduction);
 return <div className="shield-tools"><details><summary>Resolver um teste</summary><p>Consulta dos dados informados; não gera nem compartilha rolagens.</p><label>Resultados dos dados<input value={dice} onChange={e=>setDice(e.target.value)} placeholder="Ex.: 6, 4, 2"/></label><div className="shield-input-row"><label>Dificuldade<input aria-label="Dificuldade da consulta" type="number" min="1" max={system==='espiral'?30:5} value={target} onChange={e=>setTarget(Number(e.target.value))}/></label>{system==='espiral'?<label>Faces do Atributo<select value={sides} onChange={e=>setSides(Number(e.target.value))}>{[4,6,8,10,12].map(n=><option key={n} value={n}>d{n}</option>)}</select></label>:<label>Domínio<select value={domain} onChange={e=>setDomain(Number(e.target.value))}>{EXITO_DOMINIO.map((text,i)=><option key={i} value={i}>{i} · {text}</option>)}</select></label>}</div>{system==='espiral'&&<label>Dados de Pressão<input value={pressure} onChange={e=>setPressure(e.target.value)} placeholder="Ex.: 1, 5"/></label>}<output aria-label="Resolução da consulta">{result}</output></details>
 <details><summary>Calcular dano e proteção</summary><div className="shield-input-row">{[['Dano bruto',damage,setDamage],['Proteção / RD',armor,setArmor],['Redução adicional',reduction,setReduction]].map(([label,value,set])=><label key={label}>{label}<input type="number" min="0" value={value} onChange={e=>set(Math.max(0,Number(e.target.value)||0))}/></label>)}</div>{system==='espiral'&&<label className="shield-checkbox"><input type="checkbox" checked={critical} onChange={e=>setCritical(e.target.checked)}/>Região Crítica</label>}<output aria-label="Dano líquido">{impact} de {system==='espiral'?'Impacto':'dano líquido'}{system==='espiral'?` · ${injurySeverity(impact,critical) || 'Sem lesão'}`:' · aplicar somente à região atingida'}</output></details></div>;
}
function PrivateSession({campaignId,open=false}){
 const prefix=`darkness:master-shield:${campaignId || 'local'}`;
 const [note,setNote]=usePrivateStorage(prefix+':notes','');
 const [clock,setClock]=usePrivateStorage(prefix+':clock',{name:'',size:6,value:0});
 return <details className="shield-private" open={open || undefined}><summary>Relógio de progresso e notas privadas</summary><p>Salvos apenas neste navegador, por campanha. Não são enviados aos jogadores.</p><label>Nome do relógio<input placeholder="Ex.: A ameaça chega" value={clock.name} onChange={e=>setClock({...clock,name:e.target.value})}/></label><div className="shield-clock"><select aria-label="Segmentos do relógio" value={clock.size} onChange={e=>setClock({...clock,size:Number(e.target.value),value:Math.min(clock.value,Number(e.target.value))})}>{[4,6,8,12].map(size=><option key={size} value={size}>{size} segmentos</option>)}</select><button type="button" aria-label="Reduzir progresso" disabled={!clock.value} onClick={()=>setClock({...clock,value:clock.value-1})}>−</button><output aria-label="Progresso do relógio">{clock.value} / {clock.size}</output><button type="button" aria-label="Avançar progresso" disabled={clock.value>=clock.size} onClick={()=>setClock({...clock,value:clock.value+1})}>+</button></div><progress max={clock.size} value={clock.value}/><label>Anotações do mestre<textarea rows="5" value={note} onChange={e=>setNote(e.target.value)} placeholder="Nomes, pistas, perigos, lembretes…"/></label></details>;
}
export default function MasterShield({organized=false,campaign,onOptionalState,campaignId,scene,members=[],combat=false,investigation=false,enemies=[],onSaveDifficulty,onSaveEnemy,onAddEnemy,onRemoveEnemy,campaignSystem,documents,renderTool,extraTools=[]}){
 const [selectedSystem,setSystem]=usePrivateStorage('darkness:master-shield:system','absoluto');
 const system=campaignSystem || selectedSystem;
 const [visitedTools,setVisitedTools]=useState([]);
 const shieldTools=[['dashboard','Dashboard',mdiViewDashboardOutline],['scenes','Cenas',mdiImageOutline],['notes','Anotações',mdiNotebookEditOutline],['audio','Música',mdiMusicBoxMultipleOutline],['soundpad','Soundpad',mdiMusicBoxMultipleOutline],...extraTools.map(([id,label,icon])=>[id,label,icon || mdiAccountGroupOutline])];
 const [activeSection,setActiveSection]=useState('session'),[documentsVisited,setDocumentsVisited]=useState(false);
 const entries=useMemo(()=>masterShieldEntries(system),[system]);
 const quickReferences=entries.filter(entry=>entry.id===system+"-atributos"||entry.id===system+"-recursos"||entry.id===system+"-dominios");
 const chooseSection=id=>{
   setActiveSection(id);
   if(id==='documents')setDocumentsVisited(true);
   if(shieldTools.some(tool=>tool[0]===id))setVisitedTools(current=>current.includes(id)?current:[...current,id]);
 };
 const currentDifficulty=scene ? activeSceneDifficulty(scene,enemies,combat) : null;
 const navigationTools=[
   {id:'session',label:'Visão geral'},{id:'roster',label:'Inimigos e NPCs'},
   {id:'reference',label:'Consulta e cálculos'},{id:'privateNotes',label:'Lembretes privados'},
   ...(documents?[{id:'documents',label:'Documentos e pistas'}]:[]),
   ...(campaign&&onOptionalState?[{id:'optionalSystems',label:'Sistemas opcionais'}]:[]),
   ...(renderTool?shieldTools.map(([id,label])=>({id,label:id==='dashboard'?'Campanha':id==='scenes'?'Cenas e mapas':id==='flashlight'?'Lanternas':label})):[]),
 ];
 const rosterContent=(<ShieldRoster onRemove={onRemoveEnemy} renderInitiative={renderTool && (combat || investigation) ? record=>renderTool('enemyInitiative:'+record.id) : undefined} enemies={enemies} system={system} onSave={onSaveEnemy} onAdd={onAddEnemy} onChoose={onSaveDifficulty} chosenId={scene?.dificuldades?.combateInimigoId}/>);
 const referenceContent=(<div className="shield-reference-column">{scene&&<aside className="shield-scene-references" aria-label="Referências rápidas"><span>CONSULTA RÁPIDA</span>{quickReferences.map(entry=><details key={entry.id}><summary>{entry.titulo}</summary><p>{entry.texto}</p></details>)}</aside>}<section className="shield-quick"><h3>{system==='espiral'?'Maior dado − dificuldade':'Atributo define dados · Domínio define Êxitos'}</h3>{system==='espiral'?<dl>{[['≤ −3','Falha grave'],['−2 / −1','Falha'],['0','Sucesso com consequência'],['+1 / +2','Sucesso'],['≥ +3','Sucesso excepcional']].map(([value,label])=><div key={value}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>:<><p>Até 8d6 · DT 1 Comum / 2 Desafiadora / 3 Difícil / 4 Extrema / 5 Absoluta.</p><dl>{EXITO_DOMINIO.map((text,i)=><div key={text}><dt>Domínio {i}</dt><dd>{text}</dd></div>)}</dl></>}</section>
 <ResolutionTools key={system} system={system}/>{!organized && <PrivateSession key={campaignId || 'local'} campaignId={campaignId}/>}</div>);
 return <div className={`master-shield ${organized ? "master-shield-organized" : ""}`} onKeyDown={event=>{if(event.key!=="Escape")event.stopPropagation();}} onKeyUp={event=>event.stopPropagation()}><header><span>CONSULTA PRIVADA / NARRADOR</span><h2>Escudo do mestre</h2><p>Regras à mão. A atenção continua na mesa.</p></header>{!campaignSystem&&<nav className="shield-systems" aria-label="Sistema do escudo">{[['absoluto','Absoluto 1.0'],['espiral','ESPIRAL']].map(([id,label])=><button type="button" key={id} aria-pressed={system===id} onClick={()=>setSystem(id)}>{label}</button>)}</nav>}
 {organized ? <ShieldNavigation tools={navigationTools} active={activeSection} onChoose={chooseSection}>{system==='absoluto'&&<NewSceneControl members={members}/>}</ShieldNavigation> : (<div className="shield-toolbar">{(documents || renderTool || campaign) && <nav className="shield-sections" aria-label="Áreas do escudo"><button type="button" aria-pressed={activeSection==='session'} onClick={()=>setActiveSection('session')}><Icon path={mdiAccountGroupOutline} size={.7} aria-hidden="true"/>Cena e participantes</button>{campaign && onOptionalState && <button type="button" aria-pressed={activeSection==='optionalSystems'} onClick={()=>setActiveSection('optionalSystems')}><Icon path={mdiTuneVariant} size={.7} aria-hidden="true"/>Sistemas opcionais</button>}{documents && <button type="button" aria-pressed={activeSection==='documents'} onClick={()=>{setActiveSection('documents');setDocumentsVisited(true);}}><Icon path={mdiFileDocumentMultipleOutline} size={.7} aria-hidden="true"/>Documentos</button>}{renderTool && shieldTools.map(([id,label,icon])=><button type="button" key={id} aria-pressed={activeSection===id} onClick={()=>{setActiveSection(id);setVisitedTools(current=>current.includes(id)?current:[...current,id]);}}><Icon path={icon} size={.7} aria-hidden="true"/>{label}</button>)}</nav>}{system==='absoluto'&&<NewSceneControl members={members}/>}</div>)}
 {organized && <div className="shield-location"><span>{scene?.nome || 'Mesa de jogo'}</span><span>{combat?'Combate ativo':investigation?'Investigação ativa':'Exploração'}</span>{currentDifficulty && <span className="shield-current-difficulty">DT {currentDifficulty.value} · {currentDifficulty.label}</span>}</div>}

 <div className="shield-workspace" hidden={activeSection!=='session'}>{scene&&<div className="shield-context">{!organized && <><strong>{scene.nome || 'Cena atual'}</strong><span>{combat?'Combate ativo':investigation?'Investigação ativa':'Exploração'}</span></>}{onSaveDifficulty ? <div className="shield-scene-overview"><SceneDifficultyPanel scene={scene} enemies={enemies} onSave={onSaveDifficulty} system={system}/></div> : <span>Ambiente {scene.dificuldades?.ambiente??4} · Combate {scene.dificuldades?.combateAmbiente??4} · Conflitos {scene.dificuldades?.conflitos??4}</span>}{system==='absoluto'&&<small>A escala de DT do Absoluto continua sendo 1–5.</small>}</div>}
 {!organized ? rosterContent : <section className="shield-overview-card" aria-label="Resumo dos participantes"><span>PARTICIPANTES</span><h3>{members.filter(member=>member.papel!=="mestre").length} jogadores · {enemies.length} inimigos e NPCs</h3><p>Acompanhe os turnos no cabeçalho e use os atalhos para administrar a sessão.</p><div className="shield-overview-actions">{shieldTools.some(tool=>tool[0]==='players') && <button type="button" onClick={()=>chooseSection('players')}>Fichas dos jogadores</button>}<button type="button" onClick={()=>chooseSection('roster')}>Inimigos e NPCs</button>{renderTool&&<button type="button" onClick={()=>chooseSection('scenes')}>Cenas e mapas</button>}{documents&&<button type="button" onClick={()=>chooseSection('documents')}>Documentos e pistas</button>}</div></section>}{!organized && referenceContent}</div>
 {organized && <section className="shield-organized-roster" hidden={activeSection!=='roster'} aria-label="Gestão de participantes">{rosterContent}</section>}
 {organized && <section hidden={activeSection!=='reference'} aria-label="Consulta de regras">{referenceContent}</section>}
 {organized && <section hidden={activeSection!=='privateNotes'} aria-label="Lembretes privados"><PrivateSession open key={campaignId || 'local'} campaignId={campaignId}/></section>}
 {activeSection==='optionalSystems' && campaign && onOptionalState && <section className="shield-optional-systems" aria-label="Controles dos sistemas opcionais"><OptionalSystems key={campaign.id} campaign={campaign} master onState={onOptionalState}/></section>}
 {documentsVisited && <section className="shield-documents" aria-label="Documentos do mestre" hidden={activeSection!=='documents'}>{documents}</section>}
 {renderTool && visitedTools.map(id=><section className={`shield-tool shield-tool-${id}`} key={id} aria-label={shieldTools.find(tool=>tool[0]===id)?.[1]} hidden={activeSection!==id}>{renderTool(id)}</section>)}
 </div>;
}
