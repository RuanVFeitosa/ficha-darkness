// Sweep the whole movement, so even a fast drag cannot jump over a wall.
export const limitarMovimentoToken = (origem, destino, configuracao = {}) => {
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const distancia = Math.hypot(dx, dy);
  if (!distancia) return { ...origem };
  let limite = 1;
  const bloqueadores = [
    ...(configuracao?.paredes || []),
    ...(configuracao?.portas || []).filter((porta) => !porta.aberta),
  ];
  for (const parede of bloqueadores) {
    const sx = parede.x2 - parede.x1;
    const sy = parede.y2 - parede.y1;
    const divisor = dx * sy - dy * sx;
    if (Math.abs(divisor) < 1e-10) continue;
    const ox = parede.x1 - origem.x;
    const oy = parede.y1 - origem.y;
    const t = (ox * sy - oy * sx) / divisor;
    const u = (ox * dy - oy * dx) / divisor;
    if (t >= -1e-10 && t <= 1 && u >= -1e-10 && u <= 1 + 1e-10) {
      limite = Math.min(limite, Math.max(0, t - 0.05 / distancia));
    }
  }
  return { x: origem.x + dx * limite, y: origem.y + dy * limite };
};
