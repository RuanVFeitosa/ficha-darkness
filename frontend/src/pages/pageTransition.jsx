import { useEffect, useState } from "react";

export default function PageTransition() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-transition ${active ? "active" : ""}`}>
      <img src="/transicao.webp" alt="" decoding="async" />
    </div>
  );
}
