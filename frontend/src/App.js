import React, { lazy, Suspense, useEffect, useState } from "react";
import PageTransition from "./pages/pageTransition";
import { pageTransitionSystem } from "./utils/pageTransitionSystem";
import "./App.css";
import "./styles/Responsive.css";
import {
  MESTRE_AUTH_KEY,
  TABLETOP_3D_AUTH_KEY,
} from "./constants/masterAccess";
import DialogoGlobal from "./components/ui/DialogoGlobal";
import { hasEspiralToken, readEspiralTabletopSheet, MISSING_ESPIRAL_TOKEN } from "./utils/espiralTabletop";
import LojaEspiral from "./pages/lojaEspiral";
import TransformacaoEspiral from "./pages/transformacaoEspiral";
import Tabletop3DAccess from './components/tabletop/Tabletop3DAccess';

const PaginaJogador = lazy(() => import("./pages/PaginaJogador"));
const ArvoreHabilidades = lazy(() => import("./pages/arvoreHabilidades"));
const CriarPersonagem = lazy(() => import("./pages/cadastroPersonagem"));
const DashboardMestre = lazy(() => import("./pages/dashboardMestre"));
const FichaPersonagem = lazy(() => import("./pages/fichaPersonagem"));
const LojaHelena = lazy(() => import("./pages/lojaHelena"));
const Mesa = lazy(() => import("./pages/mesa"));
const Tabletop3D = lazy(() => import("./pages/Tabletop3D"));
const CriadorMapa3D = lazy(() => import("./pages/CriadorMapa3D"));
const TelaInicial = lazy(() => import("./pages/telaInicial"));
const UpgradeNivel = lazy(() => import("./pages/upgradeNivel"));
const FichaEspiral = lazy(() => import("./pages/fichaEspiral"));

function App() {
  const [transitionFicha,setTransitionFicha]=useState(()=>new URLSearchParams(window.location.search).has('ficha'));
  const [search, setSearch] = useState(window.location.search);
  const [tabletopUnlocked, setTabletopUnlocked] = useState(false);
  const [transitionActive, setTransitionActive] = useState(() => Boolean(window.location.search));
  const [transitionSystem,setTransitionSystem]=useState(() => pageTransitionSystem(window.location.search));

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setTransitionActive(false);
    }, 1000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest("a");

      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      let href = link.getAttribute("href");

      if (!href || !href.startsWith("?")) return;

      const destination = new URLSearchParams(href);
      if (new URLSearchParams(window.location.search).get('sistema') === 'darkness' && !destination.has('sistema')) {
        destination.set('sistema', 'darkness');
        href = `?${destination.toString()}`;
      }

      event.preventDefault();

      setTransitionFicha(destination.has('ficha') && !destination.has('jogador'));
      setTransitionSystem(pageTransitionSystem(destination.has("sistema") ? href : window.location.search));
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
  void (params.get("sistema") === "darkness");
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
  const estaNoCriadorMapa3D = params.get("criarMapa3d") === "1";
  const mestreAutorizado =
    sessionStorage.getItem(MESTRE_AUTH_KEY) === "true";
  const tabletop3DAutorizado =
    tabletopUnlocked || sessionStorage.getItem(TABLETOP_3D_AUTH_KEY) === "true" || (params.get('papel') === 'mestre' && mestreAutorizado);

  useEffect(() => {
    if (temFicha) return undefined;
    const pageTitle = new URLSearchParams(search).has("jogador") ? "Perfil do Jogador" : estaNoCriadorMapa3D ? "Criador de mapas 3D" : new URLSearchParams(search).get("tabletop3d") === "1" ? "Tabletop 3D" : estaNaMesa
      ? "Tabletop"
      : estaNoDashboardMestre
        ? "Painel do Mestre"
        : estaNaArvoreHabilidades
          ? "Árvore de Habilidades"
          : estaNoUpgrade
            ? "Upgrade"
            : estaNaLoja || estaNaLojaEspiral
              ? "Loja"
              : estaNaTransformacaoEspiral
                ? "Transformação"
                : temFicha
                  ? "Ficha de personagem"
                  : estaCriando
                    ? "Criar personagem"
                    : "Darkness";
    document.title = pageTitle;
  }, [
    search,
    estaCriando,
    estaNaArvoreHabilidades,
    estaNaLoja,
    estaNaLojaEspiral,
    estaNaMesa,
    estaNoCriadorMapa3D,
    estaNaTransformacaoEspiral,
    estaNoDashboardMestre,
    estaNoUpgrade,
    temFicha,
  ]);

  if(params.get("tabletop3d")==="1" && sistemaEspiral && params.get("papel")!=="mestre" && !hasEspiralToken(readEspiralTabletopSheet(params.get("ficha") || "principal"))) {
    return <><PageTransition active={transitionActive} sistema={transitionSystem} simboloSistema={transitionFicha}/><DialogoGlobal /><Suspense fallback={<div>Carregando ficha…</div>}><FichaEspiral tabletopAccessError={MISSING_ESPIRAL_TOKEN}/></Suspense></>;
  }
  if (!params.has("jogador") && params.get("tabletop3d") !== "1" && sistemaEspiral && !estaCriando && !estaNaMesa && !estaNoDashboardMestre && !estaNaLoja && !estaNaLojaEspiral && !estaNaTransformacaoEspiral && !estaNaArvoreHabilidades && !estaNoUpgrade) {
    return <><PageTransition active={transitionActive} sistema={transitionSystem} simboloSistema={transitionFicha}/><DialogoGlobal /><Suspense fallback={<div style={{ color: '#aaa', padding: 40 }}>Abrindo ficha…</div>}><FichaEspiral key={params.get('ficha') || 'principal'} /></Suspense></>;
  }

  return (
    <div className="App">
      <PageTransition active={transitionActive} sistema={transitionSystem} simboloSistema={transitionFicha} />
      <DialogoGlobal />

      <Suspense fallback={<div style={{ color: "#eee", padding: 40 }}>Abrindo a loja…</div>}>
        {params.has("jogador") ? (<PaginaJogador codigo={params.get("jogador")} />) : estaNoCriadorMapa3D && mestreAutorizado ? (
          <CriadorMapa3D />
        ) : params.get("tabletop3d") === "1" ? (
          tabletop3DAutorizado ? <Tabletop3D /> : <Tabletop3DAccess onAuthorized={() => setTabletopUnlocked(true)} />
        ) : estaNaMesa ? (
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
          <CriarPersonagem key={params.get("sistema") || "escolha"} />
        ) : (
          <TelaInicial />
        )}
      </Suspense>
    </div>
  );
}

export default App;
