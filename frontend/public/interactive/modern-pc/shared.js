if (shared) {
  // Não permita editar uma cópia inicial antes de receber o documento real.
  document.querySelector('#app').inert = true;
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'darkness:pc-load') return;
    const content = event.data.content;
    if (content !== null && (!content || !['pages', 'messages', 'files', 'emails'].every(key => Array.isArray(content[key])))) return;
    const next = content || structuredClone(initial);
    if (!sharedReady || JSON.stringify(data) !== JSON.stringify(next)) {
      data = next;
      render();
    }
    sharedReady = true;
    document.querySelector('#app').inert = false;
    if (admin && content === null && !document.querySelector('#import-legacy')) {
      const button = document.createElement('button');
      button.id = 'import-legacy';
      button.textContent = 'Importar conteúdo antigo deste navegador';
      button.style.cssText = 'position:fixed;right:12px;bottom:55px;z-index:9999;padding:10px';
      button.onclick = () => {
        try {
          const legacy = JSON.parse(localStorage.getItem('darkness-modern-pc') || 'null');
          if (!legacy) return alert('Nenhum conteúdo antigo encontrado neste navegador.');
          data = Object.assign(structuredClone(initial), legacy);
          save(); render(); button.remove();
        } catch { alert('Não foi possível importar o conteúdo antigo.'); }
      };
      document.body.appendChild(button);
    }
    if (content !== null) document.querySelector('#import-legacy')?.remove();
  });
  parent.postMessage({ type: 'darkness:pc-ready' }, location.origin);
}
