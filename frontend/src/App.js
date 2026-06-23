import React, { useEffect, useState } from "react";
import ArvoreHabilidades from "./pages/arvoreHabilidades";
import CriarPersonagem from "./pages/criarPersonagem";
import DashboardMestre from "./pages/dashboardMestre";
import FichaPersonagem from "./pages/fichaPersonagem";
import LojaHelena from "./pages/lojaHelena";
import TelaInicial from "./pages/telaInicial";
import UpgradeNivel from "./pages/upgradeNivel";
import "./App.css";
import "./CSS/Responsive.css";

function PageTransition({ active }) {
  return <div className={`page-transition ${active ? "active" : ""}`} />;
}

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

  return (
    <div className="App">
      <PageTransition active={transitionActive} />

      {estaNoDashboardMestre ? (
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
    </div>
  );
}

export default App;
