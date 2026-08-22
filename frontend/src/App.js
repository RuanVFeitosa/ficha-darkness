import React, { lazy, Suspense, useEffect, useState } from "react";
import PageTransition from "./pages/pageTransition";
import "./App.css";
import "./CSS/Responsive.css";
import { MESTRE_AUTH_KEY } from "./constants/masterAccess";

const ArvoreHabilidades = lazy(() => import("./pages/arvoreHabilidades"));
const CriarPersonagem = lazy(() => import("./pages/criarPersonagem"));
const DashboardMestre = lazy(() => import("./pages/dashboardMestre"));
const FichaPersonagem = lazy(() => import("./pages/fichaPersonagem"));
const LojaHelena = lazy(() => import("./pages/lojaHelena"));
const Mesa = lazy(() => import("./pages/mesa"));
const TelaInicial = lazy(() => import("./pages/telaInicial"));
const UpgradeNivel = lazy(() => import("./pages/upgradeNivel"));

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

      const href = link.getAttribute("href");

      if (!href || !href.startsWith("?")) return;

      event.preventDefault();

      setTransitionActive(true);

      setTimeout(() => {
        window.history.pushState({}, "", href);
        setSearch(window.location.search);
      }, 700);

    };

    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  const params = new URLSearchParams(search);

  const temFicha = Boolean(params.get("ficha"));
  const estaCriando = params.get("criar") === "1";
  const estaNaLoja = params.get("loja") === "1";
  const estaNaArvoreHabilidades = params.get("habilidades") === "1";
  const estaNoUpgrade = params.get("upgrade") === "1";
  const estaNoDashboardMestre = params.get("mestre") === "1";
  const estaNaMesa = Boolean(params.get("campanha"));
  const mestreAutorizado =
    sessionStorage.getItem(MESTRE_AUTH_KEY) === "true";

  return (
    <div className="App">
      <PageTransition active={transitionActive} />

      <Suspense fallback={null}>
        {estaNaMesa ? (
          <Mesa />
        ) : estaNoDashboardMestre && mestreAutorizado ? (
          <DashboardMestre />
        ) : estaNaArvoreHabilidades ? (
          <ArvoreHabilidades />
        ) : estaNoUpgrade ? (
          <UpgradeNivel />
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
