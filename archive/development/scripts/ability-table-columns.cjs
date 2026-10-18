const fs=require('fs'),r='frontend/src/';
fs.writeFileSync(r+'utils/abilityTables.js',`// Localiza a tabela Markdown mais próxima do cursor, fora de blocos de código.
export function expandAbilityTable(content, cursor, kind) {
 const lines=content.split('\\n'),tables=[];let fenced=false;
 for(let i=0;i<lines.length;i++) {
  if(/^\\s*\x60\x60\x60/.test(lines[i])){fenced=!fenced;continue;}
  if(fenced || !lines[i].includes('|') || !/^\\s*\\|?\\s*:?-{3,}/.test(lines[i+1] || ''))continue;
  const start=i;let end=i+2;while(end<lines.length && lines[end].includes('|') && lines[end].trim())end++;
  tables.push({start,end});i=end-1;
 }
 if(!tables.length)return null;
 const row=content.slice(0,cursor).split('\\n').length-1;
 const table=tables.reduce((best,t)=>{const distance=t=>row<t.start?t.start-row:row>=t.end?row-t.end+1:0;return distance(t)<distance(best)?t:best;});
 const cells=line=>line.trim().replace(/^\\|/,'').replace(/\\|$/,'').split(/(?<!\\\\)\\|/).map(cell=>cell.trim());
 const columns=cells(lines[table.start]).length;
 if(kind==='column')for(let i=table.start;i<table.end;i++){const values=cells(lines[i]);while(values.length<columns)values.push('');values.push(i===table.start?'Nova coluna':i===table.start+1?'---':'');lines[i]='| '+values.join(' | ')+' |';}
 else lines.splice(table.end,0,'| '+Array(columns).fill('').join(' | ')+' |');
 return lines.join('\\n');
}
`);
let p=r+'components/AbilityPageEditor.jsx',s=fs.readFileSync(p,'utf8');s="import {expandAbilityTable} from '../utils/abilityTables';\n"+s;
s=s.replace("[modo,setModo]=useState('dividido')","[modo,setModo]=useState('dividido'),[aviso,setAviso]=useState('')");
s=s.replace(' return <section',` function expandirTabela(tipo){
  const novo=expandAbilityTable(pagina.conteudo,input.current?.selectionStart ?? pagina.conteudo.length,tipo);
  if(novo===null){setAviso('Insira uma tabela primeiro. Para escolher entre tabelas, posicione o cursor dentro dela.');return;}
  if(novo.length>ABILITY_PAGE_LIMIT || total-pagina.conteudo.length+novo.length>ABILITY_TOTAL_LIMIT){setAviso('Limite de caracteres atingido. Crie uma nova página para continuar.');return;}
  setAviso('');editar({conteudo:novo});
 }
 return <section`);
s=s.replace('>+ Tabela</button>','>+ Tabela</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>expandirTabela(\'column\')}>+ Coluna</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>expandirTabela(\'row\')}>+ Linha</button>');
s=s.replace('  <label>Título da página','  {aviso && <p role="status">{aviso}</p>}\n  <label>Título da página');
fs.writeFileSync(p,s);
