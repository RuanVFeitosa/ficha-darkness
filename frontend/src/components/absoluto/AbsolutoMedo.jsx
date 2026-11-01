import { renovarUsos } from '../../utils/absolutoHabilidadeUso';
import NumberInput from '../ui/NumberInput';
import React, { useEffect, useRef } from 'react';
import { alterarMedo, descansar } from '../../data/absolutoV1';
import '../../styles/AbsolutoMedo.css';

// Seis marcas visuais; ações e efeitos continuam usando as regras de Medo.
export default function AbsolutoMedo({ personagem, setPersonagem }) {
  const medo = Number(personagem.medo) || 0;
  const estado = medo < 3 ? 'Alerta' : medo < 5 ? 'Abalado' : 'Aterrorizado';
  const hoje = new Date().toLocaleDateString('en-CA');
  const detalhes = useRef(null);
  useEffect(() => {
    const fecharFora = event => {
      if (detalhes.current?.open && !detalhes.current.contains(event.target)) detalhes.current.open = false;
    };
    document.addEventListener('pointerdown', fecharFora);
    return () => document.removeEventListener('pointerdown', fecharFora);
  }, []);
  return <div className="barra-recurso-rpg medo-barra">
    <div className="abs-fear-header"><span>III / MEDO</span><div><button type="button" aria-label="Diminuir Medo" onClick={()=>setPersonagem(p=>alterarMedo(p,-1))}>−</button><NumberInput hideArrows aria-label="Medo atual" min="0" max="6" value={medo} onChange={event=>{if(event.target.value!==''){const value=Number(event.target.value)||0;setPersonagem(p=>alterarMedo(p,value-(Number(p.medo)||0)));}}}/><span>/ 6</span><button type="button" aria-label="Aumentar Medo" onClick={()=>setPersonagem(p=>alterarMedo(p,1))}>+</button></div></div>
    <div className="abs-fear-seals" role="group" aria-label="Seis marcas de Medo">{Array.from({length:6},(_,index)=><button type="button" key={index} aria-label={`Definir Medo em ${index+1}`} aria-pressed={medo>=index+1} className={medo>=index+1 ? 'is-filled' : ''} onClick={()=>setPersonagem(p=>alterarMedo(p,index+1-(Number(p.medo)||0)))}><svg viewBox="0 0 44 52" aria-hidden="true"><path d="M22 3 41 26 22 49 3 26Z"/><path d="M22 13 32 26 22 39 12 26Z"/></svg><span>{index===5 ? 'VI' : ['I','II','III','IV','V'][index]}</span></button>)}</div>
    <details className="medo-regras" ref={detalhes} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); detalhes.current.open = false; detalhes.current.querySelector('summary').focus(); } }}>
      <summary><span>{estado}</span><span className="medo-resumo-extra">{medo===6 ? 'Ruptura · VI' : 'Efeitos e ações'}<span aria-hidden="true"> ↗</span></span></summary>
      <section className="medo-painel" aria-label="Efeitos e ações de Medo">
        <header><div><small>ESTADO EMOCIONAL</small><h3>{estado} <span>{medo}/6</span></h3></div><button type="button" className="medo-fechar" aria-label="Fechar ações de Medo" onClick={() => { detalhes.current.open = false; detalhes.current.querySelector('summary').focus(); }}>×</button></header>
        <p className="medo-efeito">{medo < 3 ? 'Você permanece alerta, sem penalidade nos testes.' : '−1 dado nos testes diretamente contra a fonte do Medo.'}{medo === 5 && ' Aproximar-se exige 1 Esperança ou o teste definido pelo Narrador.'}</p>
        <div className={`medo-ruptura ${personagem.rupturaNaCena ? 'usada' : ''}`}><strong>{medo===6 ? 'Ruptura · Medo VI' : 'Ao atingir VI · Ruptura'}</strong><p>{'Ao chegar a VI, perde 5 de Sanidade. O Medo permanece em VI até ser reduzido, sem bloqueio por cena.'}</p></div>
        <div className="medo-acoes" aria-label="Ajustar Medo">
          <button type="button" aria-label="+2 Medo" onClick={() => setPersonagem(p => alterarMedo(p, 2))}><strong>+2 Medo</strong><small>Acontecimento aterrorizante</small></button>
          <button type="button" aria-label="+3 Medo" onClick={() => setPersonagem(p => alterarMedo(p, 3))}><strong>+3 Medo</strong><small>Horror extremo</small></button>
          <button type="button" onClick={() => setPersonagem(p => alterarMedo(p, -2))}><strong>Alcançar segurança</strong><small>−2 Medo</small></button>
          <button type="button" aria-label="Nova cena" onClick={() => setPersonagem(p => ({ ...renovarUsos(p,'cena'), rupturaNaCena: false, esperancaNaCena: false }))}><strong>Nova cena</strong><small>Renova os usos por cena</small></button>
        </div>
        <details className="medo-recuperacao"><summary>Recuperação e sessão</summary><div className="medo-acoes">
          <button type="button" onClick={() => setPersonagem(p => descansar(p))}><strong>Descanso seguro · 6h</strong><small>+2 Esperança · Medo volta a 0</small></button>
          <button type="button" disabled={personagem.ultimaRecuperacaoSanidade === hoje} onClick={() => setPersonagem(p => ({ ...p, ultimaRecuperacaoSanidade: hoje, sanidade: { ...p.sanidade, atual: Math.min(p.sanidade.max, p.sanidade.atual + 1) } }))}><strong>Repouso seguro · 1 dia</strong><small>+1 Sanidade · uma vez por dia</small></button>
          <button type="button" disabled={personagem.esperancaNaCena || personagem.esperancaNarrativaSessao >= 2} onClick={() => setPersonagem(p => ({ ...p, esperancaNaCena: true, esperancaNarrativaSessao: (p.esperancaNarrativaSessao || 0) + 1, esperanca: { ...p.esperanca, atual: Math.min(p.esperanca.max, p.esperanca.atual + 1) } }))}><strong>Recompensa narrativa</strong><small>+1 Esperança · {personagem.esperancaNarrativaSessao || 0}/2 nesta sessão</small></button>
          <button type="button" onClick={() => setPersonagem(p => ({ ...renovarUsos(p,'sessao'), esperancaNarrativaSessao: 0, esperancaNaCena: false }))}><strong>Nova sessão</strong><small>Renova recompensas narrativas</small></button>
        </div></details>
      </section>
    </details>
  </div>;
}
