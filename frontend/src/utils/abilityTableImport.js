export const TABLE_IMPORT_MAX_ROWS=101;
export const TABLE_IMPORT_MAX_COLUMNS=20;
export function normalizeImportedTable(rows){
 while(rows.length && rows[rows.length-1].every(v=>!String(v).trim()))rows.pop();
 if(!rows.length || rows.every(r=>r.every(v=>!String(v).trim())))throw new Error('Nenhuma tabela encontrada. Copie as células da tabela e cole aqui.');
 const width=Math.max(...rows.map(r=>r.length));
 if(rows.length>TABLE_IMPORT_MAX_ROWS || width>TABLE_IMPORT_MAX_COLUMNS)throw new Error('Importe até 100 linhas de dados e 20 colunas por tabela. Divida tabelas maiores entre páginas.');
 return rows.map(row=>Array.from({length:width},(_,i)=>String(row[i] ?? '').replace(/\r?\n/g,' ').trim()));
}
export function parseDelimitedTable(text,separator='auto'){
 text=String(text).replace(/^\uFEFF/,'');
 if(text.length>1000000)throw new Error('A tabela é muito grande. Importe um trecho menor.');
 if(separator==='auto'){
  const first=text.split(/\r?\n/)[0];separator=first.includes('\t')?'\t':(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 }
 const rows=[],row=[];let cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){if(quoted && text[i+1]==='"'){cell+='"';i++;}else if(quoted || !cell)quoted=!quoted;else cell+=char;}
  else if(!quoted && char===separator){row.push(cell);cell='';}
  else if(!quoted && (char==='\n'||char==='\r')){if(char==='\r' && text[i+1]==='\n')i++;row.push(cell);rows.push([...row]);row.length=0;cell='';}
  else cell+=char;
 }
 if(quoted)throw new Error('Há aspas sem fechamento na tabela. Confira o arquivo ou cole novamente.');
 row.push(cell);rows.push(row);return normalizeImportedTable(rows);
}
export function parseHtmlTables(html){
 const document=new DOMParser().parseFromString(html,'text/html');
 return Array.from(document.querySelectorAll('table')).filter(t=>!t.parentElement?.closest('table')).map(table=>{
  const grid=[];const rows=Array.from(table.querySelectorAll('tr')).filter(row=>row.closest('table')===table);
  if(rows.length>TABLE_IMPORT_MAX_ROWS)throw new Error('Importe até 100 linhas de dados e 20 colunas por tabela.');
  rows.forEach((tr,r)=>{grid[r] ||= [];let c=0;for(const cell of Array.from(tr.children).filter(el=>/^(TH|TD)$/.test(el.tagName))){while(grid[r][c]!==undefined)c++;const colspan=Math.max(1,Number(cell.getAttribute('colspan'))||1),rowspan=Math.max(1,Number(cell.getAttribute('rowspan'))||1);if(c+colspan>20 || r+rowspan>101)throw new Error('A tabela excede o limite de 100 linhas e 20 colunas.');const copy=cell.cloneNode(true);copy.querySelectorAll('script,style,table').forEach(el=>el.remove());copy.querySelectorAll('br').forEach(el=>el.replaceWith(' '));for(let y=0;y<rowspan;y++){grid[r+y] ||= [];for(let x=0;x<colspan;x++)grid[r+y][c+x]=x===0 && y===0?copy.textContent:'';}c+=colspan;}});
  return normalizeImportedTable(grid);
 });
}
export function importedTableModel(rows,hasHeader=true){
 const width=rows[0].length;return {start:0,end:0,header:hasHeader?rows[0]:Array.from({length:width},(_,i)=>'Coluna '+(i+1)),align:Array(width).fill('left'),rows:(hasHeader?rows.slice(1):rows).length?(hasHeader?rows.slice(1):rows):[Array(width).fill('')]};
}
