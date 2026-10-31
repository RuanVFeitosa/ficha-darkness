import React,{useState} from 'react';
import {decidirRecriacao} from '../../services/personagemApi';
import {SENHA_MESTRE} from '../../constants/masterAccess';
import '../../styles/RecriacaoRequests.css';
const labels={nome:'Nome',name:'Nome',player:'Jogador',pronome:'Pronome',pronoun:'Pronome',attributes:'Atributos',atributos:'Atributos',resources:'Recursos',dominios:'Domínios',fotoPerfil:'Foto',profileImage:'Foto',vertente:'Vertente',purpose:'Propósito',humanidade:'Humanidade',occupation:'Ocupação',classe:'Classe',age:'Idade'};
const valueView=value=>typeof value==='string'&&value.startsWith('data:image/') ? <img src={value} alt="Foto da proposta"/> : <pre>{value==null?'Não informado':typeof value==='object'?JSON.stringify(value,null,2):String(value)}</pre>;
export default function RecriacaoRequests({fichas,onSaved}){
 const [busy,setBusy]=useState(''),[erro,setErro]=useState('');
 const pending=fichas.filter(f=>f.personagem?.recriacaoPendente);
 const decide=async(ficha,acao)=>{
  if(busy)return;setBusy(ficha.fichaId);setErro('');
  try{
   const remoteId=ficha.espiralId?`espiral_${ficha.espiralId}`:ficha.fichaId;
   const saved=await decidirRecriacao(remoteId,ficha.personagem.recriacaoPendente.id,acao,SENHA_MESTRE);
   localStorage.setItem(ficha.espiralId?`espiral:sheet:v1:${ficha.espiralId}`:`fichaRPG_personagem_${ficha.fichaId}`,JSON.stringify(saved));
   onSaved(ficha,saved);
  }catch(error){setErro(error.message);}finally{setBusy('');}
 };
 return <section className="recriacao-requests" aria-label="Solicitações para refazer fichas"><header><h2>Recriações de ficha</h2><span>{pending.length} pendente(s)</span></header><p>A ficha atual permanece em uso até você aprovar a proposta.</p>{erro&&<p role="alert">{erro}</p>}{!pending.length?<p>Nenhuma recriação aguardando análise.</p>:pending.map(ficha=>{
 const request=ficha.personagem.recriacaoPendente;
 return <article key={request.id}><h3>{ficha.personagem.name || ficha.personagem.nome}</h3><small>{request.sistema==='espiral'?'ESPIRAL':'Absoluto'} · {new Date(request.criadoEm).toLocaleString('pt-BR')}</small><details><summary>Comparar {Object.keys(request.alteracoes).length} alterações</summary><div className="recriacao-comparison"><strong>Campo</strong><strong>Atual no envio</strong><strong>Proposta</strong>{Object.entries(request.alteracoes).map(([key,change])=><React.Fragment key={key}><span>{labels[key] || key}</span><div>{valueView(change.antes)}</div><div>{valueView(change.depois)}</div></React.Fragment>)}</div></details><footer><button type="button" disabled={Boolean(busy)} onClick={()=>decide(ficha,'recusar')}>Recusar alterações</button><button type="button" disabled={Boolean(busy)} onClick={()=>decide(ficha,'aprovar')}>{busy===ficha.fichaId?'Salvando…':'Aprovar e aplicar'}</button></footer></article>;
 })}</section>;
}
