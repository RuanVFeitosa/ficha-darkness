export default function PageTransition({ active }) {
  return (
    <div className={`page-transition ${active ? "active" : ""}`}>
      <img src="/transicao.webp" alt="" decoding="async" aria-hidden="true" />
    </div>
  );
}
