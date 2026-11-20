import {useEffect,useState} from 'react';
import useSheetCampaigns from './useSheetCampaigns';
import {buscarFichaEspiral} from '../services/espiralApi';
import {buscarPersonagem} from '../services/personagemApi';

const canonical=id=>String(id || '').replace(/^darkness:/,'');
export default function useRelationshipMembers(sheetId,campaign,originalSheetId) {
  const primary=useSheetCampaigns(sheetId,campaign);
  const legacy=useSheetCampaigns(sheetId?.replace(/^espiral:/,''),campaign===undefined?undefined:null);
  const original=useSheetCampaigns(originalSheetId,campaign===undefined?undefined:null);
  const campaigns=[...primary,...legacy,...original];
  const selfIds=new Set([sheetId,sheetId?.replace(/^espiral:/,''),originalSheetId].filter(Boolean).map(canonical));
  const roster=new Map();
  for(const table of campaigns)for(const member of table.membros || []) {
    const id=String(member.ficha_id || '');
    if(!id || selfIds.has(canonical(id)) || member.papel==='mestre' || /^(inimigo|custom3d):/.test(id))continue;
    roster.set(canonical(id),{id:`party:${canonical(id)}`,sheetId:id,name:member.nome || 'Personagem',photo:member.fotoPerfil || member.profileImage || ''});
  }
  const signature=JSON.stringify([...roster.values()]);
  const [members,setMembers]=useState([]);
  useEffect(()=>{
    let active=true;
    const entries=JSON.parse(signature);
    setMembers(entries);
    const refresh=async()=>{
      const results=await Promise.allSettled(entries.map(async member=>{
        const espiral=member.sheetId.startsWith('espiral:');
        const id=member.sheetId.replace(/^(espiral|darkness):/,'');
        let sheet;
        try{sheet=espiral?await buscarFichaEspiral(id):await buscarPersonagem(id);}catch{}
        if(!sheet&&espiral){try{sheet=JSON.parse(localStorage.getItem(`espiral:sheet:v1:${id}`) || 'null');}catch{}}
        return {...member,name:sheet?.name || sheet?.nome || member.name,photo:sheet?.profileImage || sheet?.fotoPerfil || member.photo};
      }));
      if(active)setMembers(results.map((result,index)=>result.status==='fulfilled'?result.value:entries[index]));
    };
    refresh();window.addEventListener('focus',refresh);
    return ()=>{active=false;window.removeEventListener('focus',refresh);};
  },[signature]);
  return members;
}
