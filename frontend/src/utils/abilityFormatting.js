export function formatAbilitySelection(text,start,end,command) {
 const selected=text.slice(start,end);let replacement=selected,offset=0;
 const wrappers={bold:'**',italic:'*',underline:'++',strike:'~~',code:'`'};
 if(wrappers[command]){const marker=wrappers[command];if(start>=marker.length && text.slice(start-marker.length,start)===marker && text.slice(end,end+marker.length)===marker){return {text:text.slice(0,start-marker.length)+selected+text.slice(end+marker.length),start:start-marker.length,end:end-marker.length};}replacement=marker+(selected||'texto')+marker;offset=marker.length;}
 else if(command==='link'){replacement='['+(selected||'texto do link')+'](https://)';offset=1;}
 else if(command==='image'){replacement='!['+(selected||'Descrição da imagem')+'](https://)';offset=2;}
 else {const lineStart=text.lastIndexOf('\n',start-1)+1;const next=text.indexOf('\n',end);const lineEnd=next<0?text.length:next;start=lineStart;end=lineEnd;const block=text.slice(start,end);replacement=block.split('\n').map((line,i)=>{const clean=line.replace(/^(#{1,3} |[-*] |\d+\. |> |\- \[[ x]\] )/,'');return command==='bullet'?'- '+clean:command==='numbered'?(i+1)+'. '+clean:command==='check'?'- [ ] '+clean:command==='quote'?'> '+clean:command==='normal'?clean:command==='clear'?clean.replace(/\*\*|\+\+|~~|`/g,''):command.startsWith('h')?'#'.repeat(Number(command.slice(1)))+' '+clean:line;}).join('\n');}
 return {text:text.slice(0,start)+replacement+text.slice(end),start:start+offset,end:start+replacement.length-offset};
}
// Sublinhado seguro: converte ++texto++ em nós, sem executar HTML do usuário.
export function remarkAbilityUnderline(){return tree=>{function walk(node){if(!node.children || node.type==='code' || node.type==='inlineCode')return;node.children=node.children.flatMap(child=>{if(child.type!=='text'){walk(child);return [child];}const parts=child.value.split(/\+\+([^\n]+?)\+\+/g);return parts.map((value,i)=>i%2?{type:'abilityUnderline',data:{hName:'u'},children:[{type:'text',value}]}:{type:'text',value});});}walk(tree);};}
export const ABILITY_FONTS={mono:'"Courier New", monospace',serif:'Georgia, serif',sans:'Arial, sans-serif'};
export function abilityPageStyle(page={}){const a=page.aparencia||{};return {fontFamily:ABILITY_FONTS[a.fonte]||ABILITY_FONTS.mono,fontSize:Math.max(10,Math.min(24,Number(a.tamanho)||13))+'px',textAlign:['left','center','right','justify'].includes(a.alinhamento)?a.alinhamento:'left'};}
