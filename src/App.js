// src/App.js
import React from 'react';
import ArvoreHabilidades from './pages/arvoreHabilidades';
import CriarPersonagem from './pages/criarPersonagem';
import DashboardMestre from './pages/dashboardMestre';
import FichaPersonagem from './pages/fichaPersonagem';
import LojaHelena from './pages/lojaHelena';
import TelaInicial from './pages/telaInicial';
import UpgradeNivel from './pages/upgradeNivel';
import './App.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const temFicha = Boolean(params.get('ficha'));
  const estaCriando = params.get('criar') === '1';
  const estaNaLoja = params.get('loja') === '1';
  const estaNaArvoreHabilidades = params.get('habilidades') === '1';
  const estaNoUpgrade = params.get('upgrade') === '1';
  const estaNoDashboardMestre = params.get('mestre') === '1';

  return (
    <div className="App">
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
