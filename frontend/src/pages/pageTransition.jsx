export default function PageTransition({ active }) {
  return (
    <div className={`page-transition ${active ? "active" : ""}`}>
      <img src="/OAbsoluto.webp" alt="" decoding="async" aria-hidden="true" />
    </div>
  );
}
