import React from 'react';
import '../../styles/HopeWhispers.css';

const messages=['O silêncio não traz respostas.','O caminho parece não ter fim.','Até a luz parece distante.','O peso de continuar…','Tudo parece tão longe.','As palavras se perdem.','O horizonte se apaga.'];

export default function HopeWhispers({resource,messages:customMessages}){
 const current=Number(resource?.atual);
 if(resource?.atual==null||!Number.isFinite(current)||current>0)return null;
 const selected=Array.isArray(customMessages) ? customMessages.filter(message=>typeof message==='string'&&message.trim()).slice(0,7) : [];
 return <div className="abs-hope-whispers" aria-hidden="true">{(selected.length?selected:messages).map((message,index)=><span key={`${index}-${message}`} style={{'--whisper-delay':`${index*3}s`}}>{message}</span>)}</div>;
}
