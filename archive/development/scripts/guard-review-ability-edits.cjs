const fs=require('fs'),p='frontend/src/pages/dashboardMestre.jsx';let s=fs.readFileSync(p,'utf8');const pos=s.indexOf('    const personagemAtualizado = structuredClone(personagemBase);',s.indexOf('const analisarHabilidadeCriada'));s=s.slice(0,pos)+`    if(habilidade.edicaoPendente || (habilidade.status || 'pendente')!=='pendente'){
      setMensagem('Esta solicitação mudou ou já foi analisada. Atualize o painel antes de continuar.');
      return;
    }
`+s.slice(pos);fs.writeFileSync(p,s);
