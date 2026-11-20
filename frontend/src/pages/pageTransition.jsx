export default function PageTransition({ active, sistema = 'darkness' }) {
  return <div className={`page-transition ${sistema === 'espiral' ? 'page-transition-espiral' : ''} ${active ? 'active' : ''}`} aria-hidden="true">
    <img className="page-transition-symbol" src="/simbolo-darkness.png" alt="" decoding="async"/>
  </div>;
}