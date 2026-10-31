import {useEffect,useState} from 'react';
import {buscarPersonagem,solicitarRecriacao} from '../services/personagemApi';
export default function useRecriacao(sistema){
 const id=new URLSearchParams(window.location.search).get('refazer');
 const remoteId=sistema==='espiral' ? `espiral_${id}` : id;
 const [original,setOriginal]=useState(null),[erro,setErro]=useState('');
 useEffect(()=>{if(!id)return;let active=true;buscarPersonagem(remoteId).then(sheet=>{
   if(!active)return;
   if(!sheet || (sistema==='espiral' ? !sheet.name : !sheet.nome))throw new Error('Ficha não encontrada.');
   if(sheet.recriacaoPendente)throw new Error('Esta ficha já possui uma solicitação aguardando o mestre.');
   setOriginal(sheet);
 }).catch(error=>{if(active)setErro(error.message);});return()=>{active=false;};},[id,remoteId,sistema]);
 const enviar=async proposta=>{
   if(!original)throw new Error(erro || 'Aguarde o carregamento da ficha.');
   const saved=await solicitarRecriacao(remoteId,original,proposta);
   localStorage.setItem(sistema==='espiral'?`espiral:sheet:v1:${id}`:`fichaRPG_personagem_${id}`,JSON.stringify(saved));
   return saved;
 };
 return {id,original,erro,enviar,voltar:`/?sistema=${sistema}&ficha=${encodeURIComponent(id || '')}${sistema==='darkness'?`&senha=${encodeURIComponent(id || '')}`:''}`};
}
