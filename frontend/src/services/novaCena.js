import {buscarPersonagem,salvarPersonagem} from './personagemApi';
import {notificarPersonagemAtualizado} from './syncEvents';
import {resetarEfeitosCena} from '../utils/novaCena';

export async function iniciarNovaCena(membros) {
 const ids=[...new Set((membros||[]).map(m=>m.ficha_id).filter(Boolean))];
 if(!ids.length) throw new Error('Nenhuma ficha vinculada à campanha.');
 const marco=new Date().toISOString();
 const resultados=await Promise.allSettled(ids.map(async id=>{
  const atual=await buscarPersonagem(id);
  if(!atual) throw new Error(`Ficha ${id} não encontrada.`);
  const proximo=resetarEfeitosCena(atual,marco);
  const salvo=await salvarPersonagem(id,proximo);
  notificarPersonagemAtualizado(id,salvo||proximo);
 }));
 const falhas=resultados.flatMap((r,i)=>r.status==='rejected'?[ids[i]]:[]);
 if(falhas.length) throw new Error(`Nova cena aplicada a ${ids.length-falhas.length} fichas. Falha nas fichas: ${falhas.join(', ')}. Tente novamente.`);
 return ids.length;
}
