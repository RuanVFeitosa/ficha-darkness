import React from 'react';
import '../../styles/SanityStatic.css';

export function SanityZeroSymbol({resource,hopeResource,membros}){
 const current=Number(resource?.atual);
 const sanityZero=resource?.atual!=null && Number.isFinite(current) && current<=0;
 const hope=Number(hopeResource?.atual);
 const hopeZero=hopeResource?.atual!=null && Number.isFinite(hope) && hope<=0;
 const dying=['cabeca','torso'].some(key=>membros?.[key]?.atual!=null && Number.isFinite(Number(membros[key].atual)) && Number(membros[key].atual)<=0);
 if(!sanityZero && !hopeZero && !dying)return null;
 return <div className={`abs-sanity-zero-symbol${dying ? ' is-dying' : hopeZero && !sanityZero ? ' is-hopeless' : ''}`} aria-hidden="true"><img src="/simbolo-absoluto.png" alt=""/><img className="abs-sanity-symbol-echo" src="/simbolo-absoluto.png" alt=""/></div>;
}

export default function SanityStatic({resource,portrait=false}){
 const current=Number(resource?.atual),maximum=Number(resource?.max);
 if(!Number.isFinite(current)||!Number.isFinite(maximum)||maximum<=0||current>=maximum)return null;
 const loss=1-Math.max(0,current)/maximum;
 return <div aria-hidden="true" className={`abs-sanity-static${portrait?' is-portrait':''}${current<=0?' is-continuous':''}`} style={{'--static-cycle':`${14-12*loss}s`,'--static-strength':portrait ? .18+.3*loss : .07+.13*loss}}><span/></div>;
}
