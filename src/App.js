// src/App.js
import React from 'react';
import CriarPersonagem from './pages/criarPersonagem';
import DashboardMestre from './pages/dashboardMestre';
import FichaPersonagem from './pages/fichaPersonagem';
import LojaHelena from './pages/lojaHelena';
import TelaInicial from './pages/telaInicial';
import './App.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const temFicha = Boolean(params.get('ficha'));
  const estaCriando = params.get('criar') === '1';
  const estaNaLoja = params.get('loja') === '1';
  const estaNoDashboardMestre = params.get('mestre') === '1';

  return (
    <div className="App">
      {estaNoDashboardMestre ? (
        <DashboardMestre />
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
