// Localiza a tabela Markdown mais próxima do cursor, fora de blocos de código.
export function expandAbilityTable(content, cursor, kind) {
 const lines=content.split('\n'),tables=[];let fenced=false;
 for(let i=0;i<lines.length;i++) {
  if(/^\s*```/.test(lines[i])){fenced=!fenced;continue;}
  if(fenced || !lines[i].includes('|') || !/^\s*\|?\s*:?-{3,}/.test(lines[i+1] || ''))continue;
  const start=i;let end=i+2;while(end<lines.length && lines[end].includes('|') && lines[end].trim())end++;
  tables.push({start,end});i=end-1;
 }
 if(!tables.length)return null;
 const row=content.slice(0,cursor).split('\n').length-1;
 const table=tables.reduce((best,t)=>{const distance=t=>row<t.start?t.start-row:row>=t.end?row-t.end+1:0;return distance(t)<distance(best)?t:best;});
 const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(cell=>cell.trim());
 const columns=cells(lines[table.start]).length;
 if(kind==='column')for(let i=table.start;i<table.end;i++){const values=cells(lines[i]);while(values.length<columns)values.push('');values.push(i===table.start?'Nova coluna':i===table.start+1?'---':'');lines[i]='| '+values.join(' | ')+' |';}
 else lines.splice(table.end,0,'| '+Array(columns).fill('').join(' | ')+' |');
 return lines.join('\n');
}
export function readAbilityTables(content) {
 const lines=content.split('\n'),tables=[];let fence=false;
 const cells=line=>line.trim().replace(/^\|/,'').replace(/(?<!\\)\|$/,'').split(/(?<!\\)\|/).map(s=>s.replace(/^ /,'').replace(/ $/,'').replace(/\\\|/g,'|'));
 for(let i=0;i<lines.length;i++){
  if(/^\s*(```|~~~)/.test(lines[i])){fence=!fence;continue;}
  if(fence || !lines[i].includes('|') || !/^\s*\|?\s*:?-{3,}/.test(lines[i+1]||''))continue;
  const start=i,header=cells(lines[i]),separator=cells(lines[i+1]);let end=i+2;
  while(end<lines.length && lines[end].trim() && lines[end].includes('|'))end++;
  const rows=lines.slice(i+2,end).map(cells).map(row=>Array.from({length:header.length},(_,c)=>row[c]||''));
  const align=header.map((_,c)=>/^:.*:$/.test(separator[c])?'center':/:$/.test(separator[c])?'right':'left');
  tables.push({start,end,header,rows,align});i=end-1;
 }
 return tables;
}
export function writeAbilityTable(content,table) {
 const clean=value=>String(value).replace(/\r?\n/g,' ').replace(/\|/g,'\\|');
 const line=cells=>'| '+cells.map(clean).join(' | ')+' |';
 const output=[line(table.header),line(table.align.map(a=>a==='center'?':---:':a==='right'?'---:':'---')),...table.rows.map(line)];
 const lines=content.split('\n');lines.splice(table.start,table.end-table.start,...output);return lines.join('\n');
}
