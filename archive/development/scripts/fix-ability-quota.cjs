const fs=require('fs'),p='frontend/src/pages/upgradeNivel.jsx';let s=fs.readFileSync(p,'utf8');s="import {persistirEnvioHabilidade,carregarRascunhoHabilidade,salvarRascunhoHabilidade} from '../services/abilitySubmission';\n"+s;s=s.replace('useMemo, useState','useMemo, useState, useRef');s=s.replace('  const [novaHabilidade, setNovaHabilidade]', '  const enviandoRef=useRef(false);\n  const [enviandoHabilidade,setEnviandoHabilidade]=useState(false);\n  const [avisoRascunho,setAvisoRascunho]=useState(false);\n  const [novaHabilidade, setNovaHabilidade]');
s=s.replace('try {const salvo=JSON.parse(localStorage.getItem(`darkness:ability-draft:${obterFichaIdDaUrl()}`) || "null");if(salvo && typeof salvo.nome==="string" && typeof salvo.descricao==="string")return salvo;} catch {}','const salvo=carregarRascunhoHabilidade(`darkness:ability-draft:${obterFichaIdDaUrl()}`);if(salvo)return salvo;');
s=s.replace('useEffect(()=>{try{localStorage.setItem(`darkness:ability-draft:${fichaId}`,JSON.stringify(novaHabilidade));}catch{}},[fichaId,novaHabilidade]);','useEffect(()=>{setAvisoRascunho(!salvarRascunhoHabilidade(`darkness:ability-draft:${fichaId}`,novaHabilidade));},[fichaId,novaHabilidade]);');
s=s.replace('const enviarHabilidadeParaAnalise = async () => {','const enviarHabilidadeParaAnalise = async () => {\n    if(enviandoRef.current)return;');
const a=s.indexOf('    setPersonagem(atualizado);',s.indexOf('const enviarHabilidadeParaAnalise'));const b=s.indexOf('\n  };',a);
s=s.slice(0,a)+`    enviandoRef.current=true;setEnviandoHabilidade(true);
    try {
      const resultado=await persistirEnvioHabilidade(fichaId,atualizado,storageKey);
      setPersonagem(resultado.personagem);
      notificarPersonagemAtualizado(fichaId,resultado.personagem);
      setNovaHabilidade({tipo,nome:'',descricao:'',custo:10,recurso:tipo==='habilidade'?'evolucao':'sanidade'});
      mostrarNotificacao(resultado.remoto ? 'Habilidade enviada para análise do mestre.'+(resultado.local?'':' Salva no servidor; o cache deste navegador está cheio.') : 'Habilidade salva neste dispositivo. O servidor está indisponível; o envio ao mestre ainda não foi confirmado.',resultado.remoto?'sucesso':'aviso');
    } catch(error) {
      mostrarNotificacao(error.message,'erro');
    } finally {enviandoRef.current=false;setEnviandoHabilidade(false);}
`+s.slice(b);
s=s.replace('<AbilityPageEditor value={novaHabilidade} onChange={setNovaHabilidade}/>','{avisoRascunho && <p role="status">Não há espaço para salvar o rascunho neste navegador. Mantenha esta aba aberta até concluir o envio.</p>}<AbilityPageEditor value={novaHabilidade} onChange={setNovaHabilidade}/>');
s=s.replace('className="upgrade-confirmar" onClick={enviarHabilidadeParaAnalise}>Enviar para análise ({novaHabilidade.custo})','className="upgrade-confirmar" disabled={enviandoHabilidade} onClick={enviarHabilidadeParaAnalise}>{enviandoHabilidade ? "Enviando…" : `Enviar para análise (${novaHabilidade.custo})`}');fs.writeFileSync(p,s);
