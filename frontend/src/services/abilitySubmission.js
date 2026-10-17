import {salvarPersonagem} from './personagemApi';
// Falha do cache do navegador não pode impedir uma gravação no servidor.
export async function persistirEnvioHabilidade(fichaId,personagem,storageKey){
 let salvo=personagem,remoto=false,local=false,erroRemoto;
 try{salvo=await salvarPersonagem(fichaId,personagem)||personagem;remoto=true;}catch(error){erroRemoto=error;}
 try{localStorage.setItem(storageKey,JSON.stringify(salvo));local=true;}catch{/* Mantém as outras fichas e arquivos intactos. */}
 if(!remoto && !local){const erro=new Error('Não foi possível salvar: o armazenamento do navegador está cheio e o servidor não respondeu. Seu rascunho foi mantido. Tente enviar novamente.');erro.cause=erroRemoto;throw erro;}
 return {personagem:salvo,remoto,local};
}
export function carregarRascunhoHabilidade(key){
 for(const tipo of ['sessionStorage','localStorage']){try{const raw=window[tipo].getItem(key);if(raw){const value=JSON.parse(raw);if(typeof value.nome==='string' && typeof value.descricao==='string')return value;}}catch{}}
 return null;
}
export function salvarRascunhoHabilidade(key,value){
 const raw=JSON.stringify(value);
 try{localStorage.setItem(key,raw);try{sessionStorage.removeItem(key);}catch{}return true;}catch{}
 try{sessionStorage.setItem(key,raw);return true;}catch{return false;}
}
