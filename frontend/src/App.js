import React, { lazy, Suspense, useEffect, useState } from "react";
import PageTransition from "./pages/pageTransition";
import "./App.css";
import "./CSS/Responsive.css";
import { MESTRE_AUTH_KEY } from "./constants/masterAccess";
import DialogoGlobal from "./components/DialogoGlobal";
import LojaEspiral from "./pages/lojaEspiral";
import TransformacaoEspiral from "./pages/transformacaoEspiral";

const ArvoreHabilidades = lazy(() => import("./pages/arvoreHabilidades"));
const CriarPersonagem = lazy(() => import("./pages/criarPersonagem"));
const DashboardMestre = lazy(() => import("./pages/dashboardMestre"));
const FichaPersonagem = lazy(() => import("./pages/fichaPersonagem"));
const LojaHelena = lazy(() => import("./pages/lojaHelena"));
const Mesa = lazy(() => import("./pages/mesa"));
const TelaInicial = lazy(() => import("./pages/telaInicial"));
const UpgradeNivel = lazy(() => import("./pages/upgradeNivel"));
const FichaEspiral = lazy(() => import("./pages/fichaEspiral"));

function App() {
  const [search, setSearch] = useState(window.location.search);
  const [transitionActive, setTransitionActive] = useState(true);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setTransitionActive(false);
    }, 1000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest("a");

      if (!link) return;

      let href = link.getAttribute("href");

      if (!href || !href.startsWith("?")) return;

      const destination = new URLSearchParams(href);
      if (new URLSearchParams(window.location.search).get('sistema') === 'darkness' && !destination.has('sistema')) {
        destination.set('sistema', 'darkness');
        href = `?${destination.toString()}`;
      }

      event.preventDefault();

      setTransitionActive(true);

      setTimeout(() => {
        window.history.pushState({}, "", href);
        setSearch(window.location.search);
        setTimeout(() => setTransitionActive(false), 300);
      }, 700);

    };

    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const onPopState = () => setSearch(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const params = new URLSearchParams(search);
  const sistemaAnterior = params.get("sistema") === "darkness";
  const sistemaEspiral = params.get("sistema") === "espiral";

  const temFicha = Boolean(params.get("ficha"));
  const estaCriando = params.get("criar") === "1";
  const estaNaLoja = params.get("loja") === "1";
  const estaNaLojaEspiral = params.get("lojaEspiral") === "1";
  const estaNaTransformacaoEspiral = params.get("transformacao") === "1";
  const estaNaArvoreHabilidades = params.get("habilidades") === "1";
  const estaNoUpgrade = params.get("upgrade") === "1";
  const estaNoDashboardMestre = params.get("mestre") === "1";
  const estaNaMesa = Boolean(params.get("campanha"));
  const mestreAutorizado =
    sessionStorage.getItem(MESTRE_AUTH_KEY) === "true";

  if (sistemaEspiral && !estaNaMesa && !estaNoDashboardMestre && !estaNaLoja && !estaNaLojaEspiral && !estaNaTransformacaoEspiral && !estaNaArvoreHabilidades && !estaNoUpgrade) {
    return <><DialogoGlobal /><Suspense fallback={<div style={{ color: '#aaa', padding: 40 }}>Abrindo arquivo ESPIRAL…</div>}><FichaEspiral key={params.get('ficha') || 'principal'} /></Suspense></>;
  }

  return (
    <div className="App">
      <PageTransition active={transitionActive} />
      <DialogoGlobal />

      <Suspense fallback={<div style={{ color: "#eee", padding: 40 }}>Abrindo a loja…</div>}>
        {estaNaMesa ? (
          <Mesa />
        ) : estaNoDashboardMestre && mestreAutorizado ? (
          <DashboardMestre />
        ) : estaNaArvoreHabilidades ? (
          <ArvoreHabilidades />
        ) : estaNoUpgrade ? (
          <UpgradeNivel />
        ) : estaNaTransformacaoEspiral ? (
          <TransformacaoEspiral />
        ) : estaNaLojaEspiral ? (
          <LojaEspiral />
        ) : estaNaLoja ? (
          <LojaHelena />
        ) : temFicha ? (
          <FichaPersonagem />
        ) : estaCriando ? (
          <CriarPersonagem />
        ) : (
          <TelaInicial />
        )}
      </Suspense>
    </div>
  );
}

export default App;
