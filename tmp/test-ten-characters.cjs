const fs=require('fs');let p='backend/jogador.integration.test.cjs',s=fs.readFileSync(p,'utf8');s=s.replace("  } finally { await new Promise(resolve => server.close(resolve)); }",`    const dez=Array.from({length:10},(_,i)=>({id:String(1000+i),sistema:i%2?'espiral':'darkness'}));
    assert.equal((await fetch(base+'/jogadores/1234',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,personagens:dez}})})).status,200);
    assert.equal((await fetch(base+'/jogadores/1234',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,personagens:[...dez,{id:'extra',sistema:'espiral'}]}})})).status,400);
    assert.equal((await (await fetch(base+'/jogadores/1234')).json()).jogador.personagens.length,10);
  } finally { await new Promise(resolve => server.close(resolve)); }`);fs.writeFileSync(p,s);
