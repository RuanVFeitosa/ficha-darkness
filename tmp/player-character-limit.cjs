const fs=require('fs');let p='backend/server.js',s=fs.readFileSync(p,'utf8');s=s.replace('      if (!jogador || (jogador.fotoPerfil',`      if(Array.isArray(jogador?.personagens) && jogador.personagens.length>10)return sendJson({req,res,statusCode:400,payload:{error:'O perfil permite no máximo 10 personagens.'}});
      if (!jogador || (jogador.fotoPerfil`);s=s.replace('jogador.personagens.length > 100','jogador.personagens.length > 10');fs.writeFileSync(p,s);
p='frontend/src/services/jogadorApi.js';s=fs.readFileSync(p,'utf8');s="import {validateCharacterLimit,PLAYER_CHARACTER_LIMIT} from '../utils/playerCharacters';\n"+s;s=s.replace("    perfil = await salvarJogador(codigo, { ...perfil, personagens });","    validateCharacterLimit(personagens);\n    perfil = await salvarJogador(codigo, { ...perfil, personagens });");s=s.replace('  const chave = `darkness:jogador:pendentes:${codigo}`;',"  await verificarVagaPersonagem(id,sistema);\n  const chave = `darkness:jogador:pendentes:${codigo}`;");s+=`
export async function verificarVagaPersonagem(id,sistema){
 const codigo=sessionStorage.getItem('darkness:jogador');if(!codigo)return;
 const perfil=await buscarJogador(codigo);if(!perfil)return;
 const pendentes=JSON.parse(localStorage.getItem('darkness:jogador:pendentes:'+codigo)||'[]');
 const refs=[...new Map([...(perfil.personagens||[]),...pendentes].map(ref=>[fichaKey(ref),ref])).values()];
 if(!refs.some(ref=>String(ref.id)===String(id)&&ref.sistema===sistema)&&refs.length>=PLAYER_CHARACTER_LIMIT)throw new Error('O perfil permite no máximo 10 personagens.');
}
`;fs.writeFileSync(p,s);
p='frontend/src/pages/cadastroPersonagem.jsx';s=fs.readFileSync(p,'utf8').replace('import { vincularAoJogadorAtivo }','import { vincularAoJogadorAtivo, verificarVagaPersonagem }');s=s.replace('const id=sheet.codigoFicha; if(localStorage','const id=sheet.codigoFicha; await verificarVagaPersonagem(id,"espiral"); if(localStorage');fs.writeFileSync(p,s);
p='frontend/src/pages/criarPersonagem.jsx';s=fs.readFileSync(p,'utf8').replace('import { vincularAoJogadorAtivo }','import { vincularAoJogadorAtivo, verificarVagaPersonagem }');const pos=s.indexOf('        : await criarPersonagem(fichaInicial);');if(pos<0)throw Error('criação não localizada');const start=s.lastIndexOf('      const ',pos);console.log(s.slice(start,pos+48));fs.writeFileSync(p,s);
