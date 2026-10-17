import {paginasHabilidade} from './abilityPages';
// LCS limitado evita matrizes grandes em descrições extensas.
function sequenceDiff(a,b){
 let prefix=0;while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
 let suffix=0;while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
 const left=a.slice(prefix,a.length-suffix),right=b.slice(prefix,b.length-suffix),out=[];
 if(prefix)out.push({type:'equal',values:a.slice(0,prefix)});
 const push=(type,value)=>{if(out[out.length-1]?.type===type)out[out.length-1].values.push(value);else out.push({type,values:[value]});};
 if(left.length*right.length>250000){left.forEach(v=>push('remove',v));right.forEach(v=>push('add',v));}
 else{
  const dp=Array.from({length:left.length+1},()=>new Uint16Array(right.length+1));
  for(let i=left.length-1;i>=0;i--)for(let j=right.length-1;j>=0;j--)dp[i][j]=left[i]===right[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  let i=0,j=0;while(i<left.length||j<right.length){if(i<left.length&&j<right.length&&left[i]===right[j]){push('equal',left[i]);i++;j++;}else if(i<left.length&&(j===right.length||dp[i+1][j]>=dp[i][j+1]))push('remove',left[i++]);else push('add',right[j++]);}
 }
 if(suffix)out.push({type:'equal',values:a.slice(a.length-suffix)});return out;
}
function headingAt(text,line){let heading='';for(const item of text.split('\n').slice(0,line)){const match=item.match(/^\s*#{1,6}\s+(.+)/);if(match)heading=match[1];}return heading;}
function changedText(before,after){
 const a=before.split('\n'),b=after.split('\n'),chunks=sequenceDiff(a,b),changes=[];let oldLine=1,newLine=1;
 for(let i=0;i<chunks.length;i++){
  const part=chunks[i];if(part.type==='equal'){oldLine+=part.values.length;newLine+=part.values.length;continue;}
  const oldStart=oldLine,newStart=newLine;let removed=[],added=[];
  while(i<chunks.length&&chunks[i].type!=='equal'){const p=chunks[i];if(p.type==='remove'){removed.push(...p.values);oldLine+=p.values.length;}else{added.push(...p.values);newLine+=p.values.length;}i++;}i--;
  const tokenize=s=>s.match(/\s+|[\p{L}\p{N}_]+|[^\s]/gu)||[];
  const oldText=removed.join('\n'),newText=added.join('\n');let oldOffset=0,newOffset=0;
  for(const token of sequenceDiff(tokenize(oldText),tokenize(newText))){const text=token.values.join('');if(token.type!=='equal' && text.length){changes.push({type:token.type,text,line:token.type==='remove'?oldStart+(oldText.slice(0,oldOffset).match(/\n/g)||[]).length:newStart+(newText.slice(0,newOffset).match(/\n/g)||[]).length,section:token.type==='remove'?headingAt(before,oldStart+(oldText.slice(0,oldOffset).match(/\n/g)||[]).length):headingAt(after,newStart+(newText.slice(0,newOffset).match(/\n/g)||[]).length)});}if(token.type!=='add')oldOffset+=text.length;if(token.type!=='remove')newOffset+=text.length;}
 }
 return changes;
}
export function abilityEditChanges(current,proposal){
 const result=[];if(current.nome!==proposal.nome)result.push({location:'Nome da habilidade',changes:[{type:'remove',text:current.nome},{type:'add',text:proposal.nome}]});
 const oldPages=paginasHabilidade(current),newPages=paginasHabilidade(proposal),key=p=>JSON.stringify([p.titulo,p.conteudo,p.aparencia||{}]);
 const chunks=sequenceDiff(oldPages.map(key),newPages.map(key));let oi=0,ni=0;
 for(let i=0;i<chunks.length;i++){
  if(chunks[i].type==='equal'){oi+=chunks[i].values.length;ni+=chunks[i].values.length;continue;}
  let removed=0,added=0;while(i<chunks.length&&chunks[i].type!=='equal'){if(chunks[i].type==='remove')removed+=chunks[i].values.length;else added+=chunks[i].values.length;i++;}i--;
  for(let j=0;j<Math.max(removed,added);j++){
   const old=j<removed?oldPages[oi+j]:null,next=j<added?newPages[ni+j]:null;
   const page=(next?ni:oi)+j+1,title=next?.titulo||old?.titulo||'Sem título';
   const location='Página '+page+' · '+title;
   if(!old||!next){result.push({location,kind:old?'Página removida':'Página adicionada',changes:[{type:old?'remove':'add',text:(next||old).conteudo||'(página vazia)'}]});continue;}
   if(old.titulo!==next.titulo)result.push({location,kind:'Título da página',changes:[{type:'remove',text:old.titulo},{type:'add',text:next.titulo}]});
   const edits=changedText(old.conteudo,next.conteudo);if(edits.length)result.push({location,changes:edits});
   const labels={fonte:'Fonte',tamanho:'Tamanho do texto',alinhamento:'Alinhamento'},defaults={fonte:'mono',tamanho:13,alinhamento:'left'};
   for(const field of Object.keys(labels)){const from=old.aparencia?.[field]??defaults[field],to=next.aparencia?.[field]??defaults[field];if(from!==to)result.push({location,kind:labels[field],changes:[{type:'remove',text:String(from)},{type:'add',text:String(to)}]});}
  }
  oi+=removed;ni+=added;
 }
 return result;
}
