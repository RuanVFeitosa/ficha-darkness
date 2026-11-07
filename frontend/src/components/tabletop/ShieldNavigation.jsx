import React,{useState} from 'react';
import Icon from '@mdi/react';
import {mdiViewDashboardOutline,mdiImageOutline,mdiAccountGroupOutline,mdiFileDocumentMultipleOutline,mdiMusicBoxMultipleOutline,mdiBookOpenOutline} from '@mdi/js';

const definitions=[
 ['session','Sessão',mdiViewDashboardOutline,['session','dashboard']],
 ['rules','Regras',mdiBookOpenOutline,['reference','dice','optionalSystems','mechanics']],
 ['world','Cena',mdiImageOutline,['scenes','lighting','exploration','weather','background','flashlight']],
 ['archive','Arquivo',mdiFileDocumentMultipleOutline,['documents','notes','privateNotes']],
 ['audio','Áudio',mdiMusicBoxMultipleOutline,['audio','soundpad']],
 ['cast','Participantes',mdiAccountGroupOutline,['roster','tokens','players']],
];
export default function ShieldNavigation({tools,active,onChoose,children}) {
 const [recent,setRecent]=useState({});
 const known=new Set(definitions.flatMap(group=>group[3]));
 const groups=definitions.map(([id,label,icon,ids])=>({id,label,icon,tools:[...ids,...(id==='rules'?tools.filter(tool=>!known.has(tool.id)).map(tool=>tool.id):[])].map(id=>tools.find(tool=>tool.id===id)).filter(Boolean)})).filter(group=>group.tools.length);
 const current=groups.find(group=>group.tools.some(tool=>tool.id===active)) || groups[0];
 const choose=id=>{setRecent(previous=>({...previous,[current.id]:id}));onChoose(id);};
 return <div className="shield-organized-navigation">
 <div className="shield-navigation-row"><nav aria-label="Áreas do escudo" className="shield-area-tabs">{groups.map(group=><button key={group.id} type="button" aria-pressed={current.id===group.id} onClick={()=>onChoose(recent[group.id] || group.tools[0].id)}><Icon path={group.icon} size={.65} aria-hidden="true"/>{group.label}</button>)}</nav>{children}</div>
 <nav aria-label={'Ferramentas de '+current.label} className="shield-subnavigation">{current.tools.map(tool=><button key={tool.id} type="button" aria-pressed={active===tool.id} onClick={()=>choose(tool.id)}>{tool.label}</button>)}</nav>
 </div>;
}
