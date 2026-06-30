export const SYNC_INTERVALS = {
  ficha: 45000,
  loja: 60000,
  dashboardFicha: 30000,
  dashboardListas: 60000,
  arvores: 60000,
  autoSaveDebounce: 1500,
};

export const paginaEstaVisivel = () =>
  typeof document === "undefined" || !document.hidden;

export const iniciarPollingVisivel = (callback, intervaloMs) => {
  const executarSeVisivel = () => {
    if (paginaEstaVisivel()) {
      callback();
    }
  };

  const intervalo = window.setInterval(executarSeVisivel, intervaloMs);

  const aoVoltarFoco = () => {
    if (paginaEstaVisivel()) {
      callback();
    }
  };

  document.addEventListener("visibilitychange", aoVoltarFoco);

  return () => {
    window.clearInterval(intervalo);
    document.removeEventListener("visibilitychange", aoVoltarFoco);
  };
};
