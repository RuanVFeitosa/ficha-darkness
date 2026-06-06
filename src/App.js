// src/App.js
import React from 'react';
import CriarPersonagem from './pages/criarPersonagem';
import FichaPersonagem from './pages/fichaPersonagem';
import TelaInicial from './pages/telaInicial';
import './App.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const temFicha = Boolean(params.get('ficha'));
  const estaCriando = params.get('criar') === '1';

  return (
    <div className="App">
      {temFicha ? (
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
