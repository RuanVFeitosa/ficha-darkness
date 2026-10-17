export function rotacaoToken(rotacao = 0, olharCamera = true, camera = [0,0], position = [0,0]) {
  if (olharCamera !== false) return Math.atan2(camera[0]-position[0],camera[1]-position[1]);
  return ((Number(rotacao) || 0) % 360) * Math.PI / 180;
}
