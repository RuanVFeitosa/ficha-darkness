const fs=require('fs');let p='frontend/src/components/CardHabilidadeRecolhivel.jsx',s=fs.readFileSync(p,'utf8');s=s.replace('    acao,','    acao,\n    onEditar,');s=s.replace('          {acao && (',`          {onEditar && <button type="button" className="habilidade-editar" disabled={habilidade.status!=='aprovada' || Boolean(habilidade.edicaoPendente)} onClick={onEditar} title={habilidade.edicaoPendente?'Aguarde a análise do mestre':'Solicitar edição ao mestre'}>Editar</button>}
          {acao && (`);s=s.replace('        <div id={descricaoId}',`        {habilidade.edicaoPendente && <p className="ability-edit-pending">Edição aguardando aprovação do mestre. Versão atual mantida.</p>}
        {!habilidade.edicaoPendente && habilidade.ultimaEdicao && <p className="ability-edit-pending">Última edição {habilidade.ultimaEdicao.status=== 'aprovada'?'aprovada':'recusada pelo mestre'}.</p>}
        <div id={descricaoId}`);fs.writeFileSync(p,s);
p='frontend/src/pages/fichaPersonagem.jsx';s=fs.readFileSync(p,'utf8');s="import AbilityEditDialog from '../components/AbilityEditDialog';\nimport {solicitarEdicaoHabilidade} from '../utils/abilityEdits';\n"+s;s=s.replace('  const [personagem, setPersonagem] = useState(estadoInicial);','  const [personagem, setPersonagem] = useState(estadoInicial);\n  const [habilidadeEditando,setHabilidadeEditando]=useState(null);');s=s.replace('  const calcularValorAtivo = (atributo, ativo) => {',`  async function enviarEdicaoHabilidade(draft){
    const base=await buscarPersonagem(fichaId);
    if(!base)throw new Error('Não foi possível consultar a ficha no servidor. Seu rascunho foi mantido.');
    const next=solicitarEdicaoHabilidade(base,habilidadeEditando.id,draft,crypto.randomUUID());
    const salvo=await salvarPersonagem(fichaId,next)||next;
    salvarLocalSeguro(storageKey,JSON.stringify(salvo));
    setPersonagem(salvo);
    notificarPersonagemAtualizado(fichaId,salvo);
  }
  const calcularValorAtivo = (atributo, ativo) => {`);
s=s.replace('classeExtra={`criada ${status}`}','classeExtra={`criada ${status}`}\n                          onEditar={()=>setHabilidadeEditando(habilidade)}');s=s.replace('<AbilityReadingLayout><div','<AbilityReadingLayout>{habilidadeEditando && <AbilityEditDialog key={habilidadeEditando.id} habilidade={habilidadeEditando} fichaId={fichaId} onSubmit={enviarEdicaoHabilidade} onClose={()=>setHabilidadeEditando(null)}/>}<div');fs.writeFileSync(p,s);
p='frontend/src/pages/dashboardMestre.jsx';s=fs.readFileSync(p,'utf8');s="import {decidirEdicaoHabilidade} from '../utils/abilityEdits';\n"+s;s=s.replace('(habilidade) => (habilidade.status || "pendente") === "pendente",','(habilidade) => (habilidade.status || "pendente") === "pendente" || Boolean(habilidade.edicaoPendente),');s=s.replace('async (ficha, habilidadeId, aprovar) => {','async (ficha, habilidadeId, aprovar,edicaoId) => {');
s=s.replace('    let personagemBase = ficha.personagem || {};',`    if(edicaoId){
      try{
        const base=await buscarPersonagem(ficha.fichaId);
        if(!base)throw new Error('Ficha indisponível.');
        const next=decidirEdicaoHabilidade(base,habilidadeId,aprovar,edicaoId);
        const salvo=await salvarPersonagem(ficha.fichaId,next)||next;
        salvarFichaLocal(ficha.fichaId,salvo);
        notificarPersonagemAtualizado(ficha.fichaId,salvo);
        setFichas(atuais=>atuais.map(item=>item.fichaId===ficha.fichaId?{...item,personagem:salvo}:item));
        if(fichaSelecionada===ficha.fichaId)setPersonagem(salvo);
        setMensagem(aprovar?'Edição aprovada. A nova versão está ativa.':'Edição recusada. A versão anterior e os recursos foram mantidos.');
      }catch(error){setMensagem(error.message||'Não foi possível analisar a edição. Tente novamente.');}
      return;
    }
    let personagemBase = ficha.personagem || {};`);
s=s.replace('key={habilidade.id}\r\n                      className="mestre-analise-card"','key={`${ficha.fichaId}:${habilidade.id}`}\r\n                      className="mestre-analise-card"');
s=s.replace('                      <h3>{habilidade.nome}</h3>\r\n                      <AbilityDocument habilidade={habilidade}/>',`                      <h3>{habilidade.edicaoPendente ? 'Solicitação de edição: '+habilidade.edicaoPendente.nome : habilidade.nome}</h3>
                      {habilidade.edicaoPendente ? <><p>Edição de habilidade existente · sem cobrança ou devolução de recursos.</p><details><summary>Ver versão atual: {habilidade.nome}</summary><AbilityDocument habilidade={habilidade}/></details><h4>Versão proposta</h4><AbilityDocument habilidade={habilidade.edicaoPendente}/></> : <AbilityDocument habilidade={habilidade}/>}`);
s=s.replace('analisarHabilidadeCriada(ficha, habilidade.id, true)','analisarHabilidadeCriada(ficha, habilidade.id, true,habilidade.edicaoPendente?.id)');s=s.replace('                              false,\r\n                            )','                              false,\r\n                              habilidade.edicaoPendente?.id,\r\n                            )');s=s.replace('                          Recusar e devolver custo','                          {habilidade.edicaoPendente ? "Recusar edição" : "Recusar e devolver custo"}');fs.writeFileSync(p,s);
