import React, { useState } from 'react';
import { prepararUso } from '../../utils/absolutoHabilidadeUso';
import '../../styles/AbilityUse.css';
export default function AbilityUseControls({habilidade,tipo='habilidade',personagem,onUse,onDeactivate}) {
 const [ocupado,setOcupado]=useState(false),[mensagem,setMensagem]=useState('');
 const uso=prepararUso(habilidade,tipo);
 const ativo=uso.passiva ? null : (personagem.efeitosHabilidadesAtivos||[]).find(efeito=>efeito.idUso===uso.idUso);
 const constante=uso.passiva && !uso.limiteUso;
 const bloqueada=constante || ocupado || (Number(personagem.esperanca?.atual)||0)<uso.custoAtivacao || Boolean(uso.limiteUso && personagem.usosHabilidades?.[uso.idUso]) || Boolean(habilidade.status && habilidade.status!=='aprovada');
 return <div className="ability-use-controls" onClick={e=>e.stopPropagation()}>
  <span>Uso · <strong>{uso.custoAtivacao} PE</strong>{uso.limiteUso && <small> · 1 por {uso.limiteUso}</small>}</span>
  <button type="button" disabled={ativo ? ocupado : bloqueada} aria-label={`${ativo ? "Desativar" : "Usar"} ${habilidade.nome}`} onClick={async()=>{setOcupado(true);setMensagem('');try{if(ativo) await onDeactivate(ativo.id); else await onUse(habilidade,tipo);}catch(error){setMensagem(error.message);}finally{setOcupado(false);}}}>{constante ? 'Sempre ativa' : ocupado ? 'Aplicando…' : ativo ? 'Desativar' : 'Usar'}</button>
  {bloqueada && !ativo && !constante && !ocupado && <small>{habilidade.status && habilidade.status!=='aprovada' ? 'Aguardando aprovação' : personagem.usosHabilidades?.[uso.idUso] ? 'Limite atingido' : 'PE insuficientes'}</small>}
  {uso.balanceamentoPassiva && <small>{constante ? 'Benefício situacional; verifique a condição na descrição.' : 'Uso gratuito; confirme a condição na mesa antes de registrar.'} Bônus de dados de passivas: máximo +1 por teste.</small>}
  {mensagem && <small role="status">{mensagem}</small>}
 </div>;
}
export function ActiveAbilityEffects({personagem,onEnd,onReset}) {
 const ativos=personagem.efeitosHabilidadesAtivos||[];
 return <section className="ability-active-effects" aria-label="Efeitos de habilidades"><header><strong>Efeitos e usos</strong><div>{[['cena','Nova cena'],['combate','Novo combate'],['sessao','Nova sessão']].map(([periodo,nome])=><button key={periodo} type="button" onClick={()=>onReset(periodo)}>{nome}</button>)}</div></header>{ativos.length ? ativos.map(efeito=><article key={efeito.id} className={efeito.ritoId || efeito.idUso?.startsWith("rito:") ? "ability-effect-rito" : undefined}><div><strong>{efeito.nome}</strong><small>{efeito.custo} PE · {efeito.duracao}</small></div><p>{efeito.descricao}</p>{efeito.aplicados.map((texto,i)=><small key={i}>Aplicado · {texto}</small>)}{efeito.pendente && <small className="ability-effect-pending">Resolver alvo, condições ou efeito narrativo com o mestre.</small>}<button type="button" onClick={()=>onEnd(efeito.id)}>Encerrar efeito</button></article>) : <p>Nenhum efeito ativo.</p>}</section>;
}
