const espiralPontos = Array.from({length:400},(_,i)=>{
 const t=i/399,angulo=t*Math.PI*12,raio=3+t*94;
 return `${100+Math.cos(angulo)*raio},${100+Math.sin(angulo)*raio}`;
}).join(' ');
export default function PageTransition({ active, sistema = 'darkness', simboloSistema = false }) {
  return <div className={`page-transition ${sistema === 'espiral' ? 'page-transition-espiral' : ''} ${active ? 'active' : ''}`} aria-hidden="true">
    {simboloSistema && sistema === 'espiral' ? <svg className="page-transition-symbol" viewBox="0 0 200 200" fill="none"><polyline points={espiralPontos} stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> : <img className="page-transition-symbol" src={simboloSistema ? '/simbolo-absoluto.png' : '/simbolo-darkness.png'} alt="" decoding="async"/>}
  </div>;
}