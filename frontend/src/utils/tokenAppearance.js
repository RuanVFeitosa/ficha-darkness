export const coresBordaToken = (cores) =>
  (Array.isArray(cores) ? cores : [])
    .filter((cor) => typeof cor === "string" && /^#[0-9a-f]{6}$/i.test(cor))
    .slice(0, 4);

export const estiloBordaToken = (cores) => {
  const validas = coresBordaToken(cores);
  if (!validas.length) return {};
  return {
    borderColor: "transparent",
    background: validas.length === 1
      ? validas[0]
      : `conic-gradient(${[...validas, validas[0]].join(", ")})`,
  };
};
