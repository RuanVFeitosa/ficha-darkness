import React, { useEffect, useRef, useState } from 'react';
import { lerConteudoComputador, ouvirConteudoComputador, salvarConteudoComputador } from '../services/mesaApi';

export default function ComputadorModerno({ campanhaId, documento, admin }) {
  const frame = useRef(null);
  const [status, setStatus] = useState('Carregando conteúdo compartilhado…');
  useEffect(() => {
    let ativo = true;
    let fila = Promise.resolve();
    let carregamento = null;
    let carregado = false;
    let ultimoConteudo = null;
    const enviar = (type, content) => frame.current?.contentWindow?.postMessage({ type, content }, window.location.origin);
    const carregar = async () => {
      if (carregamento) return carregamento;
      carregamento = (async () => {
      try {
        const content = await lerConteudoComputador(campanhaId, documento.id);
        if (!ativo) return;
        ultimoConteudo = content;
        carregado = true;
        enviar('darkness:pc-load', content);
        setStatus('Conteúdo compartilhado carregado.');
      } catch (error) { if (ativo) setStatus(error.message); }
      finally { carregamento = null; }
      })();
      return carregamento;
    };
    const pararEscuta = ouvirConteudoComputador(campanhaId, documento.id, content => {
      if (!ativo) return;
      ultimoConteudo = content;
      carregado = true;
      enviar('darkness:pc-load', content);
      setStatus('Conteúdo atualizado em tempo real.');
    });
    const receber = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'darkness:pc-ready') {
        if (carregado) enviar('darkness:pc-load', ultimoConteudo);
        else carregar();
      }
      if (event.data?.type === 'darkness:pc-save' && admin) {
        setStatus('Salvando conteúdo para os jogadores…');
        fila = fila.then(() => salvarConteudoComputador(campanhaId, documento.id, event.data.content))
          .then(() => { if (ativo) setStatus('Conteúdo salvo para os jogadores.'); })
          .catch(error => { if (ativo) setStatus(`Falha ao compartilhar: ${error.message}`); });
      }
    };
    window.addEventListener('message', receber);
    carregar();
    return () => { ativo = false; pararEscuta(); window.removeEventListener('message', receber); };
  }, [campanhaId, documento.id, admin]);
  return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <small role="status" style={{ padding: 8 }}>{status}</small>
    <iframe ref={frame} className="evidencia-interativa-frame" style={{ flex: 1 }} title={documento.nome || 'Computador moderno'}
      src={`/interactive/modern-pc/index.html?shared=1&document=${encodeURIComponent(documento.id)}${admin ? '&admin=1' : ''}`} allow="autoplay" />
  </div>;
}
