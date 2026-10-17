import {remarkAbilityUnderline,abilityPageStyle} from '../utils/abilityFormatting';
import React,{useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {paginasHabilidade} from '../utils/abilityPages';
import '../CSS/AbilityStudio.css';
export default function AbilityDocument({habilidade}) {
 const paginas=paginasHabilidade(habilidade),[indice,setIndice]=useState(0),atual=Math.min(indice,paginas.length-1);
 return <div className="ability-document" style={abilityPageStyle(paginas[atual])}>
  {paginas.length>1 && <nav className="ability-page-nav" aria-label="Páginas da habilidade"><button type="button" disabled={atual===0} onClick={()=>setIndice(atual-1)}>←</button><span>Página {atual+1} de {paginas.length}</span><button type="button" disabled={atual===paginas.length-1} onClick={()=>setIndice(atual+1)}>→</button></nav>}
  {habilidade.paginas?.length>0 && <h4>{paginas[atual]?.titulo}</h4>}
  <ReactMarkdown remarkPlugins={[remarkGfm,remarkAbilityUnderline]} skipHtml components={{table:({node,...props})=><div className="ability-table-scroll"><table {...props}/></div>}}>{paginas[atual]?.conteudo || 'Sem conteúdo.'}</ReactMarkdown>
 </div>;
}