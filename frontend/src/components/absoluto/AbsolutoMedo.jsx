import NumberInput from '../ui/NumberInput';
import React, { useEffect, useRef } from 'react';
import { alterarMedo, descansar } from '../../data/absolutoV1';

// Reutiliza a barra e os controles de recurso existentes da ficha.
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
    <div className="barra-rpg-header"><span className="barra-rpg-label">Medo</span>
      <button type="button" className="barra-btn barra-btn-menos" aria-label="Diminuir Medo" onClick={() => setPersonagem(p => alterarMedo(p, -1))}>−</button>
      <span className="barra-rpg-valores"><NumberInput aria-label="Medo atual" className="barra-rpg-input atual" type="number" min="0" max="6" value={medo} onChange={e => { const valor = Number(e.target.value) || 0; setPersonagem(p => alterarMedo(p, valor - (Number(p.medo) || 0))); }} /><span className="barra-rpg-sep">/ 6</span></span>
      <button type="button" className="barra-btn barra-btn-mais" aria-label="Aumentar Medo" onClick={() => setPersonagem(p => alterarMedo(p, 1))}>+</button>
    </div>
    <div className="barra-rpg-track"><div className="barra-rpg-fill esperanca-fill" style={{ width: `${medo / 6 * 100}%` }} /></div>
    <details className="medo-regras" ref={detalhes} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); detalhes.current.open = false; detalhes.current.querySelector('summary').focus(); } }}>
      <summary><span>{estado}</span><span className="medo-resumo-extra">{personagem.rupturaNaCena ? 'Ruptura nesta cena' : 'Efeitos e ações'}<span aria-hidden="true"> ↗</span></span></summary>
      <section className="medo-painel" aria-label="Efeitos e ações de Medo">
        <header><div><small>ESTADO EMOCIONAL</small><h3>{estado} <span>{medo}/6</span></h3></div><button type="button" className="medo-fechar" aria-label="Fechar ações de Medo" onClick={() => { detalhes.current.open = false; detalhes.current.querySelector('summary').focus(); }}>×</button></header>
        <p className="medo-efeito">{medo < 3 ? 'Você permanece alerta, sem penalidade nos testes.' : '−1 dado nos testes diretamente contra a fonte do Medo.'}{medo === 5 && ' Aproximar-se exige 1 Esperança ou o teste definido pelo Narrador.'}</p>
        <div className={`medo-ruptura ${personagem.rupturaNaCena ? 'usada' : ''}`}><strong>{personagem.rupturaNaCena ? 'Ruptura já ocorreu nesta cena' : 'Ao atingir 6 · Ruptura'}</strong><p>{personagem.rupturaNaCena ? 'Novos aumentos ficam limitados a 5 até a próxima cena.' : 'Perde 5 de Sanidade e o Medo retorna a 3. Uma vez por cena.'}</p></div>
        <div className="medo-acoes" aria-label="Ajustar Medo">
          <button type="button" aria-label="+2 Medo" onClick={() => setPersonagem(p => alterarMedo(p, 2))}><strong>+2 Medo</strong><small>Acontecimento aterrorizante</small></button>
          <button type="button" aria-label="+3 Medo" onClick={() => setPersonagem(p => alterarMedo(p, 3))}><strong>+3 Medo</strong><small>Horror extremo</small></button>
          <button type="button" onClick={() => setPersonagem(p => alterarMedo(p, -2))}><strong>Alcançar segurança</strong><small>−2 Medo</small></button>
          <button type="button" aria-label="Nova cena" onClick={() => setPersonagem(p => ({ ...p, rupturaNaCena: false, esperancaNaCena: false }))}><strong>Nova cena</strong><small>Renova o limite de Ruptura</small></button>
        </div>
        <details className="medo-recuperacao"><summary>Recuperação e sessão</summary><div className="medo-acoes">
          <button type="button" onClick={() => setPersonagem(p => descansar(p))}><strong>Descanso seguro · 6h</strong><small>+2 Esperança · Medo volta a 0</small></button>
          <button type="button" disabled={personagem.ultimaRecuperacaoSanidade === hoje} onClick={() => setPersonagem(p => ({ ...p, ultimaRecuperacaoSanidade: hoje, sanidade: { ...p.sanidade, atual: Math.min(p.sanidade.max, p.sanidade.atual + 1) } }))}><strong>Repouso seguro · 1 dia</strong><small>+1 Sanidade · uma vez por dia</small></button>
          <button type="button" disabled={personagem.esperancaNaCena || personagem.esperancaNarrativaSessao >= 2} onClick={() => setPersonagem(p => ({ ...p, esperancaNaCena: true, esperancaNarrativaSessao: (p.esperancaNarrativaSessao || 0) + 1, esperanca: { ...p.esperanca, atual: Math.min(p.esperanca.max, p.esperanca.atual + 1) } }))}><strong>Recompensa narrativa</strong><small>+1 Esperança · {personagem.esperancaNarrativaSessao || 0}/2 nesta sessão</small></button>
          <button type="button" onClick={() => setPersonagem(p => ({ ...p, esperancaNarrativaSessao: 0, esperancaNaCena: false }))}><strong>Nova sessão</strong><small>Renova recompensas narrativas</small></button>
        </div></details>
      </section>
    </details>
  </div>;
}
