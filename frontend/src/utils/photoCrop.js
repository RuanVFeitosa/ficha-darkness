// Coordinates are fractions of the available travel, keeping the crop inside the image.
export function photoCropRect(width, height, zoom = 1, x = 0.5, y = 0.5) {
  const size = Math.min(width, height) / Math.max(1, zoom);
  return { x: (width - size) * Math.max(0, Math.min(1, x)), y: (height - size) * Math.max(0, Math.min(1, y)), size };
}
