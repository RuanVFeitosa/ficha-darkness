import TabletopSheetGate from './components/tabletop/TabletopSheetGate';
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import PageTransition from "./pages/pageTransition";
import { pageTransitionSystem } from "./utils/pageTransitionSystem";
import "./App.css";
import "./styles/Responsive.css";
import "./styles/ProtocoloDarkness.css";
import DialogoGlobal from "./components/ui/DialogoGlobal";
import { MISSING_ESPIRAL_TOKEN } from "./utils/espiralTabletop";
import LojaEspiral from "./pages/lojaEspiral";
import TransformacaoEspiral from "./pages/transformacaoEspiral";
import { useAmbientPlayback } from './utils/useLoginAmbient';
import AmbientMusicControls from './components/ui/AmbientMusicControls';
import { sessaoMestre, sairMestre } from './services/masterAccounts';

const PaginaJogador = lazy(() => import("./pages/PaginaJogador"));
const ArvoreHabilidades = lazy(() => import("./pages/arvoreHabilidades"));
const CriarPersonagem = lazy(() => import("./pages/cadastroPersonagem"));
const DashboardMestre = lazy(() => import("./pages/dashboardMestre"));
const PainelMestreIndividual = lazy(() => import("./pages/PainelMestreIndividual"));
const PainelMestreOrdem = lazy(() => import("./pages/PainelMestreOrdem"));
const CadastroMestre = lazy(() => import("./pages/CadastroMestre"));
const MasterPlayerAccess = lazy(() => import("./components/mestre/MasterPlayerAccess"));
const DashboardMaster = lazy(() => import("./components/mestre/MasterAccounts"));
const FichaPersonagem = lazy(() => import("./pages/fichaPersonagem"));
const LojaHelena = lazy(() => import("./pages/lojaHelena"));
const Mesa = lazy(() => import("./pages/mesa"));
const Tabletop3D = lazy(() => import("./pages/Tabletop3D"));
const CriadorMapa3D = lazy(() => import("./pages/CriadorMapa3D"));
const CriadorCutscene = lazy(() => import("./pages/CriadorCutscene"));
const TelaInicial = lazy(() => import("./pages/telaInicial"));
const UpgradeNivel = lazy(() => import("./pages/upgradeNivel"));
const FichaEspiral = lazy(() => import("./pages/fichaEspiral"));
const FichaOrdem = lazy(() => import("./pages/fichaOrdem"));
const CriarOrdem = lazy(() => import("./pages/criarOrdem"));

function App() {
  useAmbientPlayback();
  const [transitionFicha,setTransitionFicha]=useState(()=>new URLSearchParams(window.location.search).has('ficha'));
  const [search, setSearch] = useState(window.location.search);
  const [sessao, setSessao] = useState(null);
  const [transitionActive, setTransitionActive] = useState(() => Boolean(window.location.search));
  const [transitionSystem,setTransitionSystem]=useState(() => pageTransitionSystem(window.location.search));
  const transitionTimers = useRef([]);

  const navegarComTransicao = useCallback((destino, atualizarHistorico = true) => {
    transitionTimers.current.forEach(clearTimeout);
    const url = new URL(destino, window.location.href);
    const destination = url.searchParams;
    if (atualizarHistorico && new URLSearchParams(window.location.search).get('sistema') === 'darkness' && !destination.has('sistema')) {
      destination.set('sistema', 'darkness');
    }
    setTransitionFicha(destination.has('ficha') && !destination.has('jogador'));
    setTransitionSystem(pageTransitionSystem(destination.has('sistema') || destination.has('mestre') || destination.has('papel') ? url.search : window.location.search));
    setTransitionActive(true);
    transitionTimers.current = [setTimeout(() => {
      if (atualizarHistorico) window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setSearch(url.search);
    }, 700), setTimeout(() => setTransitionActive(false), 1000)];
  }, []);

  useEffect(() => {
    transitionTimers.current = [setTimeout(() => {
      setTransitionActive(false);
    }, 1000)];

    return () => transitionTimers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest?.("a");

      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href");

      if (!href || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || href.startsWith('#')) return;

      event.preventDefault();

      navegarComTransicao(href);

    };

    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, [navegarComTransicao]);

  useEffect(() => {
    const onPopState = () => navegarComTransicao(window.location.href, false);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navegarComTransicao]);

  const params = new URLSearchParams(search);
  void (params.get("sistema") === "darkness");
  const sistemaEspiral = params.get("sistema") === "espiral" || (params.get("sistema") === "darkness" && params.get("protocolo") === "1");

  useEffect(() => {
    const rota = new URLSearchParams(search);
    const sistema = rota.get('sistema');
    const areaFicha = ['ficha', 'upgrade', 'habilidades', 'criar', 'loja', 'lojaEspiral', 'transformacao'].some(chave => rota.has(chave));
    document.documentElement.dataset.controlTheme = areaFicha && sistema === 'darkness' ? 'absoluto' : areaFicha && sistema === 'espiral' ? 'espiral' : 'site';
    return () => { delete document.documentElement.dataset.controlTheme; };
  }, [search]);

  const temFicha = Boolean(params.get("ficha"));
  const estaCriando = params.get("criar") === "1";
  const estaNaFichaOrdem = params.get("ordem") === "1";
  const estaNaLoja = params.get("loja") === "1";
  const estaNaLojaEspiral = params.get("lojaEspiral") === "1";
  const estaNaTransformacaoEspiral = params.get("transformacao") === "1";
  const estaNaArvoreHabilidades = params.get("habilidades") === "1";
  const estaNoUpgrade = params.get("upgrade") === "1";
  const estaNoDashboardMestre = params.get("mestre") === "1";
  const estaNoCadastroMestre = params.get("mestre") === "novo";
  const perfilViaMestre = params.has('jogador') && params.get('origem') === 'mestre';
  const estaNoPainelMestreOrdem = estaNoDashboardMestre && (params.get("sistema") === "ordem" || params.get("aba") === "ordem");
  const estaNoDashboardMaster = params.get("master") === "1";
  const estaNaMesa = Boolean(params.get("campanha"));
  const estaNoCriadorMapa3D = params.get("criarMapa3d") === "1";
  const estaNoTabletop3D = params.get("tabletop3d") === "1";
  const estaNoCriadorCutscene = params.get('cutscene') === '1';
  const verificarMestre = estaNoDashboardMaster || estaNoDashboardMestre || perfilViaMestre || estaNoCriadorMapa3D || estaNoTabletop3D || estaNoCriadorCutscene || params.get('papel') === 'mestre';
  useEffect(() => {
    if (!verificarMestre) return undefined;
    let ativo = true;
    sessaoMestre().catch(() => null).then(usuario => {
      if (ativo) setSessao({ search, usuario });
    });
    return () => { ativo = false; };
  }, [search, verificarMestre]);
  const usuarioMestre = sessao?.search === search ? sessao.usuario : null;
  const mestreAutorizado = Boolean(usuarioMestre);
  const sairDaAreaMestre = () => {
    sairMestre();
    setSessao(null);
    navegarComTransicao('/');
  };
  const tabletop3DAutorizado = usuarioMestre?.papel === 'proprietario';

  useEffect(() => {
    if (estaNaFichaOrdem) {
      document.title = estaCriando ? 'Criar agente de Ordem Paranormal' : 'Ficha de Ordem Paranormal';
      return undefined;
    }
    if (temFicha) return undefined;
    const pageTitle = estaNoCriadorCutscene ? 'Estúdio de cutscenes' : new URLSearchParams(search).has("jogador") ? "Perfil do Jogador" : estaNoCriadorMapa3D ? "Editor de mapas 3D" : new URLSearchParams(search).get("tabletop3d") === "1" ? "Tabletop 3D" : estaNaMesa
      ? "Tabletop"
      : estaNoDashboardMaster ? "Dashboard Master"
      : estaNoDashboardMestre
        ? estaNoPainelMestreOrdem ? "Painel do Mestre · Ordem Paranormal" : "Painel do Mestre"
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
    estaNaFichaOrdem,
    estaNaArvoreHabilidades,
    estaNaLoja,
    estaNaLojaEspiral,
    estaNaMesa,
    estaNoCriadorMapa3D,
    estaNoCriadorCutscene,
    estaNaTransformacaoEspiral,
    estaNoDashboardMestre,
    estaNoPainelMestreOrdem,
    estaNoDashboardMaster,
    estaNoUpgrade,
    temFicha,
  ]);

  const conviteCampanha = params.get('conviteCampanha');
  const campanhaJogador = params.get('campanhaJogador');
  if (conviteCampanha || campanhaJogador) {
    const codigo = params.get('jogador') || sessionStorage.getItem('darkness:jogador');
    return <Suspense fallback={<p role="status">Abrindo campanha…</p>}>
      {codigo ? <PaginaJogador key={codigo} codigo={codigo} conviteCampanha={conviteCampanha}
        campanhaJogador={campanhaJogador} onNavigate={navegarComTransicao} />
        : <TelaInicial onNavigate={destino => {
          const url = new URL(destino, window.location.origin);
          if (url.searchParams.has('jogador')) {
            if (conviteCampanha) url.searchParams.set('conviteCampanha', conviteCampanha);
            else url.searchParams.set('campanhaJogador', campanhaJogador);
          }
          navegarComTransicao(url.pathname + url.search);
        }} />}
    </Suspense>;
  }

  if (estaNaFichaOrdem) {
    const origem = params.get('jogadorOrigem');
    const backHref = origem ? `/?jogador=${encodeURIComponent(origem)}` : undefined;
    return <Suspense fallback={<p role="status">Abrindo Ordem Paranormal…</p>}>
      {estaCriando ? <CriarOrdem key={origem} backHref={backHref} jogadorOrigem={origem} /> : <FichaOrdem key={origem} backHref={backHref} jogadorOrigem={origem} />}
    </Suspense>;
  }

  if (!params.has("jogador") && params.get("tabletop3d") !== "1" && sistemaEspiral && !estaCriando && !estaNaMesa && !verificarMestre && !estaNaLoja && !estaNaLojaEspiral && !estaNaTransformacaoEspiral && !estaNaArvoreHabilidades && !estaNoUpgrade) {
    return <><PageTransition active={transitionActive} sistema={transitionSystem} simboloSistema={transitionFicha}/><DialogoGlobal /><Suspense fallback={<div style={{ color: '#aaa', padding: 40 }}>Abrindo ficha…</div>}><FichaEspiral key={params.get('ficha') || 'principal'} /></Suspense></>;
  }

  return (
    <div className="App">
      <PageTransition active={transitionActive} sistema={transitionSystem} simboloSistema={transitionFicha} />
      <DialogoGlobal />
      {Boolean(search && search !== '?') && !estaNoDashboardMaster && !estaNaMesa && !estaNoCriadorCutscene && params.get('tabletop3d') !== '1' && <AmbientMusicControls />}

      <Suspense fallback={<div style={{ color: "#eee", padding: 40 }}>Abrindo a loja…</div>}>
        {verificarMestre && sessao?.search !== search ? <p role="status">Verificando acesso de mestre…</p>
          : verificarMestre && !mestreAutorizado ? <TelaInicial modoInicial="mestre" destinoMestre={`/${search}`} />
          : (estaNoCriadorMapa3D || estaNoTabletop3D) && !tabletop3DAutorizado ? <main className="master-access-denied"><h1>Tabletop 3D exclusivo do proprietário</h1><a href="/?mestre=1">Voltar ao Painel do Mestre</a></main>
          : estaNoDashboardMaster ? (
            usuarioMestre.papel === 'proprietario'
              ? <DashboardMaster usuarioMestre={usuarioMestre} onSair={sairDaAreaMestre} />
              : <main className="master-access-denied"><h1>Acesso reservado ao proprietário</h1><a href="/?mestre=1">Abrir Painel de Mestre</a></main>
          )
          : estaNoCadastroMestre ? <CadastroMestre onNavigate={navegarComTransicao} />
          : estaNoCriadorCutscene ? <CriadorCutscene key={params.get('campanha')+':'+params.get('cena')}/> : params.has("jogador") ? (<PaginaJogador key={params.get("jogador")} codigo={params.get("jogador")} abrirCampanhas={params.get("aba") === "campanhas"} mestreId={perfilViaMestre ? usuarioMestre?.id : undefined} onNavigate={navegarComTransicao} />) : estaNoCriadorMapa3D && mestreAutorizado ? (
          <CriadorMapa3D />
        ) : params.get("tabletop3d") === "1" ? (
          <TabletopSheetGate key={params.get("ficha") || "principal"} id={params.get("ficha") || "principal"} enabled={sistemaEspiral && params.get("papel") !== "mestre"} missing={<FichaEspiral tabletopAccessError={MISSING_ESPIRAL_TOKEN}/>} >{sheet => <Tabletop3D initialPlayerSheet={sheet}/>}</TabletopSheetGate>
        ) : estaNaMesa ? (
          <Mesa podeUsar3D={tabletop3DAutorizado} />
        ) : estaNoDashboardMestre && mestreAutorizado ? (
          params.get('personagens') === '1'
            ? <MasterPlayerAccess mestreId={usuarioMestre.id} onNavigate={navegarComTransicao} />
            : usuarioMestre.papel === 'proprietario'
            ? estaNoPainelMestreOrdem
              ? <PainelMestreOrdem usuario={usuarioMestre} onSair={sairDaAreaMestre} />
              : <DashboardMestre usuarioMestre={usuarioMestre} onAbrirMaster={() => navegarComTransicao('/?master=1')} onSair={sairDaAreaMestre} />
            : <PainelMestreIndividual key={usuarioMestre.id} usuario={usuarioMestre} onSair={sairDaAreaMestre} />
        ) : estaNaArvoreHabilidades ? (
          <ArvoreHabilidades />
        ) : estaNoUpgrade ? (
          <UpgradeNivel key={params.get('senha') || params.get('codigo') || params.get('ficha') || 'principal'} />
        ) : estaNaTransformacaoEspiral ? (
          <TransformacaoEspiral key={params.get('ficha') || 'principal'} />
        ) : estaNaLojaEspiral ? (
          <LojaEspiral />
        ) : estaNaLoja ? (
          <LojaHelena />
        ) : temFicha ? (
          <FichaPersonagem key={params.get('senha') || params.get('codigo') || params.get('ficha') || 'principal'} />
        ) : estaCriando ? (
          <CriarPersonagem key={params.get("sistema") || "escolha"} />
        ) : (
          <TelaInicial onNavigate={navegarComTransicao} />
        )}
      </Suspense>
    </div>
  );
}

export default App;
