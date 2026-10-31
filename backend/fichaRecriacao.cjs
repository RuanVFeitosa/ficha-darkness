const {randomUUID}=require('node:crypto');
const fields={
 darkness:['nome','pronome','classe','classeId','arquetipoId','arquetipo','classeDetalhes','classeEspecialidade','fotoPerfil','atributos','dominios','humanidade','existencia'],
 espiral:['name','player','pronoun','occupation','age','vertente','profileImage','attributes','resources','purpose'],
};
const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
function error(message,status=400){const e=new Error(message);e.status=status;throw e;}
function propose(current,body){
 const system=current.attributes ? 'espiral':'darkness';
 if (!current[system==='espiral'?'name':'nome']) error('Ficha não encontrada.',404);
 if(current.recriacaoPendente) error('Esta ficha já possui uma solicitação pendente.',409);
 if(!body.base || !body.proposta) error('Envie a ficha original e a proposta.');
 const changes={};
 for(const key of fields[system]) if(Object.hasOwn(body.proposta,key) && !equal(body.base[key],body.proposta[key])) changes[key]={antes:current[key]??null,depois:body.proposta[key]};
 if(!Object.keys(changes).length) error('Nenhuma alteração foi feita.');
 const name=body.proposta[system==='espiral'?'name':'nome'];
 if(typeof name!=='string'||!name.trim()||name.length>120) error('Nome inválido.');
 const group=body.proposta[system==='espiral'?'attributes':'atributos'];
 if(!group||Object.values(group).some(v=>!Number.isInteger(v)||v<0||v>5)) error('Atributos inválidos.');
 const training=body.proposta[system==='espiral'?'resources':'dominios'];
 if(!training||Object.values(training).some(v=>!Number.isInteger(v)||v<0||v>(system==='espiral'?4:5)))error('Recursos ou Domínios inválidos.');
 return {...current,recriacaoPendente:{id:randomUUID(),sistema:system,criadoEm:new Date().toISOString(),alteracoes:changes}};
}
function decide(current,body){
 const pending=current.recriacaoPendente;
 if(!pending||pending.id!==body.solicitacaoId) error('Solicitação já analisada ou alterada. Atualize o painel.',409);
 if(!['aprovar','recusar'].includes(body.acao)) error('Decisão inválida.');
 let next={...current};
 if(body.acao==='aprovar'){
  for(const [key,change] of Object.entries(pending.alteracoes)){
   if(!fields[pending.sistema].includes(key)) error('Campo inválido.');
   if(!equal(current[key],change.antes)) error('A ficha mudou após a solicitação. Recuse e peça uma nova proposta.',409);
   next[key]=change.depois;
  }
  if(pending.sistema==='espiral'){
   next.nome=next.name;
   if(pending.alteracoes.attributes){const max=25+Number(next.attributes.pulso)*5,oldMax=25+Number(current.attributes.pulso)*5,oldValue=Number.isFinite(Number(current.integrity))?Number(current.integrity):oldMax;next.integrity=Math.max(0,Math.min(max,max-Math.max(0,oldMax-oldValue)));}
  } else if(pending.alteracoes.atributos){
   const fort=Number(next.atributos.fonitude)||0,will=Number(next.atributos.vontade)||0;
   const recalc=(old,max)=>({...old,max,atual:Math.max(0,Math.min(max,max-((Number(old?.max)||0)-(Number(old?.atual)||0))))});
   next.sanidade=recalc(current.sanidade,12+will*2+(Number(current.ajustesRecursosV1?.sanidade)||0));
   next.esperanca=recalc(current.esperanca,6+will+(Number(current.ajustesRecursosV1?.esperanca)||0));
   const regions={cabeca:[3,1],pescoco:[2,1],torso:[8,2],abdomen:[6,1],bracoDireito:[4,1],bracoEsquerdo:[4,1],pernaDireita:[5,1],pernaEsquerda:[5,1]};
   next.membros={...current.membros};for(const [key,[base,factor]] of Object.entries(regions))next.membros[key]=recalc(current.membros?.[key],base+fort*factor);
  }
  next.revisaoRecriacao=(Number(current.revisaoRecriacao)||0)+1;
 }
 next.historicoRecriacao=[...(current.historicoRecriacao||[]),{...pending,decisao:body.acao,analisadoEm:new Date().toISOString()}].slice(-10);
 next.recriacaoPendente=null;
 return next;
}
module.exports={propose,decide};
