// Keep closing surfaces mounted until their exit motion finishes.
export function fecharAnimado(elemento, finalizar) {
 if (!elemento?.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) { finalizar(); return; }
 if (elemento.dataset.fechando === 'true') return;
 elemento.dataset.fechando = 'true';
 const animacao = elemento.animate([
  {opacity:1,transform:'translateY(0) scale(1)'},
  {opacity:0,transform:'translateY(10px) scale(.985)'}
 ],{duration:160,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
 animacao.finished.then(finalizar, finalizar);
}